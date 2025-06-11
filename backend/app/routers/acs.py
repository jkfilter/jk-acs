# app/routers/acs.py

from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .. import crud, database, schemas, models
from ..websocket_manager import manager
import json

from .. import services, dependencies

# --- روتر امن برای ارتباط با GenieACS ---
# این روتر برای تمام اندپوینت‌های خود نیازمند دسترسی 'acs:view_details' است
router = APIRouter(
    prefix="/acs",
    tags=["ACS"],
    dependencies=[Depends(dependencies.require_permission("acs:view_details"))]
)

# --- روتر برای داده‌های نمودارها ---
# این روتر نیاز به احراز هویت ندارد و تگ جداگانه‌ای دارد
chart_router = APIRouter(
    prefix="/acs/chart",
    tags=["Charts"]
)

# یک روتر جدید برای وب‌هوک‌ها می‌سازیم تا با روتر امن اصلی تداخل نداشته باشد
webhook_router = APIRouter(
    prefix="/acs/webhook",
    tags=["ACS Webhooks"]
)

@router.get("/devices/", response_model=List[Dict[str, Any]])
async def get_all_devices():
    """
    لیست تمام مودم‌ها را از سرور GenieACS دریافت می‌کند.
    """
    return await services.get_all_devices_from_acs()

@router.get("/devices/{device_id}", response_model=Dict[str, Any])
async def get_specific_device(device_id: str):
    """
    اطلاعات یک دستگاه خاص را از GenieACS دریافت می‌کند.
    """
    return await services.get_device_details_from_acs(device_id)


# --- اندپوینت‌های مربوط به نمودارها ---

@chart_router.get("/devices")
def get_device_status_stats():
    """ آمار وضعیت دستگاه‌ها را برای نمودار برمی‌گرداند """
    return [
        {"name": "Online", "value": 12},
        {"name": "Offline", "value": 5},
        {"name": "Connecting", "value": 2},
    ]

@chart_router.get("/users")
def get_daily_active_users():
    """ آمار کاربران فعال روزانه را برای نمودار برمی‌گرداند """
    return [
        {"name": "شنبه", "users": 10},
        {"name": "یکشنبه", "users": 15},
        {"name": "دوشنبه", "users": 8},
        {"name": "سه‌شنبه", "users": 26},
        {"name": "چهارشنبه", "users": 18},
        {"name": "پنجشنبه", "users": 24},
        {"name": "جمعه", "users": 13},
    ]

@chart_router.get("/traffic")
def get_traffic_stats():
    """ آمار ترافیک را برای نمودار برمی‌گرداند """
    return [
        {"name": "شنبه", "traffic": 1200},
        {"name": "یکشنبه", "traffic": 2000},
        {"name": "دوشنبه", "traffic": 1800},
        {"name": "سه شنبه", "traffic": 1100},
        {"name": "چهارشنبه", "traffic": 1500},
        {"name": "پنجشنبه", "traffic": 1300},
        {"name": "جمعه", "traffic": 1600},
    ]


@router.post("/tasks/change-wifi-password", status_code=status.HTTP_200_OK)
async def task_change_wifi_password(
    request: schemas.ChangeWifiPasswordRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user_from_db)
):
    """
    یک تسک برای تغییر رمز وای‌فای دستگاه در GenieACS ایجاد می‌کند.
    نیازمند دسترسی 'acs:task_wifi' است.
    """
    # پارامتر دقیق ممکن است بسته به مدل مودم شما متفاوت باشد
    # این یک نمونه رایج برای مودم‌های خانگی است
    wifi_param_path = "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.PreSharedKey.1.PreSharedKey"
    
    # تعریف تسک برای ارسال به GenieACS
    genieacs_task = {
        "name": "setParameterValues",
        "parameterValues": [
            [wifi_param_path, request.newPassword, "xsd:string"]
        ]
    }

    if crud.check_pending_task_exists(db, device_id=request.deviceId, task_name=genieacs_task["name"]):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, # کد وضعیت 409 Conflict مناسب است
            detail="یک دستور مشابه برای تغییر رمز این دستگاه در حال حاضر در صف قرار دارد."
        )

    try:
        # ۱. ارسال تسک به GenieACS
        genieacs_task_id = await services.create_genieacs_task(
            device_id=request.deviceId,
            task_payload=genieacs_task
        )

        # ۲. ذخیره لاگ موفقیت آمیز در دیتابیس
        log_entry = schemas.TaskLogCreate(
            device_id=request.deviceId,
            task_name="change_wifi_password",
            status="sent_to_genieacs",
            payload=genieacs_task,
            created_by_user_id=current_user.id,
            genieacs_task_id=genieacs_task_id
        )
        crud.create_task_log(db, task=log_entry) # باید تابع crud را هم آپدیت کنید
        return {"detail": "دستور تغییر رمز وای‌فای با موفقیت به سرور ارسال شد."}

    except HTTPException as e:
        # ۳. اگر خطایی در ارتباط با GenieACS رخ داد، آن را لاگ کن
        log_entry = schemas.TaskLogCreate(
            device_id=request.deviceId,
            task_name="change_wifi_password",
            status="failed",
            payload={"error": e.detail}, # ذخیره جزئیات خطا
            created_by_user_id=current_user.id,
            genieacs_task_id=genieacs_task_id
        )
        crud.create_task_log(db, task=log_entry)
        # همان خطا را به فرانت‌اند برگردان
        raise e
    
@router.get("/devices/{device_id}/tasks", response_model=List[schemas.TaskLog])
def get_device_tasks(
    device_id: str,
    db: Session = Depends(database.get_db),
    # دسترسی این اندپوینت را با دسترسی مشاهده جزئیات یکی در نظر می‌گیریم
    current_user: models.User = Depends(dependencies.get_current_user_from_db)
):
    """ لیست آخرین تسک‌های ارسال شده برای یک دستگاه را برمی‌گرداند. """
    return crud.get_task_logs_for_device(db=db, device_id=device_id)



@webhook_router.post("/task-result", status_code=status.HTTP_204_NO_CONTENT)
async def handle_genieacs_webhook(
    payload: schemas.GenieACSWebhookPayload,
    x_webhook_secret: Optional[str] = Header(None),
    db: Session = Depends(database.get_db)
):
    """
    این اندپوینت گزارش‌های ارسالی (Webhook) از GenieACS را دریافت می‌کند.
    این اندپوینت نباید محافظت شده باشد چون توسط سرور فراخوانی می‌شود.
    """
    # قدم ۱: امن‌سازی اندپوینت
    # YOUR_VERY_SECRET_KEY باید با مقداری که در GenieACS تنظیم کرده‌اید یکسان باشد
    if x_webhook_secret != "YOUR_VERY_SECRET_KEY":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid webhook secret")

    # قدم ۲: پردازش منطق
    # پیدا کردن آخرین تسک "در انتظار" برای این دستگاه
    task_log = db.query(models.TaskLog)\
        .filter(models.TaskLog.device_id == payload.deviceId)\
        .filter(models.TaskLog.status == 'sent_to_genieacs')\
        .order_by(models.TaskLog.created_at.desc())\
        .first()

    if task_log:
        # قدم ۳: به‌روزرسانی وضعیت تسک
        # اگر آبجکت fault در گزارش وجود داشته باشد یعنی تسک با خطا مواجه شده
        new_status = ""
        if payload.fault and payload.fault.get("FaultCode"):
            task_log.status = 'completed_fault'
            task_log.response = {"fault": payload.fault}
            new_status = 'completed_fault'
        else:
            task_log.status = 'completed_success'
            new_status = 'completed_success'
        
        db.commit()

                # --- بخش جدید: ارسال پیام از طریق WebSocket ---
        update_message = {
            "type": "TASK_UPDATE",
            "task_id": task_log.id,
            "new_status": new_status
        }
        await manager.broadcast_to_device(
            device_id=payload.deviceId,
            message=json.dumps(update_message)
        )

    # کد وضعیت 204 No Content به GenieACS می‌گوید که ما پیام را دریافت کردیم و نیازی به پاسخ نیست
    return

@router.delete("/tasks/{task_log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_log_id: int,
    db: Session = Depends(database.get_db),
    # می‌توان یک دسترسی جدید 'acs:task_delete' تعریف کرد
    current_user: models.User = Depends(dependencies.get_current_user_from_db) 
):
    task = crud.get_task_log_by_id(db, task_log_id) # باید این تابع crud را بسازید
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != 'sent_to_genieacs':
        raise HTTPException(status_code=400, detail="Only pending tasks can be deleted")

    # حذف از GenieACS
    await services.delete_genieacs_task(task.device_id, task.genieacs_task_id)
    
    # حذف از دیتابیس خودمان
    crud.delete_task_log(db, task_log_id) # باید این تابع crud را بسازید

    # ارسال پیام حذف از طریق WebSocket
    update_message = {"type": "TASK_DELETE", "task_id": task_log_id}
    await manager.broadcast_to_device(task.device_id, json.dumps(update_message))
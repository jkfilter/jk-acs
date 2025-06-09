# app/main.py

from fastapi import Depends, FastAPI, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import timedelta
from typing import List, Dict, Any

from . import crud, models, schemas, security, services 
from .database import engine, get_db

# این خط باید در ابتدای برنامه باشد تا جداول ساخته شوند
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="jk-acs API",
    description="یک API پیشرفته با jk-acs.",
    version="3.0.0",
)

# تنظیمات CORS
origins = [
    "http://localhost:5173",  # آدرس فرانت‌اند شما
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# --- وابستگی‌های امنیتی ---

async def get_current_user_from_db(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """ کاربر را از روی توکن در پایگاه داده پیدا می‌کند """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

def require_permission(required_perm: str):
    """
    وابستگی اصلی برای چک کردن دسترسی.
    این تابع یک وابستگی دیگر را برمی‌گرداند که مجوز را چک می‌کند.
    """
    def permission_checker(token: str = Depends(oauth2_scheme)):
        credentials_exception = HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to perform this action. Requires: {required_perm}"
        )
        try:
            payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
            
            # ۱. اگر کاربر ادمین است، همیشه اجازه دسترسی دارد
            if payload.get("is_admin", False):
                return

            # ۲. اگر ادمین نیست، چک کن آیا دسترسی مورد نیاز را دارد
            permissions = payload.get("permissions", [])
            if required_perm not in permissions:
                raise credentials_exception
        except JWTError:
            # اگر توکن معتبر نباشد، خطای 401 برگردان
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    return permission_checker


# --- روت‌های API ---

@app.post("/auth/token", response_model=schemas.Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    user_permissions = [perm.name for perm in user.permissions]
    token_data = {
        "sub": user.username,
        "is_admin": user.is_admin,
        "permissions": user_permissions
    }
    access_token = security.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User, tags=["Users"])
async def read_users_me(current_user: models.User = Depends(get_current_user_from_db)):
    return current_user

# --- روت‌های مدیریتی (فقط برای ادمین) ---
# برای دسترسی به این روت‌ها، ادمین باید دسترسی "admin:manage" را داشته باشد
ADMIN_MANAGE_PERMISSION = "admin:manage"

@app.get("/admin/users/", response_model=List[schemas.User], tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def read_all_users(db: Session = Depends(get_db)):
    return crud.get_users(db)

@app.post("/admin/users/", response_model=schemas.User, tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def create_a_new_user_by_admin(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    یک کاربر جدید توسط ادمین ساخته می‌شود.
    این روت محافظت شده و فقط برای ادمین قابل دسترس است.
    """
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # کاربر جدید با دسترسی غیر ادمین ساخته می‌شود
    new_user = crud.create_user(db=db, user=user, is_admin=False)
    return new_user

@app.post("/admin/permissions/", response_model=schemas.Permission, tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def create_new_permission(permission: schemas.PermissionCreate, db: Session = Depends(get_db)):
    db_perm = crud.get_permission_by_name(db, name=permission.name)
    if db_perm:
        raise HTTPException(status_code=400, detail="Permission already exists")
    return crud.create_permission(db, permission=permission)

@app.get("/admin/permissions/", response_model=List[schemas.Permission], tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def read_all_permissions(db: Session = Depends(get_db)):
    return crud.get_permissions(db)

@app.post("/admin/users/{user_id}/permissions/{permission_id}", response_model=schemas.User, tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def add_permission_to_user(user_id: int, permission_id: int, db: Session = Depends(get_db)):
    user = crud.assign_permission_to_user(db, user_id=user_id, permission_id=permission_id)
    if not user:
        raise HTTPException(status_code=404, detail="User or Permission not found")
    return user

# --- روت‌های عملیاتی با دسترسی خاص ---

@app.get("/backup", tags=["Operations"], dependencies=[Depends(require_permission("backup"))])
async def perform_backup():
    return {"status": "Backup started successfully for authorized user."}

@app.get("/ssh-access", tags=["Operations"], dependencies=[Depends(require_permission("ssh"))])
async def get_ssh_access():
    return {"message": "SSH access granted."}

@app.get("/view-data", tags=["Operations"], dependencies=[Depends(require_permission("view"))])
async def view_some_data():
    return {"data": "Here is some sensitive data you are allowed to view."}

@app.post("/edit-data", tags=["Operations"], dependencies=[Depends(require_permission("edit"))])
async def edit_some_data():
    return {"status": "Data edited successfully because you have the 'edit' permission."}

@app.delete("/admin/users/{user_id}/permissions/{permission_id}", response_model=schemas.User, tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def revoke_permission_from_user(user_id: int, permission_id: int, db: Session = Depends(get_db)):
    """ یک دسترسی را از یک کاربر حذف می‌کند. """
    user = crud.remove_permission_from_user(db, user_id=user_id, permission_id=permission_id)
    if not user:
        raise HTTPException(status_code=404, detail="User or Permission not found")
    return user

@app.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def remove_user(user_id: int, db: Session = Depends(get_db)):
    """ یک کاربر را به طور کامل از سیستم حذف می‌کند. """
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        # اگر کاربر ادمین باشد یا پیدا نشود
        raise HTTPException(status_code=404, detail="User not found or deletion not allowed")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.put("/admin/users/{user_id}/password", response_model=schemas.User, tags=["Admin"], dependencies=[Depends(require_permission(ADMIN_MANAGE_PERMISSION))])
def update_password_for_user(user_id: int, password_update: schemas.UserPasswordUpdate, db: Session = Depends(get_db)):
    """ رمز عبور یک کاربر را توسط ادمین تغییر می‌دهد. """
    user = crud.update_user_password(db, user_id=user_id, new_password=password_update.new_password)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- روت جدید برای ارتباط با ACSServer ---
@app.get("/acs/devices/", response_model=List[Dict[str, Any]], tags=["ACS"], dependencies=[Depends(require_permission("acs:view_details"))])
async def get_all_devices():
    """
    لیست تمام مودم‌ها را از سرور ACSServer دریافت می‌کند.
    این روت نیازمند دسترسی 'acs:view_details' است.
    """
    devices = await services.get_all_devices_from_acs()
    return devices

@app.get("/acs/devices/{device_id}", response_model=Dict[str, Any], tags=["ACS"], dependencies=[Depends(require_permission("acs:view_details"))])
async def get_specific_device(device_id: str):
    """
    اطلاعات کامل یک دستگاه خاص را از ACSServer دریافت می‌کند.
    نیازمند دسترسی 'acs:view_details' است.
    """
    device_details = await services.get_device_details_from_acs(device_id)
    return device_details


@app.get("/acs/chart/devices")
def get_device_status_stats():
    return [
        {"name": "Online", "value": 12},
        {"name": "Offline", "value": 5},
        {"name": "Connecting", "value": 2},
    ]

@app.get("/acs/chart/users")
def get_daily_active_users():
    return [
        {"name": "شنبه", "users": 10},
        {"name": "یکشنبه", "users": 15},
        {"name": "دوشنبه", "users": 8},
        {"name": "سه‌شنبه", "users": 26},
        {"name": "چهارشنبه", "users": 18},
        {"name": "پنجشنبه", "users": 24},
        {"name": "جمعه", "users": 13},
    ]

@app.get("/acs/chart/traffic")
def get_traffic_stats():
    return [
        {"name": "شنبه", "traffic": 1200},
        {"name": "یکشنبه", "traffic": 2000},
        {"name": "دوشنبه", "traffic": 1800},
        {"name": "سه شنبه", "traffic": 1100},
        {"name": "چهارشنبه", "traffic": 1500},
        {"name": "پنجشنبه", "traffic": 1300},
        {"name": "جمعه", "traffic": 1600},
    ]
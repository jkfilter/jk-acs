# app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas, database
from .. import dependencies  # <--- وارد کردن از فایل جدید

# استفاده از تابع require_permission از ماژول dependencies
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(dependencies.require_permission("admin:manage"))]
)

@router.get("/users/", response_model=List[schemas.User])
def read_all_users(db: Session = Depends(database.get_db)):
    """ لیستی از تمام کاربران سیستم را برمی‌گرداند """
    # توجه: نیازی به تکرار وابستگی دسترسی در اینجا نیست
    return crud.get_users(db)

@router.post("/users/", response_model=schemas.User)
def create_a_new_user_by_admin(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """ یک کاربر جدید توسط ادمین ایجاد می‌کند """
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    
    # کاربر جدید با دسترسی غیر ادمین ساخته می‌شود
    new_user = crud.create_user(db=db, user=user, is_admin=False)
    return new_user

@router.post("/permissions/", response_model=schemas.Permission)
def create_new_permission(permission: schemas.PermissionCreate, db: Session = Depends(database.get_db)):
    """ یک دسترسی جدید در سیستم تعریف می‌کند """
    db_perm = crud.get_permission_by_name(db, name=permission.name)
    if db_perm:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission already exists")
    return crud.create_permission(db, permission=permission)

@router.get("/permissions/", response_model=List[schemas.Permission])
def read_all_permissions(db: Session = Depends(database.get_db)):
    """ لیست تمام دسترسی‌های تعریف‌شده در سیستم را برمی‌گرداند """
    return crud.get_permissions(db)

@router.post("/users/{user_id}/permissions/{permission_id}", response_model=schemas.User)
def add_permission_to_user(user_id: int, permission_id: int, db: Session = Depends(database.get_db)):
    """ یک دسترسی را به کاربر اختصاص می‌دهد """
    user = crud.assign_permission_to_user(db, user_id=user_id, permission_id=permission_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or Permission not found")
    return user

@router.delete("/users/{user_id}/permissions/{permission_id}", response_model=schemas.User)
def revoke_permission_from_user(user_id: int, permission_id: int, db: Session = Depends(database.get_db)):
    """ یک دسترسی را از یک کاربر حذف می‌کند """
    user = crud.remove_permission_from_user(db, user_id=user_id, permission_id=permission_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or Permission not found or already revoked")
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: int, db: Session = Depends(database.get_db)):
    """ یک کاربر را به طور کامل از سیستم حذف می‌کند """
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found or deletion not allowed (e.g., admin user)")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.put("/users/{user_id}/password", response_model=schemas.User)
def update_password_for_user(user_id: int, password_update: schemas.UserPasswordUpdate, db: Session = Depends(database.get_db)):
    """ رمز عبور یک کاربر را توسط ادمین تغییر می‌دهد """
    user = crud.update_user_password(db, user_id=user_id, new_password=password_update.new_password)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
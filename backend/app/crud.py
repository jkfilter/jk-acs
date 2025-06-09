# app/crud.py

from sqlalchemy.orm import Session
from . import models, schemas, security

# --- User CRUD Operations ---

def get_user(db: Session, user_id: int):
    """ یک کاربر را با ID آن از پایگاه داده می‌خواند. """
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    """ یک کاربر را با نام کاربری آن از پایگاه داده می‌خواند. """
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """ لیستی از کاربران را با قابلیت صفحه‌بندی می‌خواند. """
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate, is_admin: bool = False):
    """ یک کاربر جدید در پایگاه داده ایجاد می‌کند. """
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        username=user.username, 
        hashed_password=hashed_password,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Permission CRUD Operations ---

def get_permission(db: Session, permission_id: int):
    """ یک دسترسی را با ID آن می‌خواند. """
    return db.query(models.Permission).filter(models.Permission.id == permission_id).first()

def get_permission_by_name(db: Session, name: str):
    """ یک دسترسی را با نام آن می‌خواند. """
    return db.query(models.Permission).filter(models.Permission.name == name).first()
    
def get_permissions(db: Session, skip: int = 0, limit: int = 100):
    """ لیستی از تمام دسترسی‌های ممکن را می‌خواند. """
    return db.query(models.Permission).offset(skip).limit(limit).all()

def create_permission(db: Session, permission: schemas.PermissionCreate):
    """ یک نوع دسترسی جدید در سیستم تعریف می‌کند. """
    db_permission = models.Permission(**permission.dict())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

# --- User-Permission Assignment ---

def assign_permission_to_user(db: Session, user_id: int, permission_id: int):
    """ یک دسترسی مشخص را به یک کاربر مشخص اختصاص می‌دهد. """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    permission = db.query(models.Permission).filter(models.Permission.id == permission_id).first()
    
    # شرط اصلاح شده: فقط چک می‌کنیم که آیا کاربر و دسترسی وجود دارند و کاربر قبلاً این دسترسی را نداشته باشد
    if user and permission and permission not in user.permissions:
        user.permissions.append(permission)
        db.commit()
        db.refresh(user)
    return user

def remove_permission_from_user(db: Session, user_id: int, permission_id: int):
    """ یک دسترسی مشخص را از یک کاربر مشخص حذف می‌کند. """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    permission = db.query(models.Permission).filter(models.Permission.id == permission_id).first()
    
    # چک می‌کنیم که کاربر و دسترسی وجود داشته باشند و کاربر این دسترسی را داشته باشد
    if user and permission and permission in user.permissions:
        user.permissions.remove(permission)
        db.commit()
        db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    """ یک کاربر را با ID آن حذف می‌کند. """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        # برای امنیت، اجازه حذف کاربر اصلی ادمین را نمی‌دهیم
        if user.username == "admin":
            return None # یا یک خطای خاص برگردانید
        db.delete(user)
        db.commit()
        return True # نشانه‌ی موفقیت
    return False # کاربر پیدا نشد

def update_user_password(db: Session, user_id: int, new_password: str):
    """ رمز عبور یک کاربر را به‌روز می‌کند. """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.hashed_password = security.get_password_hash(new_password)
        db.commit()
        db.refresh(user)
        return user
    return None
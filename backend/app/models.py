# app/models.py

from sqlalchemy import Boolean, Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime
from sqlalchemy.sql import func

# جدول واسط جدید برای اتصال مستقیم کاربران به دسترسی‌ها
user_permissions_table = Table('user_permissions', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    # فیلد ساده برای تشخیص ادمین
    is_admin = Column(Boolean, default=False, nullable=False)

    # رابطه چند-به-چند مستقیم با دسترسی‌ها
    permissions = relationship("Permission",
                               secondary=user_permissions_table,
                               back_populates="users")

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # e.g., "backup", "ssh"
    description = Column(String)

    users = relationship("User",
                         secondary=user_permissions_table,
                         back_populates="permissions")
    

class TaskLog(Base):
    __tablename__ = "task_logs"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    task_name = Column(String, index=True, nullable=False)
    status = Column(String, default="sent") # e.g., "sent", "failed"
    payload = Column(JSONB) # برای ذخیره اطلاعات ارسال شده
    response = Column(JSONB) # برای ذخیره پاسخ دریافتی
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    genieacs_task_id = Column(String, nullable=True, index=True) # <-- فیلد جدید
    # ForeignKey به جدول کاربران برای اینکه بدانیم چه کسی دستور را صادر کرده
    created_by_user_id = Column(Integer, ForeignKey("users.id"))
    created_by = relationship("User")
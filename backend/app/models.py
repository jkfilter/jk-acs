# app/models.py

from sqlalchemy import Boolean, Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

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
# app/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional

# --- Schemas for Permission ---
class PermissionBase(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class Permission(PermissionBase):
    id: int
    class Config:
        from_attributes = True

# --- Schemas for User ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

# اسکیمای نمایش کاربر، شامل وضعیت ادمین و لیست دسترسی‌ها
class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    permissions: List[Permission] = []
    class Config:
        from_attributes = True

# --- Schemas for Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

# توکن حالا شامل وضعیت ادمین و لیست دسترسی‌های کاربر است
class TokenData(BaseModel):
    username: Optional[str] = None
    is_admin: bool = False
    permissions: List[str] = []

class UserPasswordUpdate(BaseModel):
    new_password: str = Field(..., min_length=6)
# app/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from . import crud, models, security
from .database import get_db

# این متغیر و تمام توابع وابسته به آن به اینجا منتقل شدند
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

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
            
            if payload.get("is_admin", False):
                return

            permissions = payload.get("permissions", [])
            if required_perm not in permissions:
                raise credentials_exception
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    return permission_checker
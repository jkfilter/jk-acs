# app/main.py

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas, security
from .database import engine, get_db
from .routers import admin, acs, websockets   # وارد کردن روترهای ادمین و acs
from . import dependencies

# این خط باید در ابتدای برنامه باشد تا جداول ساخته شوند
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="jk-acs API",
    description="یک API پیشرفته با jk-acs.",
    version="3.0.0",
)

# تنظیمات CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# اضافه کردن تمام روترها به برنامه اصلی
app.include_router(admin.router)
app.include_router(acs.router)
app.include_router(acs.chart_router)
app.include_router(acs.webhook_router)
app.include_router(websockets.router)


# --- روت‌های اصلی برنامه که در فایل جداگانه‌ای نیستند ---

@app.post("/auth/token", response_model=schemas.Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """ برای دریافت توکن JWT لاگین کنید """
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    user_permissions = [perm.name for perm in user.permissions]
    token_data = {
        "sub": user.username,
        "is_admin": user.is_admin,
        "permissions": user_permissions
    }
    access_token = security.create_access_token(data=token_data)
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.User, tags=["Users"])
async def read_users_me(current_user: models.User = Depends(dependencies.get_current_user_from_db)):
    """ اطلاعات کاربر لاگین کرده را برمی‌گرداند """
    return current_user


# --- روت‌های عملیاتی (نمونه برای دسترسی‌های خاص) ---
@app.get("/backup", tags=["Operations"], dependencies=[Depends(dependencies.require_permission("backup"))])
async def perform_backup():
    return {"status": "Backup started successfully for authorized user."}


@app.get("/ssh-access", tags=["Operations"], dependencies=[Depends(dependencies.require_permission("ssh"))])
async def get_ssh_access():
    return {"message": "SSH access granted."}
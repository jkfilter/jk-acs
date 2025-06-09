from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ACSSERVER_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # این خط باعث می‌شود متغیرها از فایل .env خوانده شوند
    model_config = SettingsConfigDict(env_file=".env")

# یک نمونه از تنظیمات می‌سازیم تا در همه جای برنامه قابل استفاده باشد
settings = Settings()
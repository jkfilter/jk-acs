# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# برای PostgreSQL
DATABASE_URL = "postgresql://jk:12345678@localhost:5432/acs_db8"

# برای SQLite (فایل در همان پوشه ساخته می‌شود)
#DATABASE_URL = "sqlite:///./sql_app.db"

engine = create_engine(
    DATABASE_URL, 
    # این آرگومان فقط برای SQLite نیاز است
    #connect_args={"check_same_thread": False} 
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency برای گرفتن session پایگاه داده در هر درخواست
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
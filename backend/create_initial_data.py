# create_initial_data.py

from app.database import SessionLocal, engine
from app.models import Base
from app import crud, schemas

def setup_initial_data():
    # یک session جدید برای ارتباط با دیتابیس ایجاد کن
    db = SessionLocal()
    try:
        print("--- Setting up initial data ---")

        # ۱. ساختن دسترسی‌های ممکن در سیستم
        print("1. Creating permissions...")
        permissions_to_create = ["view", "edit", "ssh", "backup", "admin:manage"]
        for perm_name in permissions_to_create:
            db_perm = crud.get_permission_by_name(db, name=perm_name)
            if not db_perm:
                crud.create_permission(db, permission=schemas.PermissionCreate(name=perm_name, description=f"Allows to {perm_name}"))
                print(f"  - Permission '{perm_name}' created.")
            else:
                print(f"  - Permission '{perm_name}' already exists.")

        # ۲. ساختن کاربر ادمین اصلی
        print("\n2. Creating admin user...")
        admin_user = crud.get_user_by_username(db, username="admin")
        if not admin_user:
            admin_schema = schemas.UserCreate(username="admin", password="admin1234")
            # کاربر ادمین با فلگ is_admin=True ساخته می‌شود
            admin_user = crud.create_user(db, user=admin_schema, is_admin=True)
            print("  - Admin user 'admin' created.")
            
            # ادمین به صورت پیش‌فرض به همه چیز دسترسی دارد، اما برای کامل بودن
            # می‌توانیم دسترسی مدیریت را به او بدهیم
            admin_manage_perm = crud.get_permission_by_name(db, "admin:manage")
            if admin_manage_perm:
                 crud.assign_permission_to_user(db, user_id=admin_user.id, permission_id=admin_manage_perm.id)
                 print("  - Assigned 'admin:manage' permission to admin user.")
        else:
            print("  - Admin user 'admin' already exists.")

        # ۳. (اختیاری) ساخت یک کاربر عادی برای تست
        print("\n3. Creating a test user...")
        test_user = crud.get_user_by_username(db, username="user")
        if not test_user:
            user_schema = schemas.UserCreate(username="user", password="12345678")
            test_user = crud.create_user(db, user=user_schema, is_admin=False)
            print("  - Test user 'tuser' created.")

            # دادن دسترسی 'view' و 'backup' به کاربر تستی
            view_perm = crud.get_permission_by_name(db, "view")
            backup_perm = crud.get_permission_by_name(db, "backup")

            if view_perm:
                crud.assign_permission_to_user(db, user_id=test_user.id, permission_id=view_perm.id)
                print("  - Assigned 'view' permission to 'user'.")
            if backup_perm:
                crud.assign_permission_to_user(db, user_id=test_user.id, permission_id=backup_perm.id)
                print("  - Assigned 'backup' permission to 'user'.")
        else:
            print("  - Test user 'user' already exists.")

        print("\n--- Initial data setup is complete ---")

    finally:
        # بستن session دیتابیس در انتها
        db.close()

if __name__ == "__main__":
    print("Initializing database...")
    # ابتدا مطمئن شو جداول ساخته شده‌اند
    Base.metadata.create_all(bind=engine)
    print("Database tables created or already exist.")
    
    # سپس داده‌های اولیه را وارد کن
    setup_initial_data()
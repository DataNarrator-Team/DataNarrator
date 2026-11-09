
from getpass import getpass

from app import app
from services.auth_service import create_admin_user


# إدخال بيانات حساب المسؤول
username = input("Enter admin username: ").strip()
email = input("Enter admin email: ").strip()
password = getpass("Enter admin password: ")

# التحقق من إدخال جميع البيانات المطلوبة
if not username or not email or not password.strip():
    print("Username, email, and password are required.")
    raise SystemExit(1)

# إنشاء حساب المسؤول في قاعدة البيانات
with app.app_context():
    try:
        admin = create_admin_user(username, email, password)

        print("Admin account created successfully.")
        print("Admin ID:", admin.id)
        print("Username:", admin.username)
        print("Email:", admin.email)

    except ValueError as error:
        print("Could not create admin account:", error)

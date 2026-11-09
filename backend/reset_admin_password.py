
from getpass import getpass

from app import app
from models.user import User
from database.database import db
from werkzeug.security import generate_password_hash

# إدخال البريد الإلكتروني لحساب المسؤول
email = input("Enter admin email: ").strip()

# إدخال كلمة المرور الجديدة
new_password = getpass("Enter new password: ")

# تحديث كلمة المرور في قاعدة البيانات
with app.app_context():
    admin = User.query.filter_by(email=email, role="admin").first()

    if admin is None:
        print("Admin account not found.")
    else:
        admin.password = generate_password_hash(new_password)
        db.session.commit()
        print("Admin password updated successfully.")

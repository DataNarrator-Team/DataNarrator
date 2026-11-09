from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

from models.user import User
from database.database import db



def create_user(username, email, password):
    hashed_password = generate_password_hash(password)

    return {
        "username": username,
        "email": email,
        "password": hashed_password
    }



def save_user_to_database(username, email, hashed_password):
    new_user = User(
        username=username,
        email=email,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user



def verify_user_password(password, stored_password):
    return check_password_hash(stored_password, password)


# البحث عن المستخدم بالبريد
def find_user_by_username_or_email(login):
    return User.query.filter(
        (User.username == login) |
        (User.email == login)
    ).first()

# إنشاء رمز دخول للمستخدم
def create_access_token_for_user(user_id):
    return create_access_token(identity=str(user_id))


def create_admin_user(username, email, password):
    # التحقق من عدم وجود اسم المستخدم مسبقًا
    existing_user = find_user_by_username_or_email(username)

    if existing_user is not None:
        raise ValueError("Username already exists.")

    # التحقق من عدم وجود البريد الإلكتروني مسبقًا
    existing_email = User.query.filter_by(email=email).first()

    if existing_email is not None:
        raise ValueError("Email already exists.")

    # تشفير كلمة المرور قبل حفظها في قاعدة البيانات
    hashed_password = generate_password_hash(password)

    # إنشاء حساب المسؤول بصلاحية Admin
    admin = User(
        username=username,
        email=email,
        password=hashed_password,
        role="admin"
    )

    # إضافة حساب المسؤول إلى قاعدة البيانات وحفظه
    db.session.add(admin)
    db.session.commit()

    # إرجاع بيانات حساب المسؤول الذي تم إنشاؤه
    return admin

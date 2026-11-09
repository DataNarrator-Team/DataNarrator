from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from services.auth_service import (
    create_user,
    save_user_to_database,
    find_user_by_username_or_email,
    verify_user_password,
    create_access_token_for_user
)


auth_bp = Blueprint("auth", __name__)


# تسجيل مستخدم جديد
@auth_bp.route("/register", methods=["POST"])
def register_user():
    # استقبال بيانات التسجيل والتحقق من صيغة JSON
    user_data = request.get_json(silent=True)

    if not isinstance(user_data, dict):
        return {"message": "A valid JSON object is required."}, 400

    # استخراج الحقول المطلوبة
    username = user_data.get("username")
    email = user_data.get("email")
    password = user_data.get("password")

    # التحقق من أن الحقول نصوص
    if not all(
        isinstance(value, str)
        for value in (username, email, password)
    ):
        return {
            "message": "Username, email, and password must be text."
        }, 400

    # إزالة المسافات الزائدة من اسم المستخدم والبريد
    username = username.strip()
    email = email.strip()

    # منع الحقول الفارغة
    if not username or not email or not password.strip():
        return {
            "message": "Username, email, and password are required."
        }, 400

    # التحقق المبدئي من صيغة البريد الإلكتروني
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return {"message": "Invalid email address."}, 400

    # إنشاء بيانات المستخدم وحفظ الحساب
    prepared_user = create_user(username, email, password)

    saved_user = save_user_to_database(
        prepared_user["username"],
        prepared_user["email"],
        prepared_user["password"]
    )

    return {
        "message": "User registered successfully",
        "user_id": saved_user.id
    }, 201

# تسجيل دخول المستخدم
@auth_bp.route("/login", methods=["POST"])
def login_user():
    user_data = request.get_json()

    login = user_data["login"]
    password = user_data["password"]

    user = find_user_by_username_or_email(login)

    if user is None:
        return {
            "message": "User not found"
        }, 404

    password_is_correct = verify_user_password(
        password,
        user.password
    )

    if not password_is_correct:
        return {
            "message": "Incorrect password"
        }, 401

    # إنشاء رمز دخول للمستخدم
    access_token = create_access_token_for_user(
        user.id
    )

    return {
    "message": "Login successful",
    "access_token": access_token,
    "user_id": user.id,
    "role": user.role
    }, 200

# اختبار حماية المسار باستخدام JWT
@auth_bp.route("/profile", methods=["GET"])
@jwt_required()  # معناها لاتسمح لهذا ال Route بالعمل الا اذا كان الطلب يحتوي على JWT coorect 
def get_user_profile():
    user_id = get_jwt_identity()

    return {
        "message": "Access granted",
        "user_id": user_id
    }, 200
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash

from models.user import User
from database.database import db

admin_bp = Blueprint("admin", __name__)

# عرض جميع حسابات المستخدمين للمسؤول فقط
@admin_bp.route("/admin/users", methods=["GET"])
@jwt_required()
def get_all_users():
    # الحصول على رقم المستخدم من رمز الدخول
    user_id = get_jwt_identity()

    # البحث عن الحساب الذي سجل الدخول
    current_user = User.query.get(int(user_id))

    # التحقق من وجود الحساب وأنه مسؤول
    if current_user is None or current_user.role != "admin":
        return {"message": "Admin access required."}, 403

    # جلب حسابات المستخدمين دون كلمات المرور
    users = User.query.all()

    # تجهيز بيانات الحسابات للإرجاع
    users_list = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
        for user in users
    ]

    return {"users": users_list}, 200



from werkzeug.security import generate_password_hash


# إضافة حساب مستخدم جديد للمسؤول فقط
@admin_bp.route("/admin/users", methods=["POST"])
@jwt_required()
def add_user():
    # الحصول على رقم المستخدم من رمز الدخول
    user_id = get_jwt_identity()

    # البحث عن الحساب الذي سجل الدخول
    current_user = User.query.get(int(user_id))

    # التحقق من صلاحية المسؤول
    if current_user is None or current_user.role != "admin":
        return {"message": "Admin access required."}, 403

    # استقبال بيانات الحساب الجديد
    data = request.get_json()

    # استقبال بيانات الحساب الجديد
    data = request.get_json(silent=True)

    # التحقق من أن البيانات المرسلة كائن JSON
    if not isinstance(data, dict):
        return {"message": "A valid JSON object is required."}, 400

    # التحقق من وجود الحقول المطلوبة وأنها نصوص
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all(isinstance(value, str) for value in (username, email, password)):
        return {
            "message": "Username, email, and password must be text."
        }, 400

    # إزالة المسافات الزائدة من اسم المستخدم والبريد
    username = username.strip()
    email = email.strip()

    # منع الحقول الفارغة أو التي تحتوي على مسافات فقط
    if not username or not email or not password.strip():
        return {
            "message": "Username, email, and password are required."
        }, 400

    # التحقق من صيغة البريد الإلكتروني بشكل مبدئي
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return {"message": "Invalid email address."}, 400


    # التحقق من عدم تكرار اسم المستخدم
    if User.query.filter_by(username=username).first():
        return {"message": "Username already exists."}, 409

    # التحقق من عدم تكرار البريد الإلكتروني
    if User.query.filter_by(email=email).first():
        return {"message": "Email already exists."}, 409

    # إنشاء الحساب الجديد بصلاحية مستخدم عادي
    new_user = User(
        username=username,
        email=email,
        password=generate_password_hash(password),
        role="user"
    )

    # حفظ الحساب في قاعدة البيانات
    db.session.add(new_user)
    db.session.commit()

    return {
        "message": "User created successfully.",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role
        }
    }, 201


# حذف حساب مستخدم للمسؤول فقط
@admin_bp.route("/admin/users/<int:target_user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(target_user_id):
    # الحصول على رقم المستخدم الذي سجل الدخول
    user_id = get_jwt_identity()

    # التحقق من صلاحية المسؤول
    current_user = User.query.get(int(user_id))

    if current_user is None or current_user.role != "admin":
        return {"message": "Admin access required."}, 403

    # البحث عن الحساب المطلوب حذفه
    target_user = User.query.get(target_user_id)

    if target_user is None:
        return {"message": "User not found."}, 404


    # منع حذف حساب المسؤول الذي يستخدم الطلب
    if target_user.id == current_user.id:
        return {
            "message": "You cannot delete your own admin account."
        }, 400

    # التحقق من عدد حسابات المسؤولين قبل الحذف
    if target_user.role == "admin":
        admin_count = User.query.filter_by(role="admin").count()

        # منع حذف آخر حساب مسؤول
        if admin_count <= 1:
            return {
                "message": "Cannot delete the last admin account."
            }, 400

    # حذف الحساب من قاعدة البيانات
    from database.database import db
    db.session.delete(target_user)
    db.session.commit()

    return {"message": "User deleted successfully."}, 200


# عرض بيانات مستخدم محدد للمسؤول فقط
@admin_bp.route("/admin/users/<int:target_user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(target_user_id):
    # الحصول على رقم المستخدم الذي سجل الدخول
    user_id = get_jwt_identity()

    # البحث عن حساب المستخدم الحالي
    current_user = User.query.get(int(user_id))

    # التحقق من صلاحية المسؤول
    if current_user is None or current_user.role != "admin":
        return {"message": "Admin access required."}, 403

    # البحث عن المستخدم المطلوب
    target_user = User.query.get(target_user_id)

    # التحقق من وجود الحساب
    if target_user is None:
        return {"message": "User not found."}, 404

    # إرجاع بيانات المستخدم دون كلمة المرور
    return {
        "user": {
            "id": target_user.id,
            "username": target_user.username,
            "email": target_user.email,
            "role": target_user.role
        }
    }, 200

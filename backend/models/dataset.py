from database.database import db
from datetime import datetime


# Model يمثل Dataset تم رفعه من أحد المستخدمين
class Dataset(db.Model):

    # اسم الجدول الذي سيتم إنشاؤه في قاعدة البيانات
    __tablename__ = "datasets"

    # المعرف الفريد لكل Dataset
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # معرف المستخدم الذي قام برفع Dataset
    # يرتبط بجدول users
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    # اسم ملف Dataset الذي رفعه المستخدم
    file_name = db.Column(
        db.String(255),
        nullable=False
    )

    # المسار الذي تم حفظ ملف Dataset فيه داخل المشروع
    file_path = db.Column(
        db.String(500),
        nullable=False
    )

    # تاريخ ووقت رفع Dataset
    # يتم تسجيل الوقت تلقائيًا عند إنشاء السجل
    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # إنشاء علاقة بين Dataset و User
    # تسمح لنا بمعرفة المستخدم الذي يملك Dataset
    user = db.relationship(
        "User",
        backref=db.backref(
            "datasets",
            cascade="all, delete-orphan"
        )
    )
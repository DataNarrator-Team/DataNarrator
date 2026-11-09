
import os
import sqlite3

from sqlalchemy import text

from app import app
from database.database import db
from models.user import User


# تحديد مسار قاعدة SQLite القديمة
sqlite_path = os.path.join(
    os.path.dirname(__file__),
    "instance",
    "datanarrator.db"
)

# قراءة المستخدمين من SQLite
connection = sqlite3.connect(sqlite_path)
connection.row_factory = sqlite3.Row

try:
    old_users = connection.execute("""
        SELECT
            id,
            username,
            email,
            password,
            role,
            display_name,
            profile_image,
            chart_color,
            currency,
            number_display,
            theme
        FROM users
    """).fetchall()
finally:
    connection.close()


with app.app_context():

    # التأكد أن جدول Supabase فارغ قبل النقل
    if User.query.count() != 0:
        raise Exception(
            "Supabase users table is not empty. Migration stopped."
        )

    # تحويل البيانات إلى سجلات User
    new_users = []

    for row in old_users:
        user_data = dict(row)
        new_users.append(User(**user_data))

    try:
        db.session.add_all(new_users)
        db.session.flush()

        # ضبط تسلسل أرقام المستخدمين في PostgreSQL
        db.session.execute(text("""
            SELECT setval(
                pg_get_serial_sequence('users', 'id'),
                (SELECT MAX(id) FROM users),
                true
            )
        """))

        db.session.commit()

        print("Users migrated successfully!")
        print("Migrated users:", len(new_users))

    except Exception:
        db.session.rollback()
        raise

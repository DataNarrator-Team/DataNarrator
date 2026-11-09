
import os
from dotenv import load_dotenv
from sqlalchemy import text

from flask import Flask
from flask_jwt_extended import JWTManager

from routes.auth_routes import auth_bp
from database.database import db
from models.user import User
from models.dataset import Dataset
from models.analysis_session import AnalysisSession

from routes.dataset_routes import dataset_bp
from routes.analysis_routes import analysis_bp
from routes.settings_routes import settings_bp
from routes.admin_routes import admin_bp


# تحميل متغيرات البيئة من ملف .env في المجلد الرئيسي للمشروع
load_dotenv(
    os.path.join(os.path.dirname(__file__), "..", ".env")
)

app = Flask(__name__)

# إعداد JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

jwt = JWTManager(app)
print("JWT is ready")

# إعداد الاتصال بقاعدة بيانات Supabase
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

print(
    "DATABASE URL loaded:",
    bool(app.config["SQLALCHEMY_DATABASE_URI"])
)

db.init_app(app)

# تسجيل المسارات
app.register_blueprint(auth_bp)
app.register_blueprint(dataset_bp)
app.register_blueprint(analysis_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(admin_bp)


# اختبار الاتصال وإنشاء الجداول في Supabase
with app.app_context():
    db.session.execute(text("SELECT 1"))
    print("Supabase connection successful!")

    db.create_all()
    print("Database tables created successfully!")
    
# طباعة جميع المسارات المسجلة في التطبيق
print(app.url_map)

if __name__ == "__main__":
    app.run(debug=True)

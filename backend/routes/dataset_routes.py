from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import uuid

from models.dataset import Dataset
from database.database import db

from services.dataset_service import (
    read_dataset,
    validate_file_format,
    validate_data_format,
    detect_duplicate_columns,
    analyze_duplicate_columns,
    detect_duplicate_rows,
    find_invalid_columns,
    get_column_names,
    detect_missing_values,
    calculate_missing_percentage,
    get_column_data_types,
    detect_invalid_column_formats,
    detect_numeric_range_violations,
    apply_numeric_range_corrections,
    detect_invalid_dates,
    apply_date_corrections,
    standardize_date_formats,
    detect_invalid_emails,
    classify_columns,
    recommend_missing_value_strategy,
    apply_missing_value_strategies,
    save_uploaded_file,
    get_dataset_for_user,
    read_saved_dataset,
    save_cleaned_dataset,
    validate_selected_columns
)

from services.ai_service import (
    get_dataset_context,
    build_column_recommendation_prompt,
    get_validated_ai_column_recommendation,
    generate_ai_quick_examples
)

dataset_bp = Blueprint("dataset", __name__)


# اختبار قراءة ملف CSV
@dataset_bp.route("/dataset/test-upload", methods=["POST"])
def test_upload_dataset():
    
    # التحقق من وجود الملف
    if "file" not in request.files:
        return {
            "error": "No file was uploaded."
        }, 400

    uploaded_file = request.files["file"]

    # التحقق من صيغة الملف
    if not validate_file_format(uploaded_file):
        return {
            "error": "Unsupported file format. Please upload a CSV or XLSX file."
        }, 400

    # لازم نعرف dataframe (first)
    dataframe = read_dataset(uploaded_file)

    # التحقق من إمكانية قراءة Dataset
    if dataframe is None:
        return {
            "error": "Could not read dataset."
        }, 400

    # التحقق من الأعمدة المكررة
    duplicate_columns = detect_duplicate_columns(dataframe)

    duplicate_analysis = analyze_duplicate_columns(dataframe)

    # التحقق من أسماء الأعمدة غير الصالحة
    invalid_columns = find_invalid_columns(dataframe)

    # تجميع جميع مشاكل الـ Dataset
    validation_issues = {}

    if duplicate_columns:
        validation_issues["duplicate_columns"] = duplicate_columns

    if invalid_columns:
        validation_issues["invalid_columns"] = invalid_columns


    # التحقق من صحة تنسيق البيانات
    if not validate_data_format(dataframe):
        return {
            "error": "Invalid data format. Please upload a valid tabular dataset."
        }, 400

    column_names = get_column_names(dataframe)

    # اكتشاف Missing Data
    missing_values_result = detect_missing_values(dataframe)

    # الحصول على العدد الكلي لـ Missing Data
    missing_values = missing_values_result["total"]

    # الحصول على عدد Missing Data في كل عمود
    missing_values_by_column = missing_values_result["columns"]

    # حساب نسبة Missing Data لكل عمود
    missing_percentage_result = calculate_missing_percentage(dataframe)

    # اكتشاف الخلايا التي تحتوي على Invalid Format
    invalid_formats = detect_invalid_column_formats(dataframe)

    # إضافة Missing Data إلى مشاكل الـ Dataset
    if missing_values > 0:
        validation_issues["missing_values"] = {
            "total": missing_values,
            "columns": missing_values_by_column
        }

    # إضافة Invalid Format إلى مشاكل الـ Dataset
    if invalid_formats["total"] > 0:
        validation_issues["invalid_formats"] = invalid_formats

    #calling for get columns data 
    data_types = get_column_data_types(dataframe)

    # تصنيف الأعمدة وانواعها 
    column_categories = classify_columns(dataframe)

    # اقتراح طرق معالجة القيم المفقودة
    missing_value_recommendations = recommend_missing_value_strategy(dataframe)

    return {
        "message": "Dataset read successfully",
        "rows": len(dataframe),
        "columns": len(dataframe.columns),
        "column_names": column_names,
        "missing_values": missing_values,
        "missing_values_by_column": missing_values_by_column,
        "missing_percentage": missing_percentage_result,
        "invalid_formats": invalid_formats,
        "validation_issues": validation_issues,
        "has_issues": bool(validation_issues),
        "duplicate_analysis": duplicate_analysis,
        "data_types": data_types,
        "column_categories": column_categories,
        "missing_value_recommendations": missing_value_recommendations
    }, 200



# رفع Dataset وحفظه داخل مجلد التخزين
@dataset_bp.route("/dataset/upload", methods=["POST"])
@jwt_required()
def upload_dataset():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # التحقق من وجود الملف
    if "file" not in request.files:
        return {
            "error": "No file was uploaded."
        }, 400

    uploaded_file = request.files["file"]

    # التحقق من صيغة الملف
    if not validate_file_format(uploaded_file):
        return {
            "error": "Unsupported file format. Please upload a CSV or XLSX file."
        }, 400

    # تحديد مجلد تخزين الملفات
    upload_folder = os.path.join(
        os.getcwd(),
        "uploads"
    )

    # حفظ الملف داخل مجلد التخزين
    file_path = save_uploaded_file(
        uploaded_file,
        upload_folder
    )

    # إنشاء سجل Dataset في قاعدة البيانات
    new_dataset = Dataset(
        user_id=user_id,
        file_name=uploaded_file.filename,
        file_path=file_path
    )

    # حفظ سجل Dataset
    db.session.add(new_dataset)
    db.session.commit()

    return {
        "message": "Dataset uploaded successfully",
        "user_id": user_id,
        "dataset_id": new_dataset.id,
        "file_name": uploaded_file.filename,
        "file_path": file_path
    }, 201

# فحص القيم الرقمية المخالفة
@dataset_bp.route(
    "/dataset/<int:dataset_id>/validate-numeric-range",
    methods=["POST"]
)
@jwt_required()
def validate_numeric_range(dataset_id):

    dataset = get_dataset_for_user(
        dataset_id,
        get_jwt_identity()
    )

    if not dataset:
        return {"error": "Dataset not found."}, 404

    try:
        dataframe = read_saved_dataset(dataset.file_path)

        if dataframe is None:
            return {"error": "Unable to read dataset."}, 400

        data = request.get_json() or {}
        rules = data.get("rules", {})

        invalid_values = detect_numeric_range_violations(
            dataframe,
            rules
        )

        return {
            "dataset_id": dataset_id,
            "validation": invalid_values
        }, 200

    except Exception as error:
        return {"error": str(error)}, 500

# فحص التواريخ غير الصحيحة
@dataset_bp.route(
    "/dataset/<int:dataset_id>/validate-dates",
    methods=["POST"]
)
@jwt_required()
def validate_dates(dataset_id):

    dataset = get_dataset_for_user(
        dataset_id,
        get_jwt_identity()
    )

    if not dataset:
        return {"error": "Dataset not found."}, 404

    try:
        dataframe = read_saved_dataset(dataset.file_path)

        if dataframe is None:
            return {"error": "Unable to read dataset."}, 400

        data = request.get_json() or {}
        date_columns = data.get("date_columns", [])

        invalid_dates = detect_invalid_dates(
            dataframe,
            date_columns
        )

        return {
            "dataset_id": dataset_id,
            "validation": invalid_dates
        }, 200

    except Exception as error:
        return {"error": str(error)}, 500

# فحص عناوين البريد الإلكتروني غير الصحيحة
@dataset_bp.route(
    "/dataset/<int:dataset_id>/validate-emails",
    methods=["POST"]
)
@jwt_required()
def validate_emails(dataset_id):

    dataset = get_dataset_for_user(
        dataset_id,
        get_jwt_identity()
    )

    if not dataset:
        return {"error": "Dataset not found."}, 404

    try:
        dataframe = read_saved_dataset(dataset.file_path)

        if dataframe is None:
            return {"error": "Unable to read dataset."}, 400

        data = request.get_json() or {}
        email_columns = data.get("email_columns", [])

        invalid_emails = detect_invalid_emails(
            dataframe,
            email_columns
        )

        return {
            "dataset_id": dataset_id,
            "validation": invalid_emails
        }, 200

    except Exception as error:
        return {"error": str(error)}, 500

# تعديل التواريخ المخالفة وحفظ البيانات
@dataset_bp.route(
    "/dataset/<int:dataset_id>/correct-dates",
    methods=["POST"]
)
@jwt_required()
def correct_dates(dataset_id):

    dataset = get_dataset_for_user(
        dataset_id,
        get_jwt_identity()
    )

    if not dataset:
        return {"error": "Dataset not found."}, 404

    new_file_path = None

    try:
        dataframe = read_saved_dataset(dataset.file_path)

        if dataframe is None:
            return {"error": "Unable to read dataset."}, 400

        data = request.get_json() or {}

        date_columns = data.get("date_columns", [])
        corrections = data.get("corrections", [])

        # تطبيق تعديلات المستخدم
        cleaned_data = apply_date_corrections(
            dataframe,
            date_columns,
            corrections
        )

        # حفظ البيانات المعدلة في ملف جديد
        file_extension = os.path.splitext(dataset.file_path)[1]

        new_file_path = os.path.join(
            os.path.dirname(dataset.file_path),
            f"{uuid.uuid4()}{file_extension}"
        )

        save_cleaned_dataset(cleaned_data, new_file_path)

        # تحديث مسار الملف في قاعدة البيانات
        old_file_path = dataset.file_path
        dataset.file_path = new_file_path

        db.session.commit()

        # حذف الملف القديم بعد نجاح الحفظ
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        return {
            "dataset_id": dataset_id,
            "message": "Date corrections saved successfully."
        }, 200

    except Exception as error:
        db.session.rollback()

        if new_file_path and os.path.exists(new_file_path):
            os.remove(new_file_path)

        return {"error": str(error)}, 500
# توحيد تنسيقات التواريخ وحفظ البيانات
@dataset_bp.route(
    "/dataset/<int:dataset_id>/standardize-dates",
    methods=["POST"]
)
@jwt_required()
def standardize_dates(dataset_id):

    dataset = get_dataset_for_user(
        dataset_id,
        get_jwt_identity()
    )

    if not dataset:
        return {"error": "Dataset not found."}, 404

    new_file_path = None

    try:
        dataframe = read_saved_dataset(dataset.file_path)

        if dataframe is None:
            return {"error": "Unable to read dataset."}, 400

        data = request.get_json() or {}
        date_columns = data.get("date_columns", [])

        if not date_columns:
            return {"error": "No date columns selected."}, 400

        # توحيد تنسيقات التواريخ
        standardized_data = standardize_date_formats(
            dataframe,
            date_columns
        )

        # حفظ البيانات الموحدة في ملف جديد
        file_extension = os.path.splitext(dataset.file_path)[1]

        new_file_path = os.path.join(
            os.path.dirname(dataset.file_path),
            f"{uuid.uuid4()}{file_extension}"
        )

        save_cleaned_dataset(standardized_data, new_file_path)

        # تحديث مسار الملف في قاعدة البيانات
        old_file_path = dataset.file_path
        dataset.file_path = new_file_path

        db.session.commit()

        # حذف الملف القديم بعد نجاح الحفظ
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        return {
            "dataset_id": dataset_id,
            "message": "Date formats standardized successfully."
        }, 200

    except Exception as error:
        db.session.rollback()

        if new_file_path and os.path.exists(new_file_path):
            os.remove(new_file_path)

        return {"error": str(error)}, 500

# تعديل القيم الرقمية المخالفة وحفظ البيانات
@dataset_bp.route(
    "/dataset/<int:dataset_id>/correct-numeric-range",
    methods=["POST"]
)
@jwt_required()
def correct_numeric_range(dataset_id):

    dataset = get_dataset_for_user(
        dataset_id,
        get_jwt_identity()
    )

    if not dataset:
        return {"error": "Dataset not found."}, 404

    new_file_path = None

    try:
        dataframe = read_saved_dataset(dataset.file_path)

        if dataframe is None:
            return {"error": "Unable to read dataset."}, 400

        data = request.get_json() or {}

        rules = data.get("rules", {})
        corrections = data.get("corrections", [])

        # تطبيق التعديلات التي اختارها المستخدم
        cleaned_data = apply_numeric_range_corrections(
            dataframe,
            rules,
            corrections
        )

        # حفظ النسخة المعدلة في ملف جديد
        file_extension = os.path.splitext(dataset.file_path)[1]

        new_file_path = os.path.join(
            os.path.dirname(dataset.file_path),
            f"{uuid.uuid4()}{file_extension}"
        )

        save_cleaned_dataset(cleaned_data, new_file_path)

        # تحديث مسار الملف في قاعدة البيانات
        old_file_path = dataset.file_path
        dataset.file_path = new_file_path

        db.session.commit()

        # حذف الملف القديم بعد نجاح الحفظ
        if os.path.exists(old_file_path):
            os.remove(old_file_path)

        return {
            "dataset_id": dataset_id,
            "message": "Numeric corrections saved successfully."
        }, 200

    except Exception as error:
        db.session.rollback()

        if new_file_path and os.path.exists(new_file_path):
            os.remove(new_file_path)

        return {"error": str(error)}, 500


# معالجة القيم المفقودة حسب اختيار المستخدم
@dataset_bp.route(
    "/dataset/<int:dataset_id>/clean-missing",
    methods=["POST"]
)
@jwt_required()
def clean_missing_values(dataset_id):

    user_id = int(get_jwt_identity())

    dataset = get_dataset_for_user(dataset_id, user_id)

    if dataset is None:
        return {"error": "Dataset not found."}, 404

    request_data = request.get_json()

    if request_data is None:
        return {"error": "Request body must be JSON."}, 400

    strategies = request_data.get("strategies")

    if not isinstance(strategies, dict):
        return {"error": "strategies must be an object."}, 400

    dataframe = read_saved_dataset(dataset.file_path)

    if dataframe is None:
        return {"error": "Could not read dataset."}, 400

    new_file_path = None

    try:
        # تطبيق استراتيجيات معالجة القيم المفقودة
        cleaned_dataframe = apply_missing_value_strategies(
            dataframe,
            strategies
        )

        # الحصول على مسار الملف القديم وامتداده
        old_file_path = dataset.file_path
        file_extension = os.path.splitext(old_file_path)[1]

        # إنشاء مسار جديد للملف المنظف
        new_file_path = os.path.join(
            os.path.dirname(old_file_path),
            f"{uuid.uuid4()}{file_extension}"
        )

        # حفظ النسخة المنظفة أولاً
        save_cleaned_dataset(cleaned_dataframe, new_file_path)

        # تحديث مسار الملف في قاعدة البيانات
        dataset.file_path = new_file_path
        db.session.commit()

    except ValueError as error:
        db.session.rollback()

        if new_file_path and os.path.exists(new_file_path):
            os.remove(new_file_path)

        return {"error": str(error)}, 400

    except Exception:
        db.session.rollback()

        if new_file_path and os.path.exists(new_file_path):
            os.remove(new_file_path)

        return {"error": "Could not save cleaned dataset."}, 500

    # حذف الملف القديم بعد نجاح الحفظ وتحديث قاعدة البيانات
    try:
        if os.path.exists(old_file_path):
            os.remove(old_file_path)
    except OSError:
        pass

    return {
        "message": "Dataset cleaned and saved successfully.",
        "dataset_id": dataset.id,
        "rows": len(cleaned_dataframe),
        "columns": len(cleaned_dataframe.columns)
    }, 200

# عرض أعمدة Dataset المحفوظ
@dataset_bp.route("/dataset/<int:dataset_id>/columns", methods=["GET"])
@jwt_required()
def get_dataset_columns(dataset_id):

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # البحث عن Dataset الخاص بالمستخدم
    dataset = get_dataset_for_user(
        dataset_id,
        user_id
    )

    # التحقق من وجود Dataset
    if dataset is None:
        return {
            "error": "Dataset not found."
        }, 404

    # قراءة Dataset من الملف المحفوظ
    dataframe = read_saved_dataset(
        dataset.file_path
    )

    # التحقق من إمكانية قراءة الملف
    if dataframe is None:
        return {
            "error": "Could not read dataset."
        }, 400

    # الحصول على أسماء الأعمدة
    column_names = get_column_names(
        dataframe
    )

    return {
        "dataset_id": dataset.id,
        "column_names": column_names
    }, 200
# عرض بيانات Dataset المحفوظة للمراجعة
@dataset_bp.route(
    "/dataset/<int:dataset_id>/preview",
    methods=["GET"]
)
@jwt_required()
def preview_dataset(dataset_id):

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # البحث عن Dataset الخاص بالمستخدم
    dataset = get_dataset_for_user(
        dataset_id,
        user_id
    )

    # التحقق من وجود Dataset
    if dataset is None:
        return {
            "error": "Dataset not found."
        }, 404

    # قراءة البيانات من الملف المحفوظ
    dataframe = read_saved_dataset(
        dataset.file_path
    )

    # التحقق من إمكانية قراءة الملف
    if dataframe is None:
        return {
            "error": "Could not read dataset."
        }, 400

    # اكتشاف الصفوف المكررة
    duplicate_rows = detect_duplicate_rows(dataframe)

    # حساب القيم المفقودة بعد التنظيف
    missing_values = detect_missing_values(dataframe)

    # تحويل القيم المفقودة إلى None لتكون صالحة في JSON
    dataframe = dataframe.astype(object).where(
        dataframe.notna(),
        None
    )

    # تحويل الصفوف إلى قائمة من القواميس
    rows = dataframe.to_dict(orient="records")

    return {
        "dataset_id": dataset.id,
        "file_name": dataset.file_name,
        "columns": dataframe.columns.tolist(),
        "rows": rows,
        "total_rows": len(dataframe),
        "missing_values": missing_values,
        "duplicate_rows": duplicate_rows
    }, 200


# Get AI recommendation for dataset columns
@dataset_bp.route(
    "/dataset/<int:dataset_id>/ai-recommend-columns",
    methods=["GET"]
)
@jwt_required()
def recommend_dataset_columns(dataset_id):

    # Get user ID from JWT
    user_id = int(get_jwt_identity())

    # Find dataset belonging to the user
    dataset = get_dataset_for_user(
        dataset_id,
        user_id
    )

    # Check if dataset exists
    if dataset is None:
        return {
            "error": "Dataset not found."
        }, 404

    # Get dataset context
    context = get_dataset_context(
        dataset.file_path
    )

    # Build AI prompt
    prompt = build_column_recommendation_prompt(
        context
    )

    # Get and validate AI recommendation
    recommendation = get_validated_ai_column_recommendation(
        prompt,
        context["columns"]
    )

    return {
        "dataset_id": dataset.id,
        "recommendation": recommendation
    }, 200

# Generate AI Quick Examples for a saved dataset
@dataset_bp.route(
    "/dataset/<int:dataset_id>/quick-examples",
    methods=["GET"]
)
@jwt_required()
def get_dataset_quick_examples(dataset_id):

    user_id = int(get_jwt_identity())

    # التحقق من ملكية المستخدم للملف
    dataset = get_dataset_for_user(dataset_id, user_id)

    if dataset is None:
        return {"error": "Dataset not found."}, 404

    try:
        quick_examples, error = generate_ai_quick_examples(
            dataset.file_path
        )

        if error:
            return {"error": error}, 400

        return {
            "dataset_id": dataset.id,
            "quick_examples": quick_examples
        }, 200

    except Exception as error:
        return {"error": str(error)}, 500

# استقبال الأعمدة التي اختارها المستخدم والتحقق منها
@dataset_bp.route(
    "/dataset/<int:dataset_id>/select-columns",
    methods=["POST"]
)
@jwt_required()
def select_dataset_columns(dataset_id):

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # البحث عن Dataset الخاص بالمستخدم
    dataset = get_dataset_for_user(
        dataset_id,
        user_id
    )

    # التحقق من وجود Dataset
    if dataset is None:
        return {
            "error": "Dataset not found."
        }, 404

    # التحقق من وجود JSON body
    request_data = request.get_json()

    if request_data is None:
        return {
            "error": "Request body must be JSON."
        }, 400

    # الحصول على الأعمدة التي اختارها المستخدم
    selected_columns = request_data.get(
        "selected_columns"
    )

    # التحقق من إرسال selected_columns
    if selected_columns is None:
        return {
            "error": "selected_columns is required."
        }, 400

    # التحقق من أن selected_columns قائمة
    if not isinstance(selected_columns, list):
        return {
            "error": "selected_columns must be a list."
        }, 400

    # قراءة Dataset المحفوظ
    dataframe = read_saved_dataset(
        dataset.file_path
    )

    # التحقق من إمكانية قراءة Dataset
    if dataframe is None:
        return {
            "error": "Could not read dataset."
        }, 400

    # التحقق من صحة الأعمدة المختارة
    validation_result = validate_selected_columns(
        dataframe,
        selected_columns
    )

    # إذا كان هناك عمود غير موجود
    if not validation_result["is_valid"]:
        return {
            "error": "One or more selected columns are invalid.",
            "invalid_columns": validation_result["invalid_columns"]
        }, 400

    return {
        "message": "Columns selected successfully.",
        "dataset_id": dataset.id,
        "selected_columns": selected_columns
    }, 200

# اكتشاف الصفوف المكررة في Dataset
@dataset_bp.route("/dataset/<int:dataset_id>/detect-duplicate-rows", methods=["POST"])
@jwt_required()
def detect_dataset_duplicate_rows(dataset_id):

    user_id = get_jwt_identity()
    dataset = get_dataset_for_user(dataset_id, user_id)

    if not dataset:
        return {"error": "Dataset not found."}, 404

    try:
        dataframe = read_saved_dataset(dataset.file_path)

        if dataframe is None:
            return {"error": "Unable to read dataset."}, 400

        result = detect_duplicate_rows(dataframe)

        return {
            "dataset_id": dataset_id,
            "duplicate_rows": result
        }, 200

    except Exception as e:
        return {"error": str(e)}, 500
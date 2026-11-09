from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.analysis_session import AnalysisSession
from database.database import db
from models.dataset import Dataset

from services.visualization_service import (
    execute_visualization,
    validate_visualization_for_analysis,
    generate_visualization_png
)

from services.analysis_service import (
    recommend_analysis_types,
    validate_analysis_type,
    execute_descriptive_analysis,
    execute_comparative_analysis,
    execute_relationship_analysis,
    execute_distribution_analysis,
    execute_outlier_analysis
)

from services.ai_service import (
    get_analysis_context,
    build_analysis_recommendation_prompt,
    generate_ai_analysis_recommendation,
    build_visualization_recommendation_prompt,
    get_ai_visualization_recommendation,
    build_ai_explanation_prompt,
    get_ai_explanation

)


from services.dataset_service import (
    get_dataset_for_user,
    read_saved_dataset,
    validate_selected_columns,
    normalize_missing_values
)

from services.pdf_service import generate_pdf_report



analysis_bp = Blueprint("analysis", __name__)


# اقتراح أنواع التحليل المناسبة للأعمدة المختارة
@analysis_bp.route(
    "/analysis/recommend",
    methods=["POST"]
)
@jwt_required()
def recommend_analysis():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # الحصول على البيانات المرسلة من المستخدم
    request_data = request.get_json()

    # التحقق من وجود البيانات
    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    # الحصول على Dataset ID
    dataset_id = request_data.get("dataset_id")

    # الحصول على الأعمدة المختارة
    selected_columns = request_data.get(
        "selected_columns"
    )

    # التحقق من وجود Dataset ID
    if dataset_id is None:
        return {
            "error": "dataset_id is required."
        }, 400

    # التحقق من وجود الأعمدة المختارة
    if not selected_columns:
        return {
            "error": "selected_columns is required."
        }, 400

    # التحقق من أن الأعمدة المختارة عبارة عن قائمة
    if not isinstance(selected_columns, list):
        return {
            "error": "selected_columns must be a list."
        }, 400

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

    # إرجاع الخطأ إذا كان هناك عمود غير موجود
    if not validation_result["is_valid"]:
        return {
            "error": (
                "One or more selected columns "
                "do not exist."
            ),
            "invalid_columns": (
                validation_result["invalid_columns"]
            )
        }, 400

    # الحصول على أنواع التحليل المناسبة
    recommendations = recommend_analysis_types(
        dataframe,
        selected_columns
    )

    return {
        "dataset_id": dataset_id,
        "selected_columns": selected_columns,
        "recommended_analysis_types": recommendations
    }, 200


# الحصول على توصية AI لأنواع التحليل المناسبة
@analysis_bp.route(
    "/analysis/ai-recommend",
    methods=["POST"]
)
@jwt_required()
def ai_recommend_analysis():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # الحصول على البيانات المرسلة من المستخدم
    request_data = request.get_json()

    # التحقق من وجود البيانات
    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    # الحصول على Dataset ID
    dataset_id = request_data.get("dataset_id")

    # الحصول على الأعمدة المختارة
    selected_columns = request_data.get(
        "selected_columns"
    )

    # التحقق من وجود Dataset ID
    if dataset_id is None:
        return {
            "error": "dataset_id is required."
        }, 400

    # التحقق من وجود الأعمدة المختارة
    if not selected_columns:
        return {
            "error": "selected_columns is required."
        }, 400

    # التحقق من أن الأعمدة المختارة عبارة عن قائمة
    if not isinstance(selected_columns, list):
        return {
            "error": "selected_columns must be a list."
        }, 400

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

    # إرجاع الخطأ إذا كان هناك عمود غير موجود
    if not validation_result["is_valid"]:
        return {
            "error": (
                "One or more selected columns "
                "do not exist."
            ),
            "invalid_columns": (
                validation_result["invalid_columns"]
            )
        }, 400

    # الحصول على سياق البيانات الخاص بالـAI
    context = get_analysis_context(
        dataset.file_path,
        selected_columns
    )

    # بناء Prompt الخاص بتوصية التحليل
    prompt = build_analysis_recommendation_prompt(
        context
    )

    # توليد توصية التحليل والتحقق منها
    recommendation, error = (
        generate_ai_analysis_recommendation(
            prompt,
            context["column_types"]
        )
    )

    # التعامل مع خطأ AI
    if error:
        return {
            "error": error
        }, 500

    return {
        "dataset_id": dataset_id,
        "selected_columns": selected_columns,
        "ai_recommendation": recommendation
    }, 200


# استقبال نوع التحليل الذي اختاره المستخدم والتحقق منه
@analysis_bp.route(
    "/analysis/select-type",
    methods=["POST"]
)
@jwt_required()
def select_analysis_type():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # الحصول على البيانات المرسلة من المستخدم
    request_data = request.get_json()

    # التحقق من وجود البيانات
    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    # الحصول على البيانات المطلوبة
    dataset_id = request_data.get("dataset_id")
    selected_columns = request_data.get(
        "selected_columns"
    )
    analysis_type = request_data.get(
        "analysis_type"
    )

    # التحقق من وجود Dataset ID
    if dataset_id is None:
        return {
            "error": "dataset_id is required."
        }, 400

    # التحقق من وجود الأعمدة المختارة
    if not selected_columns:
        return {
            "error": "selected_columns is required."
        }, 400

    # التحقق من أن الأعمدة المختارة عبارة عن قائمة
    if not isinstance(selected_columns, list):
        return {
            "error": "selected_columns must be a list."
        }, 400

    # التحقق من وجود نوع التحليل
    if not analysis_type:
        return {
            "error": "analysis_type is required."
        }, 400

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

    # إرجاع الخطأ إذا كان هناك عمود غير موجود
    if not validation_result["is_valid"]:
        return {
            "error": (
                "One or more selected columns "
                "do not exist."
            ),
            "invalid_columns": (
                validation_result["invalid_columns"]
            )
        }, 400

    # التحقق من أن نوع التحليل مناسب للأعمدة المختارة
    analysis_validation = validate_analysis_type(
        dataframe,
        selected_columns,
        analysis_type
    )

    # إرجاع الخطأ إذا كان نوع التحليل غير مناسب
    if not analysis_validation["is_valid"]:
        return {
            "error": (
                "The selected analysis type "
                "is not supported for these columns."
            ),
            "supported_analysis_types": (
                analysis_validation[
                    "supported_analysis_types"
                ]
            )
        }, 400

    return {
        "message": (
            "Analysis type selected successfully."
        ),
        "dataset_id": dataset_id,
        "selected_columns": selected_columns,
        "analysis_type": analysis_type
    }, 200


# تنفيذ التحليل المختار
# ثم الحصول على توصية الـAI للـVisualization
# ثم تنفيذ ثلاثة رسوم بيانية موصى بها من الـAI
# ثم الحصول على AI Explanation وحفظ جلسة التحليل

@analysis_bp.route(
    "/analysis/execute",
    methods=["POST"]
)
@jwt_required()
def execute_analysis():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # الحصول على البيانات المرسلة من المستخدم
    request_data = request.get_json()

    # التحقق من وجود البيانات
    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    # الحصول على البيانات المطلوبة
    dataset_id = request_data.get("dataset_id")

    selected_columns = request_data.get(
        "selected_columns"
    )

    analysis_type = request_data.get(
        "analysis_type"
    )

    # التحقق من وجود Dataset ID
    if dataset_id is None:
        return {
            "error": "dataset_id is required."
        }, 400

    # التحقق من وجود الأعمدة المختارة
    if not selected_columns:
        return {
            "error": "selected_columns is required."
        }, 400

    # التحقق من أن الأعمدة المختارة عبارة عن قائمة
    if not isinstance(selected_columns, list):
        return {
            "error": "selected_columns must be a list."
        }, 400

    # التحقق من وجود نوع التحليل
    if not analysis_type:
        return {
            "error": "analysis_type is required."
        }, 400

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

    # إرجاع الخطأ إذا كان هناك عمود غير موجود
    if not validation_result["is_valid"]:
        return {
            "error": (
                "One or more selected columns "
                "are invalid."
            ),
            "invalid_columns": (
                validation_result["invalid_columns"]
            )
        }, 400

    # التحقق من أن نوع التحليل مناسب للأعمدة المختارة
    analysis_validation = validate_analysis_type(
        dataframe,
        selected_columns,
        analysis_type
    )

    # إرجاع الخطأ إذا كان نوع التحليل غير مناسب
    if not analysis_validation["is_valid"]:
        return {
            "error": (
                "The selected analysis type "
                "is not supported for these columns."
            ),
            "supported_analysis_types": (
                analysis_validation[
                    "supported_analysis_types"
                ]
            )
        }, 400

    # توحيد Missing Values في نسخة من البيانات
    dataframe = normalize_missing_values(dataframe)

    # تنفيذ التحليل المختار
    if analysis_type == "descriptive":

        result = execute_descriptive_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "comparative":

        result = execute_comparative_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "relationship":

        result = execute_relationship_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "distribution":

        result = execute_distribution_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "outlier":

        result = execute_outlier_analysis(
            dataframe,
            selected_columns
        )

    else:

        return {
            "error": (
                "This analysis type has "
                "not been implemented yet."
            )
        }, 501

    # الحصول على سياق البيانات الخاص بالـAI
    context = get_analysis_context(
        dataset.file_path,
        selected_columns
    )

    # بناء Prompt الخاص بتوصية الـVisualization
    visualization_prompt = (
        build_visualization_recommendation_prompt(
            context,
            analysis_type
        )
    )

    # الحصول على توصية الـAI للرسوم البيانية
    visualization_recommendation, error = (
        get_ai_visualization_recommendation(
            visualization_prompt
        )
    )

    # التعامل مع خطأ الـAI
    if error:
        return {
            "error": (
                "AI visualization recommendation "
                "is temporarily unavailable."
            ),
            "details": error,
            "retryable": True
        }, 503

    # تنفيذ الرسوم البيانية التي أوصى بها AI
    charts_results = []

    for chart in visualization_recommendation["charts"]:

        # البحث عن أول Visualization مناسب للبيانات
        selected_visualization = None

        for visualization_option in chart["visualization_options"]:

            # التحقق من ملاءمة الرسم البياني
            visualization_validation = (
                validate_visualization_for_analysis(
                    dataframe,
                    selected_columns,
                    analysis_type,
                    visualization_option
                )
            )

            # اختيار أول رسم يجتاز التحقق
            if visualization_validation["is_valid"]:

                selected_visualization = visualization_option
                break

        # تجاوز الرسم إذا لم نجد خيارًا مناسبًا
        if selected_visualization is None:
            continue

        # تنفيذ الرسم البياني المختار
        visualization_result, visualization_error = (
            execute_visualization(
                dataframe,
                selected_columns,
                selected_visualization
            )
        )

        # التعامل مع خطأ تنفيذ الرسم
        if visualization_error:

            return {
                "error": (
                    "Could not execute the "
                    "AI-recommended visualization."
                ),
                "chart_id": chart["chart_id"],
                "details": visualization_error
            }, 501

        # حفظ نتيجة الرسم وخياراته
        charts_results.append({
            "chart_id": chart["chart_id"],
            "purpose": chart["purpose"],
            "reason": chart["reason"],
            "visualization_options": (
                chart["visualization_options"]
            ),
            "selected_visualization": (
                selected_visualization
            ),
            "visualization": visualization_result
        })


    # بناء Prompt الخاص بشرح نتائج التحليل
    explanation_prompt = build_ai_explanation_prompt(
        analysis_type,
        selected_columns,
        result,
        charts_results
    )

    # الحصول على شرح النتائج من Gemini
    ai_explanation, explanation_error = (
        get_ai_explanation(
            explanation_prompt
        )
    )

    # إنشاء جلسة تحليل جديدة بعد تجهيز النتائج والشرح
    analysis_session = AnalysisSession(
        user_id=user_id,
        dataset_id=dataset_id,
        analysis_type=analysis_type,
        selected_columns=selected_columns,
        visualization_recommendation=visualization_recommendation,
        ai_explanation=ai_explanation
    )

    # حفظ جلسة التحليل في قاعدة البيانات
    db.session.add(analysis_session)
    db.session.commit()

    # إرجاع نتيجة التحليل والرسوم البيانية الثلاثة
    return {
        "dataset_id": dataset_id,
        "analysis_session_id": analysis_session.id,
        "selected_columns": selected_columns,
        "analysis_type": analysis_type,
        "result": result,
        "ai_explanation": ai_explanation,
        "visualization_recommendation": (
            visualization_recommendation
        ),
        "charts": charts_results
    }, 200



# تنفيذ Visualization اختارها المستخدم
# لأحد الرسوم البيانية الثلاثة
@analysis_bp.route(
    "/analysis/visualization",
    methods=["POST"]
)
@jwt_required()
def execute_selected_visualization():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # الحصول على البيانات المرسلة من المستخدم
    request_data = request.get_json()

    # التحقق من وجود البيانات
    if not request_data:
        return {
            "error": "No request data was provided."
        }, 400

    # الحصول على البيانات المطلوبة
    analysis_session_id = request_data.get(
        "analysis_session_id"
    )

    chart_id = request_data.get("chart_id")

    visualization_type = request_data.get(
        "visualization_type"
    )

    # التحقق من وجود رقم جلسة التحليل
    if (
        not isinstance(analysis_session_id, int)
        or isinstance(analysis_session_id, bool)
        or analysis_session_id <= 0
    ):
        return {
            "error": "A valid analysis_session_id is required."
        }, 400

    # التحقق من رقم الرسم البياني
    if (
        not isinstance(chart_id, int)
        or isinstance(chart_id, bool)
        or chart_id not in [1, 2, 3]
    ):
        return {
            "error": "chart_id must be 1, 2, or 3."
        }, 400

    # التحقق من وجود نوع الـVisualization
    if (
        not isinstance(visualization_type, str)
        or not visualization_type.strip()
    ):
        return {
            "error": "visualization_type is required."
        }, 400

    # البحث عن جلسة التحليل الخاصة بالمستخدم
    analysis_session = AnalysisSession.query.filter_by(
        id=analysis_session_id,
        user_id=user_id
    ).first()

    # التحقق من وجود جلسة التحليل
    if analysis_session is None:
        return {
            "error": "Analysis session not found."
        }, 404

    # استرجاع بيانات التحليل المحفوظة
    dataset_id = analysis_session.dataset_id

    selected_columns = (
        analysis_session.selected_columns
    )

    analysis_type = analysis_session.analysis_type

    # استرجاع شرح الذكاء الاصطناعي المحفوظ
    ai_explanation = analysis_session.ai_explanation

    visualization_recommendation = (
        analysis_session.visualization_recommendation
    )

    # التحقق من صحة توصيات الـVisualization المحفوظة
    if not isinstance(visualization_recommendation, dict):
        return {
            "error": "Invalid visualization recommendations."
        }, 500

    # استرجاع قائمة الرسوم البيانية الموصى بها
    charts = visualization_recommendation.get(
        "charts",
        []
    )

    # التحقق من أن قائمة الرسوم صحيحة
    if not isinstance(charts, list):
        return {
            "error": "Invalid chart recommendations."
        }, 500

    # البحث عن الرسم المطلوب
    chart = next(
        (
            item for item in charts
            if (
                isinstance(item, dict)
                and item.get("chart_id") == chart_id
            )
        ),
        None
    )

    # التحقق من وجود الرسم ضمن التوصيات
    if chart is None:
        return {
            "error": "Chart not found in analysis recommendations."
        }, 404

    # استرجاع الخيارات الأصلية لهذا الرسم
    visualization_options = chart.get(
        "visualization_options",
        []
    )

    # التحقق من صحة قائمة الخيارات المحفوظة
    if (
        not isinstance(visualization_options, list)
        or not 1 <= len(visualization_options) <= 3
    ):
        return {
            "error": "Invalid visualization options."
        }, 500

    # التحقق من أن الخيار المختار ضمن توصيات هذا الرسم
    if visualization_type not in visualization_options:
        return {
            "error": (
                "The selected visualization "
                "is not among this chart's recommended options."
            )
        }, 400

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

    # قراءة Dataset
    dataframe = read_saved_dataset(
        dataset.file_path
    )

    # التحقق من إمكانية قراءة Dataset
    if dataframe is None:
        return {
            "error": "Could not read dataset."
        }, 400

    # التحقق من صحة الأعمدة
    validation_result = validate_selected_columns(
        dataframe,
        selected_columns
    )

    # إرجاع الخطأ إذا كان هناك عمود غير موجود
    if not validation_result["is_valid"]:
        return {
            "error": (
                "One or more selected columns "
                "are invalid."
            ),
            "invalid_columns": (
                validation_result["invalid_columns"]
            )
        }, 400

    # التحقق من أن نوع التحليل مناسب للأعمدة
    analysis_validation = validate_analysis_type(
        dataframe,
        selected_columns,
        analysis_type
    )

    # إرجاع الخطأ إذا كان نوع التحليل غير مناسب
    if not analysis_validation["is_valid"]:
        return {
            "error": (
                "The selected analysis type "
                "is not supported for these columns."
            ),
            "supported_analysis_types": (
                analysis_validation[
                    "supported_analysis_types"
                ]
            )
        }, 400

    # التحقق من أن الـVisualization مناسبة
    # لنوع التحليل والأعمدة المختارة
    visualization_validation = (
        validate_visualization_for_analysis(
            dataframe,
            selected_columns,
            analysis_type,
            visualization_type
        )
    )

    # إرجاع الخطأ إذا كانت الـVisualization غير مناسبة
    if not visualization_validation["is_valid"]:
        return {
            "error": (
                "The selected visualization "
                "is not suitable for this analysis."
            ),
            "details": (
                visualization_validation["error"]
            )
        }, 400

    # توحيد Missing Values
    dataframe = normalize_missing_values(dataframe)

    # تنفيذ الـVisualization
    visualization_result, visualization_error = (
        execute_visualization(
            dataframe,
            selected_columns,
            visualization_type
        )
    )

    # التعامل مع خطأ التنفيذ
    if visualization_error:
        return {
            "error": (
                "Could not execute the "
                "selected visualization."
            ),
            "details": visualization_error
        }, 400

    # إرجاع نتيجة الـVisualization
    return {
        "analysis_session_id": analysis_session_id,
        "dataset_id": dataset_id,
        "chart_id": chart_id,
        "analysis_type": analysis_type,
        "visualization_type": visualization_type,
        "visualization": visualization_result,
        "ai_explanation": ai_explanation
    }, 200

# تصدير رسم بياني بصيغة PNG
@analysis_bp.route(
    "/analysis/export/png",
    methods=["POST"]
)
@jwt_required()
def export_visualization_png():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # الحصول على البيانات المرسلة من المستخدم
    request_data = request.get_json()

    if not request_data:
        return {
            "error": "Request body is required"
        }, 400

    analysis_session_id = request_data.get(
        "analysis_session_id"
    )

    chart_id = request_data.get("chart_id")

    visualization_type = request_data.get(
        "visualization_type"
    )

    # التحقق من البيانات المطلوبة
    if not analysis_session_id or not chart_id or not visualization_type:
        return {
            "error": "Missing required fields"
        }, 400

    # التحقق من صحة chart_id
    if chart_id not in [1, 2, 3]:
        return {
            "error": "Invalid chart_id"
        }, 400

    # التحقق من ملكية جلسة التحليل
    analysis_session = AnalysisSession.query.filter_by(
        id=analysis_session_id,
        user_id=user_id
    ).first()

    if not analysis_session:
        return {
            "error": "Analysis session not found"
        }, 404

    # الحصول على بيانات جلسة التحليل
    dataset_id = analysis_session.dataset_id
    selected_columns = analysis_session.selected_columns
    analysis_type = analysis_session.analysis_type
    visualization_recommendation = (
        analysis_session.visualization_recommendation
    )

    # التحقق من توصيات الرسوم البيانية
    if not isinstance(visualization_recommendation, dict):
        return {
            "error": "Visualization recommendation not found"
        }, 400

    charts = visualization_recommendation.get("charts", [])

    # البحث عن الرسم المطلوب
    selected_chart = next(
        (
            chart for chart in charts
            if chart.get("chart_id") == chart_id
        ),
        None
    )

    if not selected_chart:
        return {
            "error": "Chart not found"
        }, 404

    # التحقق من أن نوع الرسم ضمن الخيارات الموصى بها
    visualization_options = selected_chart.get(
        "visualization_options", []
    )

    if visualization_type not in visualization_options:
        return {
            "error": "Invalid visualization type for this chart"
        }, 400

    # الحصول على Dataset الخاص بالمستخدم
    dataset = get_dataset_for_user(
        dataset_id,
        user_id
    )

    if not dataset:
        return {
            "error": "Dataset not found"
        }, 404

    # قراءة بيانات الملف
    dataframe = read_saved_dataset(
        dataset.file_path
    )

    # التحقق من وجود الأعمدة المطلوبة
    if not all(
        column in dataframe.columns
        for column in selected_columns
    ):
        return {
            "error": "Selected columns not found in dataset"
        }, 400

    # التحقق من صلاحية نوع التحليل مع الرسم
    validation_result = validate_visualization_for_analysis(
        dataframe,
        selected_columns,
        analysis_type,
        visualization_type
    )

    if not validation_result["is_valid"]:
        return {
            "error": validation_result["error"]
        }, 400

    # معالجة القيم المفقودة
    dataframe = normalize_missing_values(dataframe)

    # تنفيذ الرسم البياني
    visualization_result, error = execute_visualization(
        dataframe,
        selected_columns,
        visualization_type
    )
    if error:
        print("Visualization Execution Error:", repr(error))

        return {
         "error": "Visualization execution failed",
            "details": repr(error)
    }, 400

    # تحويل نتيجة الرسم إلى صورة PNG
    try:

        image_buffer = generate_visualization_png(
            visualization_result
        )

        image_buffer.seek(0)

        return send_file(
            image_buffer,
            mimetype="image/png",
            as_attachment=True,
            download_name=f"chart_{chart_id}.png"
        )

    except Exception as e:
        print("PNG Export Error:", repr(e))
        print("Visualization Result Type:", type(visualization_result))
        print("Visualization Result:", visualization_result)

        return {
            "error": "Failed to generate PNG image",
            "details": str(e),
            "result_type": str(type(visualization_result)),
            "result_data": str(visualization_result)[:1000]
    }, 500

# تصدير تقرير التحليل بصيغة PDF
@analysis_bp.route(
    "/analysis/export/pdf",
    methods=["POST"]
)
@jwt_required()
def export_analysis_pdf():

    # الحصول على معرف المستخدم من JWT
    user_id = int(get_jwt_identity())

    # الحصول على البيانات المرسلة
    request_data = request.get_json()

    if not request_data:
        return {
            "error": "Request body is required"
        }, 400

    analysis_session_id = request_data.get(
        "analysis_session_id"
    )

    chart_id = request_data.get("chart_id")

    visualization_type = request_data.get(
        "visualization_type"
    )

    # التحقق من البيانات المطلوبة
    if not all([
        analysis_session_id,
        chart_id,
        visualization_type
    ]):
        return {
            "error": "Missing required fields"
        }, 400

    # التحقق من صحة chart_id
    if chart_id not in [1, 2, 3]:
        return {
            "error": "Invalid chart_id"
        }, 400

    # البحث عن جلسة التحليل الخاصة بالمستخدم
    analysis_session = AnalysisSession.query.filter_by(
        id=analysis_session_id,
        user_id=user_id
    ).first()

    if not analysis_session:
        return {
            "error": "Analysis session not found"
        }, 404

    # استرجاع بيانات التحليل
    dataset_id = analysis_session.dataset_id
    selected_columns = analysis_session.selected_columns
    analysis_type = analysis_session.analysis_type
    ai_explanation = analysis_session.ai_explanation

    visualization_recommendation = (
        analysis_session.visualization_recommendation
    )

    # التحقق من توصيات الرسوم البيانية
    if not isinstance(visualization_recommendation, dict):
        return {
            "error": "Invalid visualization recommendation"
        }, 400

    charts = visualization_recommendation.get("charts", [])

    # البحث عن الرسم المطلوب
    selected_chart = next(
        (
            chart for chart in charts
            if (
                isinstance(chart, dict)
                and chart.get("chart_id") == chart_id
            )
        ),
        None
    )

    if not selected_chart:
        return {
            "error": "Chart not found"
        }, 404

    # التحقق من نوع الرسم المختار
    visualization_options = selected_chart.get(
        "visualization_options", []
    )

    if visualization_type not in visualization_options:
        return {
            "error": "Invalid visualization type"
        }, 400

    # الحصول على Dataset الخاص بالمستخدم
    dataset = get_dataset_for_user(
        dataset_id,
        user_id
    )

    if not dataset:
        return {
            "error": "Dataset not found"
        }, 404

    # قراءة بيانات الملف
    dataframe = read_saved_dataset(
        dataset.file_path
    )

    if dataframe is None:
        return {
            "error": "Could not read dataset"
        }, 400

    # التحقق من الأعمدة المختارة
    validation_result = validate_selected_columns(
        dataframe,
        selected_columns
    )

    if not validation_result["is_valid"]:
        return {
            "error": "Selected columns are invalid",
            "invalid_columns": validation_result["invalid_columns"]
        }, 400

    # التحقق من صلاحية نوع التحليل
    analysis_validation = validate_analysis_type(
        dataframe,
        selected_columns,
        analysis_type
    )

    if not analysis_validation["is_valid"]:
        return {
            "error": "Invalid analysis type"
        }, 400

    # توحيد القيم المفقودة
    dataframe = normalize_missing_values(dataframe)

    # تنفيذ التحليل المختار
    if analysis_type == "descriptive":
        result = execute_descriptive_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "comparative":
        result = execute_comparative_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "relationship":
        result = execute_relationship_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "distribution":
        result = execute_distribution_analysis(
            dataframe,
            selected_columns
        )

    elif analysis_type == "outlier":
        result = execute_outlier_analysis(
            dataframe,
            selected_columns
        )

    else:
        return {
            "error": "Unsupported analysis type"
        }, 400

    # التحقق من ملاءمة الرسم المختار
    visualization_validation = (
        validate_visualization_for_analysis(
            dataframe,
            selected_columns,
            analysis_type,
            visualization_type
        )
    )

    if not visualization_validation["is_valid"]:
        return {
            "error": visualization_validation["error"]
        }, 400

    # تنفيذ الرسم الذي اختاره المستخدم
    visualization_result, error = execute_visualization(
        dataframe,
        selected_columns,
        visualization_type
    )

    if error:
        return {
            "error": "Visualization execution failed",
            "details": str(error)
        }, 400

    try:

        # تحويل الرسم إلى صورة PNG مؤقتة
        image_buffer = generate_visualization_png(
            visualization_result
        )

        # إنشاء تقرير PDF
        pdf_buffer = generate_pdf_report(
            dataset_name=dataset.file_name,
            created_at=analysis_session.created_at,
            analysis_type=analysis_type,
            selected_columns=selected_columns,
            result=result,
            image_buffer=image_buffer,
            ai_explanation=ai_explanation
        )

        # إرسال ملف PDF للتنزيل
        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="DataNarrator_Report.pdf"
        )

    except Exception as e:

        print("PDF Export Error:", repr(e))

        return {
            "error": "Failed to generate PDF report",
            "details": str(e)
        }, 500
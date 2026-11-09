import os
import json

from click import prompt
import pandas as pd
from dotenv import load_dotenv
from google import genai

from services.visualization_service import (
    SUPPORTED_VISUALIZATIONS
)

from services.dataset_service import (
    detect_datetime_columns,
    normalize_missing_values,
    read_saved_dataset
)

# Load Gemini API key from .env file
load_dotenv()

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

# Initialize Gemini client
client = genai.Client(
    api_key=GEMINI_API_KEY
)


# Supported analysis types
SUPPORTED_ANALYSIS_TYPES = [
    "descriptive",
    "comparative",
    "relationship",
    "distribution",
    "outlier"
]


# ============================================================
# Dataset Context
# ============================================================

# Get dataset information for AI recommendation
def get_dataset_context(file_path):

    if file_path.endswith(".csv"):

        dataframe = pd.read_csv(
            file_path
        )

    elif file_path.endswith(
        (".xlsx", ".xls")
    ):

        dataframe = pd.read_excel(
            file_path
        )

  
    else:

        raise ValueError(
            "Unsupported file format"
        )

    # توحيد Missing Values في نسخة من البيانات
    dataframe = normalize_missing_values(dataframe)

    context = {

        "columns": dataframe.columns.tolist(),
        "data_types": (
            dataframe.dtypes.astype(str).to_dict()
        ),
        "sample_data": (
            dataframe.head(20)
            .to_dict(orient="records")
        )
    }

    return context


# ============================================================
# AI Column Recommendation
# ============================================================

# Build prompt for AI column recommendation
def build_column_recommendation_prompt(
    context
):

    prompt = f"""
You are a data analysis assistant for DataNarrator.

Your task is to recommend the most suitable columns
for data analysis.

Dataset columns:
{context["columns"]}

Data types:
{context["data_types"]}

First 20 rows:
{context["sample_data"]}

Recommend:

1. One suitable grouping column, if applicable.
2. One or more suitable measure columns.
3. A short reason for your recommendation.

Return JSON only.

Return exactly this structure:

{{
    "grouping_column": "...",
    "measure_columns": [
        "..."
    ],
    "reason": "..."
}}
"""

    return prompt


# Send column recommendation request to Gemini
def get_ai_column_recommendation(
    prompt
):

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )

    if not response or not response.text:

        raise ValueError(
            "Gemini returned an empty response"
        )

    return response.text


# Parse AI column recommendation
def parse_ai_column_recommendation(
    response_text
):

    if not response_text:

        raise ValueError(
            "Gemini returned an empty response"
        )

    cleaned_text = response_text.strip()

    if cleaned_text.startswith(
        "```json"
    ):

        cleaned_text = cleaned_text[7:]

    elif cleaned_text.startswith(
        "```"
    ):

        cleaned_text = cleaned_text[3:]

    if cleaned_text.endswith("```"):

        cleaned_text = cleaned_text[:-3]

    cleaned_text = cleaned_text.strip()

    try:

        return json.loads(
            cleaned_text
        )

    except json.JSONDecodeError:

        raise ValueError(
            "Gemini returned an invalid JSON response"
        )


# Validate AI-recommended columns
def validate_ai_column_recommendation(
    recommendation,
    available_columns
):

    grouping_column = (
        recommendation.get(
            "grouping_column"
        )
    )

    measure_columns = (
        recommendation.get(
            "measure_columns",
            []
        )
    )

    if grouping_column:

        if grouping_column not in available_columns:

            raise ValueError(
                "AI recommended an invalid "
                "grouping column"
            )

    if not isinstance(
        measure_columns,
        list
    ):

        raise ValueError(
            "measure_columns must be a list"
        )

    for column in measure_columns:

        if column not in available_columns:

            raise ValueError(
                "AI recommended an invalid "
                "measure column"
            )

    return True


# Get and validate AI column recommendation
def get_validated_ai_column_recommendation(
    prompt,
    available_columns
):

    response_text = (
        get_ai_column_recommendation(
            prompt
        )
    )

    recommendation = (
        parse_ai_column_recommendation(
            response_text
        )
    )

    validate_ai_column_recommendation(
        recommendation,
        available_columns
    )

    return recommendation

# ============================================================
# AI Quick Examples
# ============================================================

# Get dataset context for Quick Examples
def get_quick_examples_context(file_path):

    # قراءة الملف مع الحفاظ على أسماء الأعمدة الأصلية
    dataframe = read_saved_dataset(file_path)

    if dataframe is None:
        raise ValueError("Unsupported file format.")

    # توحيد Missing Values
    dataframe = normalize_missing_values(dataframe)

    # تجهيز معلومات الأعمدة
    columns_info = []

    for position, column in enumerate(dataframe.columns):

        columns_info.append({
            "name": str(column),
            "data_type": str(dataframe.iloc[:, position].dtype)
        })

    # استخراج عينة صغيرة من البيانات
    sample_data = []

    for _, row in dataframe.head(10).iterrows():

        sample_row = {}

        for position, column in enumerate(dataframe.columns):

            value = row.iloc[position]

            if pd.isna(value):
                value = None

            elif hasattr(value, "isoformat"):
                value = value.isoformat()

            elif hasattr(value, "item"):
                value = value.item()

            sample_row[str(column)] = value

        sample_data.append(sample_row)

    return {
        "columns": columns_info,
        "sample_data": sample_data
    }


# Build prompt for AI Quick Examples
def build_quick_examples_prompt(context):

    prompt = f"""
You are a data analysis assistant for DataNarrator.

Your task is to generate exactly 3 useful analytical
examples based on the provided dataset.

Dataset columns and data types:
{context["columns"]}

Sample data:
{context["sample_data"]}

Instructions:

- Generate exactly 3 different analytical goals.
- Each goal must be relevant to the actual dataset.
- Use simple language understandable by beginners.
- Each goal must represent a meaningful analysis.
- Select only columns that exist in the dataset.
- Use the exact column names provided.
- Each goal must include one or more relevant columns.
- Do not invent column names.
- Avoid repeating the same analytical goal.
- Include an appropriate emoji in each label.
- Keep labels short and hints easy to understand.

Return JSON only.

- The quick_examples array must contain exactly 3 objects.
- Every object must include label, hint, and columns.

Use exactly this structure:

{{
    "quick_examples": [
        {{
            "label": "📈 Sales Trends",
            "hint": "Explore how sales change over time.",
            "columns": ["Order Date", "Sales"]
        }}
    ]
}}
"""

    return prompt

# Send Quick Examples request to Gemini
def get_ai_quick_examples(prompt):

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.3
            }
        )

        if not response or not response.text:

            return None, "Gemini returned an empty response"

        return response.text, None

    except Exception as error:

        error_message = str(error)

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
        ):

            return (
                None,
                "Gemini quota has been exceeded. "
                "Please try again later."
            )

        if (
            "503" in error_message
            or "UNAVAILABLE" in error_message
        ):

            return (
                None,
                "Gemini service is temporarily unavailable. "
                "Please try again later."
            )

        return None, f"Gemini request failed: {error_message}"

# Parse Quick Examples response
def parse_ai_quick_examples(response_text):

    if not response_text:

        return None, "Gemini returned an empty response"

    cleaned_text = response_text.strip()

    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text[7:]

    elif cleaned_text.startswith("```"):
        cleaned_text = cleaned_text[3:]

    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3]

    try:

        result = json.loads(cleaned_text.strip())

        return result, None

    except json.JSONDecodeError:

        return None, "Gemini returned an invalid JSON response"


# Validate Quick Examples returned by Gemini
def validate_ai_quick_examples(result, available_columns):

    if not isinstance(result, dict):

        return False, "AI response must be a JSON object"

    examples = result.get("quick_examples")

    if not isinstance(examples, list) or len(examples) != 3:

        return False, "AI must return exactly 3 quick examples"

    for example in examples:

        if not isinstance(example, dict):
            return False, "Invalid quick example structure"

        label = example.get("label")
        hint = example.get("hint")
        columns = example.get("columns")

        if (
            not isinstance(label, str)
            or not label.strip()
            or not isinstance(hint, str)
            or not hint.strip()
        ):
            return False, "Invalid quick example label or hint"

        if not isinstance(columns, list) or not columns:

            return False, "Each example must contain at least one column"

        if len(set(columns)) != len(columns):

            return False, "Duplicate columns found in a quick example"

        for column in columns:

            if column not in available_columns:

                return False, f"Invalid column recommended by AI: {column}"

    return True, None


# Generate and validate Quick Examples
def generate_ai_quick_examples(file_path):

    context = get_quick_examples_context(file_path)

    prompt = build_quick_examples_prompt(context)

    response_text, error = get_ai_quick_examples(prompt)

    if error:
        return None, error

    result, error = parse_ai_quick_examples(response_text)

    if error:
        return None, error

    available_columns = [
        column["name"]
        for column in context["columns"]
    ]

    is_valid, error = validate_ai_quick_examples(
        result,
        available_columns
    )

    if not is_valid:
        return None, error

    return result["quick_examples"], None

# دمج الأعمدة من الأمثلة المختارة بدون تكرار
def merge_selected_quick_example_columns(quick_examples, selected_indices):

    selected_columns = []

    for index in selected_indices:

        if not isinstance(index, int) or index < 0 or index >= len(quick_examples):
            raise ValueError("Invalid quick example selection.")

        columns = quick_examples[index]["columns"]

        for column in columns:

            if column not in selected_columns:
                selected_columns.append(column)

    if not selected_columns:
        raise ValueError("Please select at least one quick example.")

    return selected_columns

# ============================================================
# Analysis Context
# ============================================================
# Get context for AI analysis recommendation
def get_analysis_context(
    file_path,
    selected_columns
):

    if file_path.endswith(".csv"):

        dataframe = pd.read_csv(
            file_path
        )

    elif file_path.endswith(
        (".xlsx", ".xls")
    ):

        dataframe = pd.read_excel(
            file_path
        )

    else:

        raise ValueError(
            "Unsupported file format"
        )

      # توحيد Missing Values في نسخة من البيانات
    dataframe = normalize_missing_values(dataframe)

    selected_data = dataframe[
        selected_columns
    ].copy()

    # Detect columns that represent dates
    datetime_columns = detect_datetime_columns(
        selected_data
    )

    column_types = {}

    for position, column in enumerate(selected_columns):

        series = selected_data[column]

        # التحقق من نوع العمود
        if pd.api.types.is_numeric_dtype(series):

            column_types[column] = "numeric"

        # التحقق من أعمدة التاريخ باستخدام الاسم والموقع
        elif f"{column} (column {position + 1})" in datetime_columns:

            column_types[column] = "date"

        else:

            column_types[column] = "categorical"

    context = {
        "selected_columns": selected_columns,
        "column_types": column_types,
        "data_types": (
            selected_data
            .dtypes
            .astype(str)
            .to_dict()
        ),
        "sample_data": (
            selected_data
            .head(20)
            .to_dict(orient="records")
        )
    }

    return context


# ============================================================
# AI Analysis Recommendation
# ============================================================

# Build prompt for AI analysis recommendation
def build_analysis_recommendation_prompt(
    context
):

    prompt = f"""
You are the analysis recommendation assistant for DataNarrator.

Your task is to recommend the most suitable analysis types
based on the selected columns and their analytical types.

Selected columns:
{context["selected_columns"]}

Analytical column types:
{context["column_types"]}

Original data types:
{context["data_types"]}

First 20 rows:
{context["sample_data"]}

DataNarrator supports only these five analysis types:

1. Descriptive:
   - Suitable for numerical or categorical columns.
   - Used to summarize and understand the selected data.

2. Comparative:
   - Suitable when categorical or date columns can be compared
     with numerical columns.
   - Used to compare numerical values across groups or dates.

3. Relationship:
   - Suitable when two or more numerical columns are selected.
   - Used to examine relationships between numerical variables.

4. Distribution:
   - Suitable for numerical columns.
   - Used to understand how numerical values are distributed.

5. Outlier:
   - Suitable for numerical columns.
   - Used to identify unusual or extreme numerical values.

Instructions:

- Recommend only the five supported analysis types.
- Do not invent new analysis types.
- Do not recommend columns.
- The columns have already been selected by the user.
- Recommend one primary analysis type.
- Include other suitable analysis types as alternatives when applicable.
- Base the recommendation only on the selected columns,
  their analytical types, and the provided sample data.
- Return JSON only.

Return exactly this structure:

{{
    "primary_analysis_type": "...",
    "alternative_analysis_types": [
        "..."
    ],
    "reason": "..."
}}
"""

    return prompt


# Send analysis recommendation request to Gemini
def get_ai_analysis_recommendation(
    prompt
):

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        if not response or not response.text:

            return (
                None,
                "Gemini returned an empty response"
            )

        return response.text, None

    except Exception as error:

        error_message = str(error)

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED"
            in error_message
        ):

            return (
                None,
                "Gemini quota has been exceeded. "
                "Please try again after the quota resets."
            )

        if (
            "503" in error_message
            or "UNAVAILABLE"
            in error_message
        ):

            return (
                None,
                "Gemini service is temporarily unavailable. "
                "Please try again later."
            )

        return (
            None,
            f"Gemini request failed: {error_message}"
        )


# Parse Gemini analysis recommendation response
def parse_ai_analysis_recommendation(
    response_text
):

    if not response_text:

        return (
            None,
            "Gemini returned an empty response"
        )

    cleaned_text = response_text.strip()

    if cleaned_text.startswith(
        "```json"
    ):

        cleaned_text = cleaned_text[7:]

    elif cleaned_text.startswith(
        "```"
    ):

        cleaned_text = cleaned_text[3:]

    if cleaned_text.endswith("```"):

        cleaned_text = cleaned_text[:-3]

    cleaned_text = cleaned_text.strip()

    try:

        recommendation = json.loads(
            cleaned_text
        )

        return recommendation, None

    except json.JSONDecodeError:

        return (
            None,
            "Gemini returned an invalid JSON response"
        )


# Normalize analysis type returned by Gemini
def normalize_analysis_type(
    analysis_type
):

    if not isinstance(
        analysis_type,
        str
    ):

        return analysis_type

    return (
        analysis_type
        .strip()
        .lower()
    )


# Validate AI analysis recommendation
def validate_ai_analysis_recommendation(
    recommendation
):

    if not isinstance(
        recommendation,
        dict
    ):

        return (
            False,
            "AI recommendation must be a JSON object"
        )

    required_fields = [
        "primary_analysis_type",
        "alternative_analysis_types",
        "reason"
    ]

    for field in required_fields:

        if field not in recommendation:

            return (
                False,
                f"Missing required field: {field}"
            )

    primary_analysis_type = (
        normalize_analysis_type(
            recommendation[
                "primary_analysis_type"
            ]
        )
    )

    alternative_analysis_types = (
        recommendation[
            "alternative_analysis_types"
        ]
    )

    reason = recommendation[
        "reason"
    ]

    # Validate list before iterating
    if not isinstance(
        alternative_analysis_types,
        list
    ):

        return (
            False,
            "alternative_analysis_types "
            "must be a list"
        )

    alternative_analysis_types = [
        normalize_analysis_type(
            analysis_type
        )
        for analysis_type
        in alternative_analysis_types
    ]

    recommendation[
        "primary_analysis_type"
    ] = primary_analysis_type

    recommendation[
        "alternative_analysis_types"
    ] = alternative_analysis_types

    # Validate primary type
    if (
        primary_analysis_type
        not in SUPPORTED_ANALYSIS_TYPES
    ):

        return (
            False,
            "Invalid primary analysis type: "
            f"{primary_analysis_type}"
        )

    # Validate alternatives
    for analysis_type in (
        alternative_analysis_types
    ):

        if (
            analysis_type
            not in SUPPORTED_ANALYSIS_TYPES
        ):

            return (
                False,
                "Invalid alternative analysis type: "
                f"{analysis_type}"
            )

    # Primary should not be an alternative
    if (
        primary_analysis_type
        in alternative_analysis_types
    ):

        return (
            False,
            "Primary analysis type cannot "
            "also be an alternative"
        )

    # Validate reason
    if (
        not isinstance(reason, str)
        or not reason.strip()
    ):

        return (
            False,
            "Reason must be a non-empty string"
        )

    return True, None


# Validate logical compatibility
# of the AI analysis recommendation
def validate_ai_analysis_semantics(
    recommendation,
    column_types
):

    primary_analysis_type = (
        recommendation[
            "primary_analysis_type"
        ]
    )

    alternative_analysis_types = (
        recommendation[
            "alternative_analysis_types"
        ]
    )

    selected_types = list(
        column_types.values()
    )

    numeric_count = (
        selected_types.count("numeric")
    )

    categorical_count = (
        selected_types.count("categorical")
    )

    date_count = (
        selected_types.count("date")
    )

    def is_analysis_type_suitable(
        analysis_type
    ):

        if analysis_type == "descriptive":

            return (
                numeric_count > 0
                or categorical_count > 0
            )

        if analysis_type == "comparative":

            return (
                (
                    categorical_count > 0
                    and numeric_count > 0
                )
                or
                (
                    date_count > 0
                    and numeric_count > 0
                )
            )

        if analysis_type == "relationship":

            return numeric_count >= 2

        if analysis_type == "distribution":

            return numeric_count > 0

        if analysis_type == "outlier":

            return numeric_count > 0

        return False

    # Validate primary analysis
    if not is_analysis_type_suitable(
        primary_analysis_type
    ):

        return (
            False,
            f"Primary analysis type "
            f"'{primary_analysis_type}' "
            "is not suitable for the "
            "selected columns"
        )

    # Validate alternatives
    for analysis_type in (
        alternative_analysis_types
    ):

        if not is_analysis_type_suitable(
            analysis_type
        ):

            return (
                False,
                f"Alternative analysis type "
                f"'{analysis_type}' "
                "is not suitable for the "
                "selected columns"
            )

    return True, None


# Validate complete AI analysis recommendation
def validate_complete_ai_analysis(
    recommendation,
    column_types
):

    is_valid, error = (
        validate_ai_analysis_recommendation(
            recommendation
        )
    )

    if not is_valid:

        return False, error

    is_valid, error = (
        validate_ai_analysis_semantics(
            recommendation,
            column_types
        )
    )

    if not is_valid:

        return False, error

    return True, None


# Generate and validate AI analysis recommendation
def generate_ai_analysis_recommendation(
    prompt,
    column_types
):

    # Step 1: Send prompt
    response_text, error = (
        get_ai_analysis_recommendation(
            prompt
        )
    )

    if error:

        return None, error

    # Step 2: Parse response
    recommendation, error = (
        parse_ai_analysis_recommendation(
            response_text
        )
    )

    if error:

        return None, error

    # Step 3: Validate response
    is_valid, error = (
        validate_complete_ai_analysis(
            recommendation,
            column_types
        )
    )

    if not is_valid:

        return None, error

    return recommendation, None


# ============================================================
# AI Visualization Recommendation
# ============================================================


# Build prompt for AI visualization recommendation
def build_visualization_recommendation_prompt(
    context,
    analysis_type
):

    prompt = f"""
You are the visualization recommendation assistant for DataNarrator.

Your task is to recommend THREE meaningful and distinct charts
for the selected data and analysis type.

Analysis type:
{analysis_type}

Selected columns:
{context["selected_columns"]}

Analytical column types:
{context["column_types"]}

Original data types:
{context["data_types"]}

First 20 rows:
{context["sample_data"]}

DataNarrator supports ONLY these visualizations:

1. line_chart
2. area_chart
3. step_line_chart
4. vertical_bar_chart
5. horizontal_bar_chart
6. lollipop_chart
7. pie_chart
8. donut_chart
9. frequency_bar_chart
10. stacked_proportional_bar
11. frequency_histogram
12. box_plot
13. density_area_curve
14. scatter_plot_with_trendline
15. bubble_chart

Analysis-specific visualization restrictions:

For descriptive analysis:
- Suitable: frequency_bar_chart, pie_chart, donut_chart,
  frequency_histogram, box_plot, density_area_curve,
  vertical_bar_chart, horizontal_bar_chart, lollipop_chart.

For comparative analysis:
- Suitable: vertical_bar_chart, horizontal_bar_chart,
  lollipop_chart, stacked_proportional_bar, box_plot,
  line_chart, area_chart, step_line_chart.
- pie_chart and donut_chart are NOT suitable.
- frequency_histogram and density_area_curve are NOT suitable.
- scatter_plot_with_trendline and bubble_chart are NOT suitable.

For relationship analysis:
- Suitable: scatter_plot_with_trendline, bubble_chart.
- Require at least two numerical columns for scatter_plot_with_trendline.
- Require at least three numerical columns for bubble_chart.

For distribution analysis:
- Suitable: frequency_histogram, box_plot, density_area_curve.

For outlier analysis:
- Suitable: box_plot, frequency_histogram.

Visualization guidelines:

- line_chart:
  Best for numerical values across dates or ordered time.

- area_chart:
  Best for showing numerical changes over time.

- step_line_chart:
  Best for ordered time where values change at distinct steps.

- vertical_bar_chart:
  Best for comparing numerical values across categorical groups.

- horizontal_bar_chart:
  Best for categorical comparisons, especially long category names.

- lollipop_chart:
  Best for simple comparisons across categorical groups.

- pie_chart:
  Best for proportions of a categorical variable with limited categories.

- donut_chart:
  Similar to pie_chart for categorical proportions.

- frequency_bar_chart:
  Best for showing frequency or count of categorical values.

- stacked_proportional_bar:
  Best for comparing proportions across categorical groups.

- frequency_histogram:
  Best for showing the distribution of a numerical variable.

- box_plot:
  Best for distribution, spread, median, and possible outliers.

- density_area_curve:
  Best for showing the shape of a numerical distribution.

- scatter_plot_with_trendline:
  Best for examining the relationship between two numerical variables.

- bubble_chart:
  Best for showing a relationship between numerical variables
  while representing an additional numerical measure.

Rules:

- Recommend exactly THREE main charts.
- Each chart must represent a meaningful analytical perspective.
- Each chart must have between ONE and THREE visualization options.
- All options within a chart must be different.
- Every option must be suitable for the chart's purpose and selected data.
- Use only supported visualization types.
- Never recommend an unsuitable visualization just to fill the options.
- All charts and their options must be compatible with the selected analysis type.
- Consider the selected columns, column types, and sample data.
- Do not recommend a different analysis type.
- The analysis type has already been selected.
- If only one or two suitable visualization options exist,
  return only those suitable options.
- Do not repeat visualization types to reach three options.
- If the data does not support three distinct analytical perspectives,
  do not invent charts or insights.
- Keep each chart purpose distinct and relevant to the selected analysis.
- Return valid JSON only, without Markdown code fences.

Return exactly this structure:

{{
    "charts": [
        {{
            "chart_id": 1,
            "purpose": "...",
            "visualization_options": [
                "visualization_type_1",
                "visualization_type_2"
            ],
            "reason": "..."
        }},
        {{
            "chart_id": 2,
            "purpose": "...",
            "visualization_options": [
                "visualization_type_1"
            ],
            "reason": "..."
        }},
        {{
            "chart_id": 3,
            "purpose": "...",
            "visualization_options": [
                "visualization_type_1",
                "visualization_type_2",
                "visualization_type_3"
            ],
            "reason": "..."
        }}
    ]
}}
"""

    return prompt


# Normalize visualization type returned by Gemini
def normalize_visualization_type(
    visualization_type
):

    if not isinstance(
        visualization_type,
        str
    ):

        return visualization_type

    return (
        visualization_type
        .strip()
        .lower()
    )


# Get visualization recommendation from Gemini
def get_ai_visualization_recommendation(
    prompt
):

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        if not response or not response.text:

            return (
                None,
                "Gemini returned an empty response"
            )

        return response.text, None

    except Exception as error:

        error_message = str(error)

        # Gemini quota exceeded
        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED"
            in error_message
        ):

            return (
                None,
                "Gemini quota has been exceeded. "
                "Please try again after the quota resets."
            )

        # Gemini temporarily unavailable
        if (
            "503" in error_message
            or "UNAVAILABLE"
            in error_message
        ):

            return (
                None,
                "Gemini service is temporarily unavailable. "
                "Please try again later."
            )

        return (
            None,
            f"Gemini request failed: {error_message}"
        )


# الحصول على شرح النتائج من Gemini
def get_ai_explanation(prompt):

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        if not response or not response.text:

            return (
                "AI explanation is temporarily unavailable.",
                "Gemini returned an empty response"
            )

        return response.text, None

    except Exception as error:

        error_message = str(error)

        # تجاوز الحد المسموح لطلبات Gemini
        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
        ):

            return (
                "AI explanation is temporarily unavailable "
                "because the AI request limit has been reached.",
                error_message
            )

        # خدمة Gemini غير متاحة مؤقتًا
        if (
            "503" in error_message
            or "UNAVAILABLE" in error_message
        ):

            return (
                "AI explanation is temporarily unavailable. "
                "Please try again later.",
                error_message
            )

        return (
            "AI explanation could not be generated.",
            error_message
        )

# Build prompt for AI explanation
def build_ai_explanation_prompt(
    analysis_type,
    selected_columns,
    analysis_result,
    charts_results
):

    prompt = f"""
You are the AI explanation assistant for DataNarrator.

Your task is to explain the results of a data analysis
to students, beginners, and non-specialist users.

Analysis type:
{analysis_type}

Selected columns:
{selected_columns}

Analysis results:
{analysis_result}

Executed visualizations:
{charts_results}

Instructions:

- Explain the analysis results in clear and simple language.
- Identify important patterns and trends supported by the results.
- Explain meaningful numerical findings when available.
- Explain the purpose and meaning of each executed chart.
- Describe what users can learn from the visualizations.
- Connect the explanation to the selected analysis type.
- Use only the information provided.
- Never invent values, patterns, or conclusions.
- If the available results are insufficient for a conclusion,
  clearly mention this limitation.
- Do not repeat the raw data unnecessarily.
- Avoid complicated statistical terminology.
- Organize the explanation using clear headings.
- Return the explanation in a readable format.

Return the explanation as plain text.
Do not return JSON or Markdown code fences.
"""

    return prompt



# Parse Gemini visualization recommendation
def parse_ai_visualization_recommendation(
    response_text
):

    if not response_text:

        return (
            None,
            "Gemini returned an empty response"
        )

    cleaned_text = response_text.strip()

    if cleaned_text.startswith(
        "```json"
    ):

        cleaned_text = cleaned_text[7:]

    elif cleaned_text.startswith(
        "```"
    ):

        cleaned_text = cleaned_text[3:]

    if cleaned_text.endswith("```"):

        cleaned_text = cleaned_text[:-3]

    cleaned_text = cleaned_text.strip()

    try:

        recommendation = json.loads(
            cleaned_text
        )

        return recommendation, None

    except json.JSONDecodeError:

        return (
            None,
            "Gemini returned an invalid JSON response"
        )

# Validate AI visualization recommendation
def validate_ai_visualization_recommendation(
    recommendation
):

    # التحقق من أن التوصية عبارة عن Dictionary
    if not isinstance(recommendation, dict):

        return False, (
            "AI recommendation must be a JSON object"
        )

    # التحقق من وجود charts
    if "charts" not in recommendation:

        return False, (
            "Missing required field: charts"
        )

    charts = recommendation["charts"]

    # التحقق من أن charts عبارة عن List
    if not isinstance(charts, list):

        return False, (
            "charts must be a list"
        )

    # يجب أن تحتوي التوصية على ثلاثة رسوم
    if len(charts) != 3:

        return False, (
            "AI must recommend exactly 3 charts"
        )

    # التحقق من كل رسم
    for index, chart in enumerate(charts):

        if not isinstance(chart, dict):

            return False, (
                f"Chart {index + 1} must be an object"
            )

        required_fields = [
            "chart_id",
            "purpose",
            "visualization_options",
            "reason"
        ]

        for field in required_fields:

            if field not in chart:

                return False, (
                    f"Chart {index + 1} is missing "
                    f"required field: {field}"
                )

        # التحقق من رقم الرسم
        if chart["chart_id"] != index + 1:

            return False, (
                f"Chart {index + 1} has an invalid chart_id"
            )

        # التحقق من purpose
        if (
            not isinstance(chart["purpose"], str)
            or not chart["purpose"].strip()
        ):

            return False, (
                f"Chart {index + 1} has an invalid purpose"
            )

        # التحقق من reason
        if (
            not isinstance(chart["reason"], str)
            or not chart["reason"].strip()
        ):

            return False, (
                f"Chart {index + 1} has an invalid reason"
            )

        visualization_options = (
            chart["visualization_options"]
        )

        # يجب أن تكون خيارات الرسم List
        if not isinstance(visualization_options, list):

            return False, (
                f"Chart {index + 1}: "
                "visualization_options must be a list"
            )

        # يجب أن يحتوي كل رسم على خيار واحد إلى ثلاثة
        if not 1 <= len(visualization_options) <= 3:

            return False, (
                f"Chart {index + 1} must have "
                "1 to 3 visualization options"
            )

        normalized_options = []

        # التحقق من كل نوع Visualization
        for visualization in visualization_options:

            normalized_type = normalize_visualization_type(
                visualization
            )

            if not normalized_type:

                return False, (
                    f"Unsupported visualization type: "
                    f"{visualization}"
                )

            # منع تكرار نفس النوع
            if normalized_type in normalized_options:

                return False, (
                    f"Duplicate visualization option: "
                    f"{normalized_type}"
                )

            normalized_options.append(normalized_type)

        # حفظ الخيارات بعد توحيد أسمائها
        chart["visualization_options"] = (
            normalized_options
        )

    return True, None

# الحصول على توصية الـVisualization من Gemini
def get_ai_visualization_recommendation(
    prompt
):

    try:

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        # التحقق من وجود رد من Gemini
        if not response or not response.text:

            return (
                None,
                "Gemini returned an empty response"
            )

        # تحويل رد Gemini من JSON نصي إلى Dictionary
        try:

            recommendation = json.loads(
                response.text
            )

        except json.JSONDecodeError:

            return (
                None,
                "Gemini returned an invalid JSON response"
            )

        # التحقق من صحة توصية الرسوم البيانية
        is_valid, validation_error = (
            validate_ai_visualization_recommendation(
                recommendation
            )
        )

        # إرجاع الخطأ إذا كانت التوصية غير صحيحة
        if not is_valid:

            return (
                None,
                validation_error
            )

        # إرجاع التوصية بعد التحقق منها
        return recommendation, None

    except Exception as error:

        error_message = str(error)
        print("Gemini Visualization Error:", repr(error))

        # التعامل مع تجاوز Gemini للحد المسموح
        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
        ):

            return (
                None,
                "Gemini quota has been exceeded. "
                "Please try again after the quota resets."
            )

        # التعامل مع عدم توفر Gemini مؤقتًا
        if (
            "503" in error_message
            or "UNAVAILABLE" in error_message
        ):

            return (
                None,
                "Gemini service is temporarily unavailable. "
                "Please try again later."
            )

        # التعامل مع الأخطاء الأخرى
        return (
            None,
            f"Gemini request failed: {error_message}"
        )

# Validate logical compatibility of AI visualization recommendation
def validate_ai_visualization_semantics(
    recommendation,
    column_types,
    analysis_type
):

    selected_types = list(column_types.values())

    numeric_count = selected_types.count("numeric")
    categorical_count = selected_types.count("categorical")
    date_count = selected_types.count("date")

    def is_visualization_suitable(visualization):

        # Descriptive analysis
        if analysis_type == "descriptive":

            if visualization in [
                "frequency_bar_chart",
                "pie_chart",
                "donut_chart"
            ]:
                return categorical_count > 0

            if visualization in [
                "frequency_histogram",
                "box_plot",
                "density_area_curve"
            ]:
                return numeric_count > 0

            if visualization in [
                "vertical_bar_chart",
                "horizontal_bar_chart",
                "lollipop_chart"
            ]:
                return (
                    categorical_count > 0
                    and numeric_count > 0
                )

            return False

        # Comparative analysis
        if analysis_type == "comparative":

            if visualization in [
                "vertical_bar_chart",
                "horizontal_bar_chart",
                "lollipop_chart",
                "stacked_proportional_bar",
                "box_plot"
            ]:
                return (
                    categorical_count > 0
                    and numeric_count > 0
                )

            if visualization in [
                "line_chart",
                "area_chart",
                "step_line_chart"
            ]:
                return (
                    date_count > 0
                    and numeric_count > 0
                )

            return False

        # Relationship analysis
        if analysis_type == "relationship":

            if numeric_count < 2:
                return False

            if visualization == "scatter_plot_with_trendline":
                return True

            if visualization == "bubble_chart":
                return numeric_count >= 3

            return False

        # Distribution analysis
        if analysis_type == "distribution":

            return (
                numeric_count > 0
                and visualization in [
                    "frequency_histogram",
                    "box_plot",
                    "density_area_curve"
                ]
            )

        # Outlier analysis
        if analysis_type == "outlier":

            return (
                numeric_count > 0
                and visualization in [
                    "box_plot",
                    "frequency_histogram"
                ]
            )

        return False

    # التحقق من صلاحية جميع خيارات الرسوم الثلاثة
    for chart in recommendation["charts"]:

        for visualization in chart["visualization_options"]:

            if not is_visualization_suitable(visualization):

                return False, (
                    f"Visualization '{visualization}' "
                    f"is not suitable for "
                    f"'{analysis_type}' analysis."
                )

    return True, None


# Validate complete AI visualization recommendation
def validate_complete_ai_visualization(
    recommendation,
    column_types,
    analysis_type
):

    # التحقق من بنية التوصية
    is_valid, error = (
        validate_ai_visualization_recommendation(
            recommendation
        )
    )

    if not is_valid:
        return False, error

    # التحقق من ملاءمة الرسوم للتحليل
    is_valid, error = (
        validate_ai_visualization_semantics(
            recommendation,
            column_types,
            analysis_type
        )
    )

    if not is_valid:
        return False, error

    return True, None

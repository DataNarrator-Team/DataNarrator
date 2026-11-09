import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import io

from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

# All visualization types supported by DataNarrator
SUPPORTED_VISUALIZATIONS = [
    "line_chart",
    "area_chart",
    "step_line_chart",
    "vertical_bar_chart",
    "horizontal_bar_chart",
    "lollipop_chart",
    "pie_chart",
    "donut_chart",
    "frequency_bar_chart",
    "stacked_proportional_bar",
    "frequency_histogram",
    "box_plot",
    "density_area_curve",
    "scatter_plot_with_trendline",
    "bubble_chart"
]


# Validate the visualization selected by the AI
def validate_visualization_type(visualization_type):

    if visualization_type not in SUPPORTED_VISUALIZATIONS:

        return {
            "is_valid": False,
            "error": (
                f"Unsupported visualization type: "
                f"{visualization_type}"
            )
        }

    return {
        "is_valid": True,
        "error": None
    }


# Validate that the visualization is suitable
# for the selected analysis type and columns
def validate_visualization_for_analysis(
    dataframe,
    selected_columns,
    analysis_type,
    visualization_type
):

    # تحديد الأعمدة الرقمية
    numerical_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
    ]

    # تحديد أعمدة التاريخ حتى لو كانت مخزنة كنصوص
    datetime_columns = []

    for column in selected_columns:

        if column in numerical_columns:
            continue

        column_data = dataframe[column]

        # التحقق من نوع البيانات الأصلي
        if pd.api.types.is_datetime64_any_dtype(
            column_data
        ):
            datetime_columns.append(column)

        else:
            # محاولة تحويل القيم النصية إلى تواريخ
            parsed_dates = pd.to_datetime(
                column_data,
                errors="coerce"
            )

            # اعتبار العمود تاريخًا إذا كانت 80% من قيمه تواريخ صحيحة
            valid_date_ratio = (
                parsed_dates.notna().sum()
                / max(len(column_data), 1)
            )

            if valid_date_ratio >= 0.8:

                datetime_columns.append(column)

    # تحديد الأعمدة التصنيفية
    categorical_columns = [
        column
        for column in selected_columns
        if column not in numerical_columns
        and column not in datetime_columns
    ]

    numeric_count = len(numerical_columns)
    categorical_count = len(categorical_columns)
    datetime_count = len(datetime_columns)

    is_valid = False

    # Descriptive analysis
    if analysis_type == "descriptive":

        if visualization_type in [
            "frequency_bar_chart",
            "pie_chart",
            "donut_chart"
        ]:
            is_valid = categorical_count > 0

        elif visualization_type in [
            "frequency_histogram",
            "box_plot",
            "density_area_curve"
        ]:
            is_valid = numeric_count > 0

        elif visualization_type in [
            "vertical_bar_chart",
            "horizontal_bar_chart",
            "lollipop_chart"
        ]:
            is_valid = (
                categorical_count > 0
                and numeric_count > 0
            )

    # Comparative analysis
    elif analysis_type == "comparative":

        if numeric_count > 0:

            # المقارنة باستخدام أعمدة التاريخ
            if datetime_count > 0:

                is_valid = visualization_type in [
                    "line_chart",
                    "area_chart",
                    "step_line_chart",
                    "vertical_bar_chart",
                    "horizontal_bar_chart",
                    "lollipop_chart",
                    "box_plot"
                ]

            # المقارنة باستخدام الأعمدة التصنيفية
            elif categorical_count > 0:

                is_valid = visualization_type in [
                    "vertical_bar_chart",
                    "horizontal_bar_chart",
                    "lollipop_chart",
                    "stacked_proportional_bar",
                    "box_plot"
                ]

    # Relationship analysis
    elif analysis_type == "relationship":

        if numeric_count >= 2:

            if visualization_type == (
                "scatter_plot_with_trendline"
            ):
                is_valid = True

            elif visualization_type == "bubble_chart":
                is_valid = numeric_count >= 3

    # Distribution analysis
    elif analysis_type == "distribution":

        if numeric_count > 0:

            is_valid = visualization_type in [
                "frequency_histogram",
                "box_plot",
                "density_area_curve"
            ]

    # Outlier analysis
    elif analysis_type == "outlier":

        if numeric_count > 0:

            is_valid = visualization_type in [
                "box_plot",
                "frequency_histogram"
            ]

    # إرجاع الخطأ إذا كان الرسم غير مناسب
    if not is_valid:

        return {
            "is_valid": False,
            "error": (
                f"Visualization '{visualization_type}' "
                f"is not suitable for "
                f"'{analysis_type}' analysis."
            )
        }

    # إرجاع نجاح التحقق
    return {
        "is_valid": True,
        "error": None
    }


# Execute frequency histogram
def execute_frequency_histogram(
    dataframe,
    selected_columns
):

    numerical_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
    ]

    if not numerical_columns:

        return None, (
            "Frequency histogram requires "
            "at least one numerical column."
        )

    histograms = []

    for column in numerical_columns:

        values = (
            dataframe[column]
            .dropna()
            .astype(float)
            .to_numpy()
        )

        if len(values) == 0:
            continue

        number_of_bins = min(
            10,
            len(np.unique(values))
        )

        if number_of_bins < 1:
            continue

        frequencies, bin_edges = np.histogram(
            values,
            bins=number_of_bins
        )

        bins = []

        for index in range(len(frequencies)):

            bins.append({
                "start": float(
                    bin_edges[index]
                ),
                "end": float(
                    bin_edges[index + 1]
                ),
                "count": int(
                    frequencies[index]
                )
            })

        histograms.append({
            "column": column,
            "bins": bins
        })

    if not histograms:

        return None, (
            "No valid numerical data was found."
        )

    return {
        "visualization_type": "frequency_histogram",
        "histograms": histograms
    }, None


# Execute box plot
def execute_box_plot(
    dataframe,
    selected_columns
):

    # تحديد الأعمدة الرقمية
    numerical_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
    ]

    # تحديد الأعمدة التصنيفية مع استبعاد أعمدة التاريخ
    categorical_columns = [
        column
        for column in selected_columns
        if not pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
        and not pd.api.types.is_datetime64_any_dtype(
            dataframe[column]
        )
        and not pd.api.types.is_datetime64_dtype(
            pd.to_datetime(
                dataframe[column],
                errors="coerce"
            )
        )
    ]

    if not numerical_columns:

        return None, (
            "Box plot requires at least one "
            "numerical column."
        )

    boxes = []

    # تحديد الفئات إذا كان هناك عمود تصنيفي
    if categorical_columns:

        grouping_column = categorical_columns[0]

        for category in dataframe[grouping_column].dropna().unique():

            category_data = dataframe[
                dataframe[grouping_column] == category
            ]

            for column in numerical_columns:

                values = (
                    category_data[column]
                    .dropna()
                    .astype(float)
                )

                if values.empty:
                    continue

                q1 = values.quantile(0.25)
                median = values.quantile(0.50)
                q3 = values.quantile(0.75)

                iqr = q3 - q1

                lower_bound = q1 - (1.5 * iqr)
                upper_bound = q3 + (1.5 * iqr)

                non_outlier_values = values[
                    (values >= lower_bound)
                    & (values <= upper_bound)
                ]

                outliers = values[
                    (values < lower_bound)
                    | (values > upper_bound)
                ]

                boxes.append({
                    "category": str(category),
                    "column": column,
                    "minimum": float(
                        non_outlier_values.min()
                    ),
                    "q1": float(q1),
                    "median": float(median),
                    "q3": float(q3),
                    "maximum": float(
                        non_outlier_values.max()
                    ),
                    "outliers": [
                        float(value)
                        for value in outliers
                    ]
                })

    else:

        # إنشاء Box Plot واحد لكل عمود رقمي
        for column in numerical_columns:

            values = (
                dataframe[column]
                .dropna()
                .astype(float)
            )

            if values.empty:
                continue

            q1 = values.quantile(0.25)
            median = values.quantile(0.50)
            q3 = values.quantile(0.75)

            iqr = q3 - q1

            lower_bound = q1 - (1.5 * iqr)
            upper_bound = q3 + (1.5 * iqr)

            non_outlier_values = values[
                (values >= lower_bound)
                & (values <= upper_bound)
            ]

            outliers = values[
                (values < lower_bound)
                | (values > upper_bound)
            ]

            boxes.append({
                "column": column,
                "minimum": float(
                    non_outlier_values.min()
                ),
                "q1": float(q1),
                "median": float(median),
                "q3": float(q3),
                "maximum": float(
                    non_outlier_values.max()
                ),
                "outliers": [
                    float(value)
                    for value in outliers
                ]
            })

    if not boxes:

        return None, (
            "No valid numerical data was found."
        )

    return {
        "visualization_type": "box_plot",
        "boxes": boxes
    }, None


# Execute frequency bar chart
def execute_frequency_bar_chart(
    dataframe,
    selected_columns
):

    categorical_columns = [
        column
        for column in selected_columns
        if not pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
        and not pd.api.types.is_datetime64_any_dtype(
            dataframe[column]
        )
    ]

    if not categorical_columns:

        return None, (
            "Frequency bar chart requires "
            "at least one categorical column."
        )

    charts = []

    for column in categorical_columns:

        value_counts = (
            dataframe[column]
            .dropna()
            .value_counts()
        )

        data = []

        for category, count in value_counts.items():

            data.append({
                "category": str(category),
                "count": int(count)
            })

        charts.append({
            "column": column,
            "data": data
        })

    return {
        "visualization_type": "frequency_bar_chart",
        "charts": charts
    }, None


# Execute pie chart
def execute_pie_chart(
    dataframe,
    selected_columns
):

    categorical_columns = [
        column
        for column in selected_columns
        if not pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
        and not pd.api.types.is_datetime64_any_dtype(
            dataframe[column]
        )
    ]

    if not categorical_columns:

        return None, (
            "Pie chart requires at least one "
            "categorical column."
        )

    charts = []

    for column in categorical_columns:

        value_counts = (
            dataframe[column]
            .dropna()
            .value_counts()
        )

        data = []

        for category, count in value_counts.items():

            data.append({
                "category": str(category),
                "count": int(count)
            })

        charts.append({
            "column": column,
            "data": data
        })

    return {
        "visualization_type": "pie_chart",
        "charts": charts
    }, None


# Execute donut chart
def execute_donut_chart(
    dataframe,
    selected_columns
):

    categorical_columns = [
        column
        for column in selected_columns
        if not pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
        and not pd.api.types.is_datetime64_any_dtype(
            dataframe[column]
        )
    ]

    if not categorical_columns:

        return None, (
            "Donut chart requires at least one "
            "categorical column."
        )

    charts = []

    for column in categorical_columns:

        value_counts = (
            dataframe[column]
            .dropna()
            .value_counts()
        )

        data = []

        for category, count in value_counts.items():

            data.append({
                "category": str(category),
                "count": int(count)
            })

        charts.append({
            "column": column,
            "data": data
        })

    return {
        "visualization_type": "donut_chart",
        "charts": charts
    }, None

# Prepare categorical and numerical data
def prepare_categorical_numerical_data(
    dataframe,
    selected_columns,
    aggregation_method="sum"
):

    numerical_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
    ]

    categorical_columns = [
        column
        for column in selected_columns
        if not pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
        and not pd.api.types.is_datetime64_any_dtype(
            dataframe[column]
        )
    ]

    if not categorical_columns:
        return None, None, (
            "At least one categorical column is required."
        )

    if not numerical_columns:
        return None, None, (
            "At least one numerical column is required."
        )

    grouping_column = categorical_columns[0]
    measure_column = numerical_columns[0]

    selected_data = dataframe[
        [grouping_column, measure_column]
    ].dropna()

    grouped_data = (
        selected_data
        .groupby(grouping_column)[measure_column]
        .agg(aggregation_method)
        .reset_index()
    )

    grouped_data.columns = [
        "category",
        "value"
    ]

    grouped_data["category"] = (
        grouped_data["category"].astype(str)
    )

    grouped_data["value"] = (
        grouped_data["value"].astype(float)
    )

    return (
        grouped_data,
        {
            "grouping_column": grouping_column,
            "measure_column": measure_column
        },
        None
    )


# Execute vertical bar chart
def execute_vertical_bar_chart(
    dataframe,
    selected_columns
):

    grouped_data, column_info, error = (
        prepare_categorical_numerical_data(
            dataframe,
            selected_columns,
            aggregation_method="mean"
        )
    )

    if error:
        return None, error

    return {
        "visualization_type": "vertical_bar_chart",
        "category_column": column_info["grouping_column"],
        "value_column": column_info["measure_column"],
        "data": grouped_data.to_dict(
            orient="records"
        )
    }, None


# Execute horizontal bar chart
def execute_horizontal_bar_chart(
    dataframe,
    selected_columns
):

    grouped_data, column_info, error = (
        prepare_categorical_numerical_data(
            dataframe,
            selected_columns,
            aggregation_method="mean"
        )
    )

    if error:
        return None, error

    return {
        "visualization_type": "horizontal_bar_chart",
        "category_column": column_info["grouping_column"],
        "value_column": column_info["measure_column"],
        "data": grouped_data.to_dict(
            orient="records"
        )
    }, None

# Execute lollipop chart
def execute_lollipop_chart(
    dataframe,
    selected_columns
):

    grouped_data, column_info, error = (
        prepare_categorical_numerical_data(
            dataframe,
            selected_columns
        )
    )

    if error:
        return None, error

    return {
        "visualization_type": "lollipop_chart",
        "category_column": column_info[
            "grouping_column"
        ],
        "value_column": column_info[
            "measure_column"
        ],
        "data": grouped_data.to_dict(
            orient="records"
        )
    }, None


# Execute proportional bar chart
def execute_stacked_proportional_bar(
    dataframe,
    selected_columns
):

    grouped_data, column_info, error = (
        prepare_categorical_numerical_data(
            dataframe,
            selected_columns
        )
    )

    if error:
        return None, error

    total = grouped_data["value"].sum()

    if total == 0:

        return None, (
            "Cannot calculate proportions "
            "when the total value is zero."
        )

    data = []

    for _, row in grouped_data.iterrows():

        percentage = (
            row["value"] / total
        ) * 100

        data.append({
            "category": str(
                row["category"]
            ),
            "percentage": float(
                percentage
            )
        })

    return {
        "visualization_type": (
            "stacked_proportional_bar"
        ),
        "category_column": column_info[
            "grouping_column"
        ],
        "value_column": column_info[
            "measure_column"
        ],
        "data": data
    }, None


# Execute line chart
def execute_line_chart(
    dataframe,
    selected_columns
):

    datetime_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_datetime64_any_dtype(
            dataframe[column]
        )
    ]

    numerical_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
    ]

    if not datetime_columns:

        return None, (
            "Line chart requires "
            "a datetime column."
        )

    if not numerical_columns:

        return None, (
            "Line chart requires "
            "a numerical column."
        )

    date_column = datetime_columns[0]
    measure_column = numerical_columns[0]

    selected_data = dataframe[
        [date_column, measure_column]
    ].dropna()

    grouped_data = (
        selected_data
        .groupby(date_column)[measure_column]
        .sum()
        .reset_index()
        .sort_values(date_column)
    )

    data = []

    for _, row in grouped_data.iterrows():

        data.append({
            "date": row[date_column].isoformat(),
            "value": float(
                row[measure_column]
            )
        })

    return {
        "visualization_type": "line_chart",
        "x_column": date_column,
        "y_column": measure_column,
        "data": data
    }, None


# Execute area chart
def execute_area_chart(
    dataframe,
    selected_columns
):

    result, error = execute_line_chart(
        dataframe,
        selected_columns
    )

    if error:
        return None, error

    result["visualization_type"] = "area_chart"

    return result, None


# Execute step line chart
def execute_step_line_chart(
    dataframe,
    selected_columns
):

    result, error = execute_line_chart(
        dataframe,
        selected_columns
    )

    if error:
        return None, error

    result["visualization_type"] = (
        "step_line_chart"
    )

    return result, None


# Execute scatter plot with trendline
def execute_scatter_plot_with_trendline(
    dataframe,
    selected_columns
):

    if len(selected_columns) != 2:

        return None, (
            "Scatter plot with trendline requires "
            "exactly two columns."
        )

    x_column = selected_columns[0]
    y_column = selected_columns[1]

    selected_data = dataframe[
        [x_column, y_column]
    ].dropna()

    if not pd.api.types.is_numeric_dtype(
        selected_data[x_column]
    ):

        return None, (
            f"Column '{x_column}' must be numerical."
        )

    if not pd.api.types.is_numeric_dtype(
        selected_data[y_column]
    ):

        return None, (
            f"Column '{y_column}' must be numerical."
        )

    if len(selected_data) < 2:

        return None, (
            "At least two valid rows are required "
            "to generate the scatter plot."
        )

    x_values = (
        selected_data[x_column]
        .astype(float)
    )

    y_values = (
        selected_data[y_column]
        .astype(float)
    )

    slope, intercept = np.polyfit(
        x_values,
        y_values,
        1
    )

    correlation = x_values.corr(
        y_values
    )

    chart_data = []

    for _, row in selected_data.iterrows():

        x_value = float(
            row[x_column]
        )

        y_value = float(
            row[y_column]
        )

        trendline_value = (
            slope * x_value
            + intercept
        )

        chart_data.append({
            "x": x_value,
            "y": y_value,
            "trendline_y": float(
                trendline_value
            )
        })

    return {
        "visualization_type": (
            "scatter_plot_with_trendline"
        ),
        "x_column": x_column,
        "y_column": y_column,
        "correlation": float(
            correlation
        ),
        "trendline": {
            "slope": float(slope),
            "intercept": float(intercept)
        },
        "data": chart_data
    }, None


# Execute density area curve
def execute_density_area_curve(
    dataframe,
    selected_columns
):

    numerical_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
    ]

    if not numerical_columns:

        return None, (
            "Density area curve requires "
            "at least one numerical column."
        )

    curves = []

    for column in numerical_columns:

        values = (
            dataframe[column]
            .dropna()
            .astype(float)
            .to_numpy()
        )

        if len(values) < 2:
            continue

        minimum = float(values.min())
        maximum = float(values.max())

        if minimum == maximum:

            curves.append({
                "column": column,
                "data": [
                    {
                        "x": minimum,
                        "density": 1.0
                    }
                ]
            })

            continue

        x_values = np.linspace(
            minimum,
            maximum,
            100
        )

        standard_deviation = np.std(values)

        if standard_deviation == 0:
            continue

        bandwidth = (
            1.06
            * standard_deviation
            * (len(values) ** (-1 / 5))
        )

        if bandwidth <= 0:
            continue

        density_values = []

        for x_value in x_values:

            kernel_values = np.exp(
                -0.5
                * (
                    (x_value - values)
                    / bandwidth
                ) ** 2
            )

            density = (
                kernel_values.sum()
                / (
                    len(values)
                    * bandwidth
                    * np.sqrt(2 * np.pi)
                )
            )

            density_values.append(
                float(density)
            )

        data = []

        for index in range(len(x_values)):

            data.append({
                "x": float(
                    x_values[index]
                ),
                "density": density_values[index]
            })

        curves.append({
            "column": column,
            "data": data
        })

    if not curves:

        return None, (
            "Could not calculate density "
            "for the selected data."
        )

    return {
        "visualization_type": (
            "density_area_curve"
        ),
        "curves": curves
    }, None


# Execute bubble chart
def execute_bubble_chart(
    dataframe,
    selected_columns
):

    numerical_columns = [
        column
        for column in selected_columns
        if pd.api.types.is_numeric_dtype(
            dataframe[column]
        )
    ]

    if len(numerical_columns) < 3:

        return None, (
            "Bubble chart requires at least "
            "three numerical columns."
        )

    x_column = numerical_columns[0]
    y_column = numerical_columns[1]
    size_column = numerical_columns[2]

    selected_data = dataframe[
        [
            x_column,
            y_column,
            size_column
        ]
    ].dropna()

    if selected_data.empty:

        return None, (
            "No valid numerical data was found."
        )

    data = []

    for _, row in selected_data.iterrows():

        data.append({
            "x": float(
                row[x_column]
            ),
            "y": float(
                row[y_column]
            ),
            "size": float(
                row[size_column]
            )
        })

    return {
        "visualization_type": "bubble_chart",
        "x_column": x_column,
        "y_column": y_column,
        "size_column": size_column,
        "data": data
    }, None


# Execute the visualization selected by the AI
def execute_visualization(
    dataframe,
    selected_columns,
    visualization_type
):

    # التحقق من نوع الرسم البياني
    validation_result = (
        validate_visualization_type(
            visualization_type
        )
    )

    if not validation_result["is_valid"]:

        return None, validation_result["error"]

    # استخدام نسخة من البيانات عند الحاجة لتحويل التاريخ
    visualization_dataframe = dataframe

    # أنواع الرسوم التي تحتاج إلى معالجة أعمدة التاريخ
    if visualization_type in [
        "line_chart",
        "area_chart",
        "step_line_chart"
    ]:

        visualization_dataframe = dataframe.copy()

        # البحث عن أعمدة التاريخ وتحويلها
        for column in selected_columns:

            # تجاهل الأعمدة الرقمية
            if pd.api.types.is_numeric_dtype(
                visualization_dataframe[column]
            ):
                continue

            # تجاهل الأعمدة التي هي بالفعل من نوع datetime
            if pd.api.types.is_datetime64_any_dtype(
                visualization_dataframe[column]
            ):
                continue

            # محاولة تحويل العمود النصي إلى تاريخ
            parsed_dates = pd.to_datetime(
                visualization_dataframe[column],
                errors="coerce"
            )

            # حساب نسبة القيم التي تم تحويلها بنجاح
            valid_date_ratio = (
                parsed_dates.notna().sum()
                / max(len(visualization_dataframe), 1)
            )

            # اعتماد العمود كتاريخ إذا كانت 80% من قيمه صالحة
            if valid_date_ratio >= 0.8:

                visualization_dataframe[column] = (
                    parsed_dates
                )

    # Frequency histogram
    if visualization_type == "frequency_histogram":

        return execute_frequency_histogram(
            dataframe,
            selected_columns
        )

    # Box plot
    if visualization_type == "box_plot":

        return execute_box_plot(
            dataframe,
            selected_columns
        )

    # Frequency bar chart
    if visualization_type == "frequency_bar_chart":

        return execute_frequency_bar_chart(
            dataframe,
            selected_columns
        )

    # Pie chart
    if visualization_type == "pie_chart":

        return execute_pie_chart(
            dataframe,
            selected_columns
        )

    # Donut chart
    if visualization_type == "donut_chart":

        return execute_donut_chart(
            dataframe,
            selected_columns
        )

    # Line chart
    if visualization_type == "line_chart":

        return execute_line_chart(
            visualization_dataframe,
            selected_columns
        )

    # Area chart
    if visualization_type == "area_chart":

        return execute_area_chart(
            visualization_dataframe,
            selected_columns
        )

    # Step line chart
    if visualization_type == "step_line_chart":

        return execute_step_line_chart(
            visualization_dataframe,
            selected_columns
        )

    # Vertical bar chart
    if visualization_type == "vertical_bar_chart":

        return execute_vertical_bar_chart(
            dataframe,
            selected_columns
        )

    # Horizontal bar chart
    if visualization_type == "horizontal_bar_chart":

        return execute_horizontal_bar_chart(
            dataframe,
            selected_columns
        )

    # Lollipop chart
    if visualization_type == "lollipop_chart":

        return execute_lollipop_chart(
            dataframe,
            selected_columns
        )

    # Stacked proportional bar
    if visualization_type == "stacked_proportional_bar":

        return execute_stacked_proportional_bar(
            dataframe,
            selected_columns
        )

    # Scatter plot with trendline
    if visualization_type == "scatter_plot_with_trendline":

        return execute_scatter_plot_with_trendline(
            dataframe,
            selected_columns
        )

    # Density area curve
    if visualization_type == "density_area_curve":

        return execute_density_area_curve(
            dataframe,
            selected_columns
        )

    # Bubble chart
    if visualization_type == "bubble_chart":

        return execute_bubble_chart(
            dataframe,
            selected_columns
        )

    return None, (
        f"Visualization '{visualization_type}' "
        f"has not been implemented yet."
    )



# Generate PNG image from visualization data
def generate_visualization_png(visualization_result):

    if not isinstance(visualization_result, dict):
        raise ValueError("Invalid visualization data.")

    visualization_type = visualization_result.get(
        "visualization_type"
    )

    if visualization_type not in SUPPORTED_VISUALIZATIONS:
        raise ValueError("Unsupported visualization type.")

    fig, ax = plt.subplots(figsize=(10, 6))

    try:

        # Line, area, and step line charts
        if visualization_type in [
            "line_chart",
            "area_chart",
            "step_line_chart"
        ]:

            data = visualization_result["data"]

            x = [item["date"] for item in data]
            y = [item["value"] for item in data]

            if visualization_type == "line_chart":
                ax.plot(x, y, marker="o")

            elif visualization_type == "area_chart":
                ax.fill_between(x, y, alpha=0.4)
                ax.plot(x, y)

            else:
                ax.step(x, y, where="mid", marker="o")

            ax.set_xlabel(
                visualization_result["x_column"]
            )
            ax.set_ylabel(
                visualization_result["y_column"]
            )

        # Vertical bar chart
        elif visualization_type == "vertical_bar_chart":

            data = visualization_result["data"]

            categories = [
                item["category"] for item in data
            ]

            values = [
                item["value"] for item in data
            ]

            ax.bar(categories, values)
            ax.set_ylabel(
                visualization_result["value_column"]
            )

        # Horizontal bar chart
        elif visualization_type == "horizontal_bar_chart":

            data = visualization_result["data"]

            categories = [
                item["category"] for item in data
            ]

            values = [
                item["value"] for item in data
            ]

            ax.barh(categories, values)
            ax.set_xlabel(
                visualization_result["value_column"]
            )

        # Lollipop chart
        elif visualization_type == "lollipop_chart":

            data = visualization_result["data"]

            categories = [
                item["category"] for item in data
            ]

            values = [
                item["value"] for item in data
            ]

            positions = np.arange(len(categories))

            ax.vlines(
                positions,
                0,
                values
            )

            ax.scatter(
                positions,
                values
            )

            ax.set_xticks(positions)
            ax.set_xticklabels(
                categories,
                rotation=45,
                ha="right"
            )

        # Pie and donut charts
        elif visualization_type in [
            "pie_chart",
            "donut_chart"
        ]:

            chart = visualization_result["charts"][0]

            categories = [
                item["category"] for item in chart["data"]
            ]

            values = [
                item["count"] for item in chart["data"]
            ]

            if not values:
                raise ValueError("No chart data available.")

            if visualization_type == "pie_chart":
                ax.pie(
                    values,
                    labels=categories,
                    autopct="%1.1f%%"
                )

            else:
                ax.pie(
                    values,
                    labels=categories,
                    autopct="%1.1f%%",
                    wedgeprops={"width": 0.4}
                )

        # Frequency bar chart
        elif visualization_type == "frequency_bar_chart":

            chart = visualization_result["charts"][0]

            categories = [
                item["category"] for item in chart["data"]
            ]

            counts = [
                item["count"] for item in chart["data"]
            ]

            ax.bar(categories, counts)
            ax.set_ylabel("Frequency")

        # Stacked proportional bar
        elif visualization_type == "stacked_proportional_bar":

            data = visualization_result["data"]

            categories = [
                item["category"] for item in data
            ]

            percentages = [
                item["percentage"] for item in data
            ]

            left = 0

            for category, percentage in zip(
                categories,
                percentages
            ):

                ax.barh(
                    ["Total"],
                    [percentage],
                    left=left,
                    label=category
                )

                left += percentage

            ax.set_xlim(0, 100)
            ax.set_xlabel("Percentage")
            ax.legend()

        # Frequency histogram
        elif visualization_type == "frequency_histogram":

            histogram = visualization_result["histograms"][0]

            bins = histogram["bins"]

            centers = [
                (item["start"] + item["end"]) / 2
                for item in bins
            ]

            widths = [
                item["end"] - item["start"]
                for item in bins
            ]

            counts = [
                item["count"] for item in bins
            ]

            ax.bar(
                centers,
                counts,
                width=widths,
                align="center",
                edgecolor="black"
            )

            ax.set_xlabel(histogram["column"])
            ax.set_ylabel("Frequency")

        # Box plot
        elif visualization_type == "box_plot":

            boxes = visualization_result["boxes"]

            if not boxes:
                raise ValueError("No box plot data available.")

            box_data = []

            labels = []

            for item in boxes:

                box_data.append({
                    "label": item.get(
                        "category",
                        item["column"]
                    ),
                    "whislo": item["minimum"],
                    "q1": item["q1"],
                    "med": item["median"],
                    "q3": item["q3"],
                    "whishi": item["maximum"],
                    "fliers": item["outliers"]
                })

                labels.append(
                    item.get("category", item["column"])
                )

            ax.bxp(
                box_data,
                showfliers=True
            )

            ax.set_xticklabels(
                labels,
                rotation=45,
                ha="right"
            )

        # Density area curve
        elif visualization_type == "density_area_curve":

            for curve in visualization_result["curves"]:

                data = curve["data"]

                x = [
                    item["x"] for item in data
                ]

                density = [
                    item["density"] for item in data
                ]

                ax.plot(
                    x,
                    density,
                    label=curve["column"]
                )

                ax.fill_between(
                    x,
                    density,
                    alpha=0.3
                )

            ax.set_xlabel("Value")
            ax.set_ylabel("Density")
            ax.legend()

        # Scatter plot with trendline
        elif visualization_type == "scatter_plot_with_trendline":

            data = visualization_result["data"]

            x = [
                item["x"] for item in data
            ]

            y = [
                item["y"] for item in data
            ]

            trendline = [
                item["trendline_y"] for item in data
            ]

            sorted_indices = np.argsort(x)

            sorted_x = np.array(x)[sorted_indices]
            sorted_trendline = np.array(
                trendline
            )[sorted_indices]

            ax.scatter(x, y, label="Data")

            ax.plot(
                sorted_x,
                sorted_trendline,
                label="Trendline"
            )

            ax.set_xlabel(
                visualization_result["x_column"]
            )

            ax.set_ylabel(
                visualization_result["y_column"]
            )

            ax.legend()

        # Bubble chart
        elif visualization_type == "bubble_chart":

            data = visualization_result["data"]

            x = [
                item["x"] for item in data
            ]

            y = [
                item["y"] for item in data
            ]

            sizes = np.array([
                item["size"] for item in data
            ], dtype=float)

            # تحويل أحجام الفقاعات إلى قيم مناسبة للرسم
            sizes = np.abs(sizes)

            if len(sizes) > 0 and sizes.max() > 0:
                sizes = (
                    sizes / sizes.max()
                ) * 1000

            ax.scatter(
                x,
                y,
                s=sizes,
                alpha=0.5
            )

            ax.set_xlabel(
                visualization_result["x_column"]
            )

            ax.set_ylabel(
                visualization_result["y_column"]
            )

        # إعداد عنوان الرسم
        ax.set_title(
            visualization_type.replace("_", " ").title()
        )

        # تحسين ترتيب العناصر
        plt.xticks(rotation=45, ha="right")
        fig.tight_layout()

        # حفظ الصورة مؤقتًا في الذاكرة
        image_buffer = io.BytesIO()

        fig.savefig(
            image_buffer,
            format="png",
            dpi=150,
            bbox_inches="tight"
        )

        image_buffer.seek(0)

        return image_buffer

    finally:

        # إغلاق الرسم لتحرير الذاكرة
        plt.close(fig)

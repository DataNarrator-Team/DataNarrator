import pandas as pd

from services.dataset_service import detect_datetime_columns


# Recommend suitable analysis types for the selected columns
def recommend_analysis_types(dataframe, selected_columns):

    selected_data = dataframe[selected_columns]

    numerical_columns = selected_data.select_dtypes(
        include="number"
    ).columns.tolist()

    categorical_columns = selected_data.select_dtypes(
        include="object"
    ).columns.tolist()

    all_datetime_columns = detect_datetime_columns(
        selected_data
    )

    datetime_columns = [
        column
        for column in all_datetime_columns
        if column in selected_columns
    ]
# recommenation for 5 analysis types: 

    recommendations = []

    # Descriptive analysis
    # Suitable when at least one numerical ,categorical
    # or datetime column is slected

    if numerical_columns or categorical_columns or datetime_columns:
        recommendations.append("descriptive")

    # Comparative analysis
    # Requires a categorical/date column and at least one numerical column
    if (
        numerical_columns
        and (categorical_columns or datetime_columns)
    ):
        recommendations.append("comparative")

    # Relationship analysis
    # Requires at least two numerical columns
    if len(numerical_columns) >= 2:
        recommendations.append("relationship")

    # Distribution analysis
    # Requires at least one numerical column
    if numerical_columns:
        recommendations.append("distribution")

    # Outlier analysis
    # Requires at least one numerical column
    if numerical_columns:
        recommendations.append("outlier")

    return recommendations

# Execute descriptive analysis
def execute_descriptive_analysis(dataframe, selected_columns):

    selected_data = dataframe[selected_columns]

    numerical_columns = selected_data.select_dtypes(
        include="number"
    ).columns.tolist()

    categorical_columns = selected_data.select_dtypes(
        include="object"
    ).columns.tolist()

    result = {}

    # Numerical summary
    if numerical_columns:
        numerical_summary = {}

        for column in numerical_columns:
            numerical_summary[column] = {
                "count": int(selected_data[column].count()),
                "mean": float(selected_data[column].mean()),
                "median": float(selected_data[column].median()),
                "minimum": float(selected_data[column].min()),
                "maximum": float(selected_data[column].max())
            }

        result["numerical_summary"] = numerical_summary

    # Categorical summary
    if categorical_columns:
        categorical_summary = {}

        for column in categorical_columns:
            value_counts = (
                selected_data[column]
                .value_counts()
                .to_dict()
            )

            categorical_summary[column] = {
                str(key): int(value)
                for key, value in value_counts.items()
            }

        result["categorical_summary"] = categorical_summary

    return result

# Execute comparative analysis
def execute_comparative_analysis(dataframe, selected_columns):

    selected_data = dataframe[selected_columns]

    numerical_columns = selected_data.select_dtypes(
        include="number"
    ).columns.tolist()

    grouping_columns = [
        column
        for column in selected_columns
        if column not in numerical_columns
    ]

    if not numerical_columns or not grouping_columns:
        return {
            "error": "Comparative analysis requires a grouping column and a numerical column."
        }

    grouping_column = grouping_columns[0]
    numerical_column = numerical_columns[0]

    comparison = (
        selected_data
        .groupby(grouping_column)[numerical_column]
        .mean()
        .reset_index()
    )

    result = {
        "grouping_column": grouping_column,
        "measure_column": numerical_column,
        "comparison": [
            {
                grouping_column: row[grouping_column],
                "mean": float(row[numerical_column])
            }
            for _, row in comparison.iterrows()
        ]
    }

    return result


# Validate that the selected analysis type is suitable
# for the selected columns
def validate_analysis_type(
    dataframe,
    selected_columns,
    analysis_type
):

    # Get the analysis types supported by the selected columns
    supported_analysis_types = recommend_analysis_types(
        dataframe,
        selected_columns
    )

    # Check whether the selected analysis type is supported
    is_valid = analysis_type in supported_analysis_types

    return {
        "is_valid": is_valid,
        "supported_analysis_types": supported_analysis_types
    }


# Execute relationship analysis
def execute_relationship_analysis(dataframe, selected_columns):

    selected_data = dataframe[selected_columns]

    numerical_columns = selected_data.select_dtypes(
        include="number"
    ).columns.tolist()

    if len(numerical_columns) < 2:
        return {
            "error": "Relationship analysis requires at least two numerical columns."
        }

    x_column = numerical_columns[0]
    y_column = numerical_columns[1]

    relationship_data = selected_data[
        [x_column, y_column]
    ].dropna()

    result = {
        "x_column": x_column,
        "y_column": y_column,
        "data": [
            {
                x_column: float(row[x_column]),
                y_column: float(row[y_column])
            }
            for _, row in relationship_data.iterrows()
        ]
    }

    return result


# Execute distribution analysis
def execute_distribution_analysis(dataframe, selected_columns):

    selected_data = dataframe[selected_columns]

    numerical_columns = selected_data.select_dtypes(
        include="number"
    ).columns.tolist()

    if not numerical_columns:
        return {
            "error": "Distribution analysis requires at least one numerical column."
        }

    result = {
        "distributions": {}
    }

    for column in numerical_columns:

        values = selected_data[column].dropna()

        result["distributions"][column] = {
            "values": [
                float(value)
                for value in values
            ]
        }

    return result

# Execute outlier analysis
def execute_outlier_analysis(dataframe, selected_columns):

    selected_data = dataframe[selected_columns]

    numerical_columns = selected_data.select_dtypes(
        include="number"
    ).columns.tolist()

    if not numerical_columns:
        return {
            "error": "Outlier analysis requires at least one numerical column."
        }

    result = {
        "outliers": {}
    }

    for column in numerical_columns:

        values = selected_data[column].dropna()

        q1 = values.quantile(0.25)
        q3 = values.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        outlier_values = values[
            (values < lower_bound) |
            (values > upper_bound)
        ]

        result["outliers"][column] = {
            "q1": float(q1),
            "q3": float(q3),
            "iqr": float(iqr),
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound),
            "outliers": [
                float(value)
                for value in outlier_values
            ],
            "outlier_count": int(len(outlier_values))
        }

    return result
# مكتبة Pandas للتعامل مع ملفات وبيانات Dataset
import pandas as pd

# مكتبة OS للتعامل مع مسارات وملفات النظام
import os

import numpy as np

# مكتبة UUID لإنشاء أسماء فريدة للملفات
# بحيث لو عندي ملفيين بنفس الإسم مانبغا الملف الثاني يستبدل الأول
import uuid
import re
import csv



from models.dataset import Dataset

# قراءة ملف البيانات حسب نوعه عندنا نوعين CSV and Xlsx( امتداد حديث للإكسل)

# قراءة ملفات CSV وExcel مع الاحتفاظ بأسماء الأعمدة المكررة
def read_dataset(file_path):

    file_name = file_path.filename.lower()

    if file_name.endswith(".csv"):

        file_path.stream.seek(0)

        header_reader = csv.reader(
            line.decode("utf-8-sig")
            for line in file_path.stream
        )

        original_columns = next(header_reader)

        file_path.stream.seek(0)

        dataframe = pd.read_csv(file_path)

        if len(original_columns) == len(dataframe.columns):
            dataframe.columns = original_columns

        return dataframe

    elif file_name.endswith((".xlsx", ".xls")):

        return pd.read_excel(file_path)

    return None

# قراءة Dataset المحفوظ مع الاحتفاظ بأسماء الأعمدة المكررة
def read_saved_dataset(file_path):

    if file_path.lower().endswith(".csv"):

        # قراءة أسماء الأعمدة الأصلية
        with open(file_path, "r", encoding="utf-8-sig", newline="") as file:
            header_reader = csv.reader(file)
            original_columns = next(header_reader, [])

        # قراءة البيانات
        dataframe = pd.read_csv(file_path)

        # استعادة أسماء الأعمدة الأصلية
        if len(original_columns) == len(dataframe.columns):
            dataframe.columns = original_columns

        return dataframe

    elif file_path.lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(file_path)

    return None


# التحقق من صيغة الملف - راح يكون 3 صيغ 
def validate_file_format(file):
    allowed_formats = (".csv", ".xlsx", ".xls")
    return file.filename.lower().endswith(allowed_formats)

# التحقق من صحة تنسيق البيانات
def validate_data_format(dataframe):

    if dataframe.empty:
        return False

    if len(dataframe.columns) == 0:
        return False

    valid_columns = [
        column
        for column in dataframe.columns
        if str(column).strip()
    ]

    return len(valid_columns) > 0

# اكتشاف الأعمدة التي تحتوي على أسماء غير صالحة
def find_invalid_columns(dataframe):

    invalid_columns = []

    # الأحرف العربية والإنجليزية والأرقام والمسافات والرموز المسموح بها
    allowed_characters = re.compile(
        r"^[A-Za-z0-9\u0600-\u06FF _().%/\-]+$"
    )

    for column in dataframe.columns:

        column_name = str(column).strip()

        # اكتشاف اسم العمود الفارغ
        if not column_name:
            invalid_columns.append(column)

        # اكتشاف الأعمدة التي أنشأها Pandas باسم Unnamed
        elif column_name.startswith("Unnamed:"):
            invalid_columns.append(column)

        # اكتشاف الرموز غير المسموح بها
        elif not allowed_characters.fullmatch(column_name):
            invalid_columns.append(column)

    return invalid_columns


# اكتشاف الأعمدة المكررة duplicate columns 
def detect_duplicate_columns(dataframe):
    duplicate_columns = dataframe.columns[
        dataframe.columns.duplicated()
    ].tolist()

    return duplicate_columns


# تفحص فقط 
def analyze_duplicate_columns(dataframe):
    """
    Analyze columns with duplicate names by comparing their values.
    This function detects issues only; it does not modify the dataset.
    """

    duplicate_names = dataframe.columns[
        dataframe.columns.duplicated(keep=False)
    ].unique().tolist()

    results = []

    for column_name in duplicate_names:
        positions = [
            index
            for index, name in enumerate(dataframe.columns)
            if name == column_name
        ]

        first_position = positions[0]
        first_column = dataframe.iloc[:, first_position]

        for duplicate_position in positions[1:]:
            duplicate_column = dataframe.iloc[:, duplicate_position]

            if first_column.equals(duplicate_column):
                status = "exact_duplicate"
            else:
                both_present = (
                    first_column.notna()
                    & duplicate_column.notna()
                )

                conflicts = (
                    first_column[both_present].astype(str)
                    != duplicate_column[both_present].astype(str)
                )

                if not conflicts.any():
                    status = "potential_merge"
                else:
                    status = "different_columns"

            results.append({
                "column_name": str(column_name),
                "first_position": first_position,
                "duplicate_position": duplicate_position,
                "status": status
            })

    return results

# اكتشاف الصفوف المكررة في Dataset
def detect_duplicate_rows(dataframe):

    duplicate_mask = dataframe.duplicated(keep="first")

    duplicate_rows = []

    for position, is_duplicate in enumerate(duplicate_mask):

        if is_duplicate:
            duplicate_rows.append({
                "row": position + 1,
                "values": [
                     None if pd.isna(value) else (
                        value.item() if hasattr(value, "item") else value
                    )
                    for value in dataframe.iloc[position].tolist()
                    ]      
            })

    return {
        "total": len(duplicate_rows),
        "duplicate_rows": duplicate_rows
    }

# To TAKE على أسماء الأعمدة
def get_column_names(dataframe):
    return dataframe.columns.tolist()


# القيم التي يعتبرها النظام Missing Values
MISSING_VALUES = {
    "",
    "null",
    "none",
    "na",
    "n/a",
    "nan",
    "-",
    "--"
}

# حساب العدد الإجمالي للخانات المفقودة في Dataset
def count_missing_values(dataframe):

    missing_count = dataframe.isnull().sum().sum()

    return int(missing_count)

# حساب القيم المفقودة في كل عمود بشكل مستقل
def get_missing_values_by_column(dataframe):

    missing_columns = {}

    # فحص الأعمدة حسب مواقعها لدعم الأسماء المكررة
    for position, column in enumerate(dataframe.columns):

        column_data = dataframe.iloc[:, position]

        # حساب عدد القيم المفقودة
        missing_count = int(column_data.isnull().sum())

        # الاحتفاظ بالأعمدة التي تحتوي على قيم مفقودة
        if missing_count > 0:

            column_key = f"{column} (column {position + 1})"
            missing_columns[column_key] = missing_count

    return missing_columns

# توحيد القيم التي تمثل Missing Values
def normalize_missing_values(dataframe):

    cleaned_dataframe = dataframe.copy()

    # المرور على الأعمدة حسب مواقعها لدعم الأسماء المكررة
    for position in range(len(cleaned_dataframe.columns)):

        column_data = cleaned_dataframe.iloc[:, position]

        missing_mask = column_data.apply(
            lambda value: (
                isinstance(value, str)
                and value.strip().lower() in MISSING_VALUES
            )
        )

        cleaned_dataframe.iloc[:, position] = column_data.mask(
            missing_mask,
            pd.NA
        )

    return cleaned_dataframe

# اكتشاف القيم المفقودة، بما في ذلك الأعمدة التي تتكرر أسماؤها
def detect_missing_values(dataframe):

    missing_by_column = {}

    # فحص كل عمود باستخدام موقعه
    for position, column in enumerate(dataframe.columns):

        column_data = dataframe.iloc[:, position]
        missing_count = 0

        for value in column_data:

            if pd.isna(value):
                missing_count += 1

            elif (
                isinstance(value, str)
                and value.strip().lower() in MISSING_VALUES
            ):
                missing_count += 1

        if missing_count > 0:
            # إضافة رقم العمود للتمييز بين الأعمدة المتكررة
            key = f"{column} (column {position + 1})"

            missing_by_column[key] = int(missing_count)

    # حساب إجمالي القيم المفقودة في جميع الأعمدة
    total_missing = sum(missing_by_column.values())

    return {
        "total": int(total_missing),
        "columns": missing_by_column
    }


# دالة حساب النسبة للقيم المفتودة 

# Calculate the percentage of missing values in each column
def calculate_missing_percentage(dataframe):
    missing_values = detect_missing_values(dataframe)

    total_rows = len(dataframe)
    threshold = 20

    # Handle an empty dataset
    if total_rows == 0:
        return {
            "threshold": threshold,
            "columns": {},
            "exceeded_columns": []
        }

    missing_percentages = {}
    exceeded_columns = []

    # Calculate missing percentage for each column
    for column, missing_count in missing_values["columns"].items():
        percentage = (missing_count / total_rows) * 100
        exceeds_threshold = percentage > threshold

        missing_percentages[column] = {
            "missing_count": missing_count,
            "missing_percentage": round(percentage, 2),
            "exceeds_threshold": exceeds_threshold
        }

        # Add columns that exceed the threshold
        if exceeds_threshold:
            exceeded_columns.append({
                "column": column,
                "missing_count": missing_count,
                "missing_percentage": round(percentage, 2)
            })

    return {
        "threshold": threshold,
        "columns": missing_percentages,
        "exceeded_columns": exceeded_columns
    }

# الحصول على نوع البيانات لكل عمود
def get_column_data_types(dataframe):

    column_data_types = {}

    # فحص الأعمدة حسب مواقعها لدعم الأسماء المكررة
    for position, column in enumerate(dataframe.columns):

        column_key = f"{column} (column {position + 1})"
        column_data = dataframe.iloc[:, position]

        column_data_types[column_key] = str(column_data.dtype)

    return column_data_types

# اكتشاف الأعمدة التي تحتوي على تواريخ
def detect_datetime_columns(dataframe):

    datetime_columns = []

    # فحص الأعمدة حسب مواقعها لدعم الأسماء المكررة
    for position, column in enumerate(dataframe.columns):

        column_data = dataframe.iloc[:, position]

        # اسم العمود مع رقمه لتمييز الأعمدة المكررة
        column_key = f"{column} (column {position + 1})"

        # التحقق من الأعمدة ذات نوع التاريخ
        if pd.api.types.is_datetime64_any_dtype(column_data):
            datetime_columns.append(column_key)
            continue

        # فحص الأعمدة النصية
        if column_data.dtype == "object":

            non_missing_values = column_data.dropna()

            if non_missing_values.empty:
                continue

            converted_column = pd.to_datetime(
                non_missing_values,
                errors="coerce",
                dayfirst=True
            )

            if converted_column.notna().all():
                datetime_columns.append(column_key)

    return datetime_columns

# اكتشاف التواريخ غير الصحيحة في الأعمدة المحددة
def detect_invalid_dates(dataframe, date_columns):

    invalid_values = []

    column_names = [
        f"{column} (column {position + 1})"
        for position, column in enumerate(dataframe.columns)
    ]

    for column_key in date_columns:

        # التحقق من وجود العمود
        if column_key not in column_names:
            continue

        position = column_names.index(column_key)
        column_data = dataframe.iloc[:, position]

        # فحص كل قيمة في العمود
        for row_position, value in enumerate(column_data):

            if pd.isna(value) or str(value).strip() == "":
                continue

            converted_date = pd.to_datetime(
                value,
                errors="coerce",
                dayfirst=True
            )

            if pd.isna(converted_date):
                invalid_values.append({
                    "column": column_key,
                    "row": row_position + 1,
                    "value": str(value),
                    "reason": "Invalid date format or date value."
                })

    return {
        "total": len(invalid_values),
        "invalid_values": invalid_values
    }

# اكتشاف عناوين البريد الإلكتروني غير الصحيحة
def detect_invalid_emails(dataframe, email_columns):

    invalid_values = []

    for column_key in email_columns:

        column_names = [
            f"{column} (column {position + 1})"
            for position, column in enumerate(dataframe.columns)
        ]

        if column_key not in column_names:
            continue

        position = column_names.index(column_key)
        column_data = dataframe.iloc[:, position]

        for row_position, value in enumerate(column_data):

            if pd.isna(value) or str(value).strip() == "":
                continue

            email = str(value).strip()

            # التحقق من صيغة البريد الإلكتروني
            email_pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

            if not re.fullmatch(email_pattern, email):
                invalid_values.append({
                    "column": column_key,
                    "row": row_position + 1,
                    "value": email,
                    "reason": "Invalid email format."
                })

    return {
        "total": len(invalid_values),
        "invalid_values": invalid_values
    }



# تطبيق تعديلات المستخدم على التواريخ المخالفة
def apply_date_corrections(dataframe, date_columns, corrections):

    cleaned_data = dataframe.copy()

    for correction in corrections:

        column_key = correction.get("column")
        row = correction.get("row")
        new_value = correction.get("new_value")

        # التحقق من البيانات المطلوبة
        if not column_key or row is None or new_value is None:
            raise ValueError("Invalid correction data.")

        # التحقق من العمود المحدد
        column_names = [
            f"{column} (column {position + 1})"
            for position, column in enumerate(cleaned_data.columns)
        ]

        if column_key not in date_columns or column_key not in column_names:
            raise ValueError("Invalid date column.")

        position = column_names.index(column_key)

        # التحقق من رقم الصف
        if not isinstance(row, int) or row < 1 or row > len(cleaned_data):
            raise ValueError("Invalid row number.")

        # التحقق من أن القيمة الأصلية غير صالحة
        original_value = cleaned_data.iloc[row - 1, position]

        if pd.isna(original_value) or str(original_value).strip() == "":
            raise ValueError("Original value is missing.")

        original_date = pd.to_datetime(
            original_value,
            errors="coerce"
        )

        if not pd.isna(original_date):
            raise ValueError("The original date is already valid.")

        # التحقق من صحة التاريخ الجديد
        corrected_date = pd.to_datetime(
            new_value,
            errors="coerce"
        )

        if pd.isna(corrected_date):
            raise ValueError("The new date is invalid.")

        # حفظ التاريخ بالصيغة الموحدة
        cleaned_data.iloc[row - 1, position] = corrected_date.strftime("%Y-%m-%d")

    return cleaned_data

# توحيد تنسيق التواريخ في الأعمدة المحددة
def standardize_date_formats(dataframe, date_columns):

    standardized_data = dataframe.copy()

    column_names = [
        f"{column} (column {position + 1})"
        for position, column in enumerate(standardized_data.columns)
    ]

    for column_key in date_columns:

        if column_key not in column_names:
            raise ValueError("Invalid date column.")

        position = column_names.index(column_key)

        for row in range(len(standardized_data)):

            value = standardized_data.iloc[row, position]

            if pd.isna(value) or str(value).strip() == "":
                continue

            parsed_date = pd.to_datetime(
                value,
                errors="coerce",
                dayfirst=True
            )

            if not pd.isna(parsed_date):
                standardized_data.iloc[row, position] = (
                    parsed_date.strftime("%Y-%m-%d")
                )

    return standardized_data

# تصنيف الأعمدة حسب نوع البيانات
def classify_columns(dataframe):

    numerical_columns = []
    categorical_columns = []

    # الحصول على أعمدة التاريخ بأسمائها المميزة
    datetime_columns = detect_datetime_columns(dataframe)
    datetime_set = set(datetime_columns)

    # فحص كل عمود حسب موقعه
    for position, column in enumerate(dataframe.columns):

        column_key = f"{column} (column {position + 1})"
        column_data = dataframe.iloc[:, position]

        # استبعاد أعمدة التاريخ
        if column_key in datetime_set:
            continue

        # تصنيف الأعمدة الرقمية
        elif pd.api.types.is_numeric_dtype(column_data):
            numerical_columns.append(column_key)

        # تصنيف الأعمدة النصية
        elif pd.api.types.is_string_dtype(column_data) or column_data.dtype == "object":
            categorical_columns.append(column_key)

    return {
        "numerical": numerical_columns,
        "categorical": categorical_columns,
        "datetime": datetime_columns
    }


# اقتراح طريقة معالجة القيم المفقودة حسب نوع العمود
def recommend_missing_value_strategy(dataframe):

    column_categories = classify_columns(dataframe)
    missing_values = detect_missing_values(dataframe)

    recommendations = {}

    for column, missing_count in missing_values["columns"].items():

        if missing_count == 0:
            continue

        # مقارنة اسم العمود المميز مباشرة
        if column in column_categories["numerical"]:
            strategy = "mean"
            options = ["mean", "mode", "leave_missing"]

        elif column in column_categories["categorical"]:
            strategy = "mode"
            options = ["mode", "leave_missing"]

        elif column in column_categories["datetime"]:
            strategy = "mode"
            options = ["mode", "leave_missing"]

        else:
            strategy = "leave_missing"
            options = ["leave_missing"]

        recommendations[column] = {
            "missing_count": missing_count,
            "recommended_strategy": strategy,
            "available_options": options
        }

    return recommendations

# تطبيق طرق معالجة القيم المفقودة حسب اختيارات المستخدم
def apply_missing_value_strategies(dataframe, strategies):

    # التحقق من أن الاختيارات عبارة عن قاموس
    if not isinstance(strategies, dict):
        raise ValueError("Invalid strategies.")

    # توحيد القيم المفقودة أولاً
    cleaned_dataframe = normalize_missing_values(dataframe)

    # إنشاء أسماء الأعمدة مع أرقامها
    column_names = [
        f"{column} (column {position + 1})"
        for position, column in enumerate(cleaned_dataframe.columns)
    ]

    for column, strategy in strategies.items():

        # التحقق من وجود العمود
        if column not in column_names:
            raise ValueError(f"Invalid column: {column}")

        # استخراج موقع العمود
        column_position = column_names.index(column)

        # الحصول على بيانات العمود
        column_data = cleaned_dataframe.iloc[:, column_position]

        if strategy == "leave_missing":
            continue

        elif strategy == "mean":

            if not pd.api.types.is_numeric_dtype(column_data):
                raise ValueError(
                    f"Mean strategy is not valid for column: {column}"
                )

            fill_value = column_data.mean()

        elif strategy == "mode":

            modes = column_data.mode(dropna=True)

            if modes.empty:
                continue

            fill_value = modes.iloc[0]

        else:
            raise ValueError(f"Unsupported strategy: {strategy}")

        # تعبئة القيم المفقودة
        cleaned_dataframe.iloc[:, column_position] = (
            column_data.fillna(fill_value)
        )

    return cleaned_dataframe

# Detect cells containing invalid data formats
def detect_invalid_column_formats(dataframe):

    invalid_by_column = {}

    # Check each column by its position to support duplicate names
    for position, column in enumerate(dataframe.columns):

        column_data = dataframe.iloc[:, position]

        # Exclude missing values
        non_missing_values = column_data.dropna()

        # Ignore columns that are completely empty
        if non_missing_values.empty:
            continue

        # Try converting values to numbers
        numeric_values = pd.to_numeric(
            non_missing_values,
            errors="coerce"
        )

        numeric_valid_count = numeric_values.notna().sum()

        # Try converting values to dates
        datetime_values = pd.to_datetime(
            non_missing_values,
            errors="coerce"
        )

        datetime_valid_count = datetime_values.notna().sum()

        total_values = len(non_missing_values)

        # Skip columns that are entirely numeric
        if numeric_valid_count == total_values:
            continue

        # Skip columns that are entirely dates
        if datetime_valid_count == total_values:
            continue

        numeric_ratio = numeric_valid_count / total_values
        datetime_ratio = datetime_valid_count / total_values

        # Detect invalid values in mostly numeric columns
        if numeric_ratio >= 0.8:
            invalid_count = total_values - numeric_valid_count

            if invalid_count > 0:
                key = f"{column} (column {position + 1})"
                invalid_by_column[key] = int(invalid_count)

        # Detect invalid values in mostly date columns
        elif datetime_ratio >= 0.8:
            invalid_count = total_values - datetime_valid_count

            if invalid_count > 0:
                key = f"{column} (column {position + 1})"
                invalid_by_column[key] = int(invalid_count)

    total_invalid = sum(invalid_by_column.values())

    return {
        "total": int(total_invalid),
        "columns": invalid_by_column
    }
# اكتشاف القيم الرقمية التي تتجاوز الحدود المحددة
def detect_numeric_range_violations(dataframe, rules):

    if not isinstance(rules, dict):
        raise ValueError("Rules must be a dictionary.")

    invalid_values = []

    # المرور على الأعمدة حسب مواقعها
    for position, column in enumerate(dataframe.columns):

        column_key = f"{column} (column {position + 1})"

        # تخطي الأعمدة التي لم يحدد المستخدم لها حدودًا
        if column_key not in rules:
            continue

        column_rules = rules[column_key]

        if not isinstance(column_rules, dict):
            raise ValueError(f"Invalid rules for column: {column_key}")

        min_value = column_rules.get("min")
        max_value = column_rules.get("max")

        # التحقق من صحة الحدود
        if min_value is None and max_value is None:
            raise ValueError(f"At least one range limit is required for {column_key}.")

        if min_value is not None:
            min_value = pd.to_numeric(min_value, errors="coerce")

            if pd.isna(min_value) or not np.isfinite(min_value):
                raise ValueError(f"Invalid minimum value for {column_key}.")

        if max_value is not None:
            max_value = pd.to_numeric(max_value, errors="coerce")

            if pd.isna(max_value) or not np.isfinite(max_value):
                raise ValueError(f"Invalid maximum value for {column_key}.")

        if min_value is not None and max_value is not None:
            if min_value > max_value:
                raise ValueError(f"Minimum value cannot exceed maximum value for {column_key}.")

        column_data = dataframe.iloc[:, position]

        # فحص كل قيمة في العمود
        for row_position, value in enumerate(column_data):

            if pd.isna(value):
                continue

            numeric_value = pd.to_numeric(value, errors="coerce")

            # تجاهل القيم غير الرقمية في هذه المرحلة
            if pd.isna(numeric_value):
                continue

            reason = None

            if min_value is not None and numeric_value < min_value:
                reason = f"Value is below the minimum allowed value ({min_value})."

            elif max_value is not None and numeric_value > max_value:
                reason = f"Value exceeds the maximum allowed value ({max_value})."

            if reason:
                invalid_values.append({
                    "column": column_key,
                    "row": row_position + 1,
                    "value": value,
                    "reason": reason
                })

    return {
        "total": len(invalid_values),
        "invalid_values": invalid_values
    }

# تطبيق تعديلات المستخدم على القيم الرقمية المخالفة فقط
def apply_numeric_range_corrections(dataframe, rules, corrections):

    if not isinstance(rules, dict):
        raise ValueError("Rules must be a dictionary.")

    if not isinstance(corrections, list):
        raise ValueError("Corrections must be a list.")

    cleaned_data = dataframe.copy()

    # إنشاء أسماء الأعمدة مع أرقامها لدعم الأعمدة المكررة
    column_names = [
        f"{column} (column {position + 1})"
        for position, column in enumerate(cleaned_data.columns)
    ]

    for correction in corrections:

        if not isinstance(correction, dict):
            raise ValueError("Invalid correction data.")

        column_key = correction.get("column")
        row = correction.get("row")
        new_value = correction.get("new_value")

        # التحقق من وجود البيانات المطلوبة
        if not column_key or row is None or new_value is None:
            raise ValueError("Invalid correction data.")

        # التحقق من وجود العمود
        if column_key not in column_names:
            raise ValueError("Invalid column.")

        # التحقق من وجود قواعد للعمود
        if column_key not in rules:
            raise ValueError("No range rules found for this column.")

        position = column_names.index(column_key)

        # التحقق من رقم الصف
        if (
            not isinstance(row, int)
            or isinstance(row, bool)
            or row < 1
            or row > len(cleaned_data)
        ):
            raise ValueError("Invalid row number.")

        column_rules = rules[column_key]

        if not isinstance(column_rules, dict):
            raise ValueError("Invalid range rules.")

        min_value = column_rules.get("min")
        max_value = column_rules.get("max")

        # التحقق من صحة الحدود
        if min_value is None and max_value is None:
            raise ValueError("At least one range limit is required.")

        if min_value is not None:
            min_value = pd.to_numeric(min_value, errors="coerce")

            if pd.isna(min_value) or not np.isfinite(min_value):
                raise ValueError("Invalid minimum value.")

        if max_value is not None:
            max_value = pd.to_numeric(max_value, errors="coerce")

            if pd.isna(max_value) or not np.isfinite(max_value):
                raise ValueError("Invalid maximum value.")

        if min_value is not None and max_value is not None:
            if min_value > max_value:
                raise ValueError("Minimum value cannot exceed maximum value.")

        # التحقق من القيمة الأصلية
        original_value = cleaned_data.iloc[row - 1, position]

        numeric_original = pd.to_numeric(original_value, errors="coerce")

        if pd.isna(numeric_original):
            raise ValueError("The original value is not numeric.")

        is_invalid = (
            (min_value is not None and numeric_original < min_value)
            or
            (max_value is not None and numeric_original > max_value)
        )

        if not is_invalid:
            raise ValueError("The original value is not invalid.")

        # التحقق من القيمة الجديدة
        numeric_new_value = pd.to_numeric(new_value, errors="coerce")

        if pd.isna(numeric_new_value) or not np.isfinite(numeric_new_value):
            raise ValueError("The new value must be a finite number.")

        # التأكد من أن القيمة الجديدة ضمن الحدود
        if (
            (min_value is not None and numeric_new_value < min_value)
            or
            (max_value is not None and numeric_new_value > max_value)
        ):
            raise ValueError("The new value is outside the allowed range.")

        # تطبيق التعديل
        cleaned_data.iloc[row - 1, position] = numeric_new_value

    return cleaned_data

# حفظ ملف Dataset داخل مجلد uploads
def save_uploaded_file(file, upload_folder):

    # التحقق من وجود الملف واسمه
    if file is None or not file.filename:
        raise ValueError("No file was provided.")

    # الحصول على امتداد الملف الأصلي
    file_extension = os.path.splitext(
        file.filename
    )[1].lower()

    # التحقق من صيغة الملف
    if file_extension not in [".csv", ".xlsx", ".xls"]:
        raise ValueError("Unsupported file format.")

    # التأكد من وجود مجلد uploads
    os.makedirs(upload_folder, exist_ok=True)

    # إنشاء اسم فريد للملف
    unique_file_name = f"{uuid.uuid4()}{file_extension}"

    # إنشاء المسار الكامل لحفظ الملف
    file_path = os.path.join(
        upload_folder,
        unique_file_name
    )

    # حفظ الملف
    file.save(file_path)

    return file_path

# Searching for a User Dataset
def get_dataset_for_user(dataset_id, user_id):
    return Dataset.query.filter_by(
        id=dataset_id,
        user_id=user_id
    ).first()

# حفظ البيانات بعد تنظيفها
def save_cleaned_dataset(dataframe, file_path):

    # حفظ ملفات CSV
    if file_path.lower().endswith(".csv"):
        dataframe.to_csv(file_path, index=False)

    # حفظ ملفات Excel بصيغة XLSX
    elif file_path.lower().endswith(".xlsx"):
        dataframe.to_excel(file_path, index=False)

    else:
        raise ValueError(
            "Saving this file format is not supported. Use CSV or XLSX."
        )

# الحصول على أسماء الأعمدة الموجودة في Dataset
def get_available_column_names(dataframe):

    return [
        f"{column} (column {position + 1})"
        for position, column in enumerate(dataframe.columns)
    ]

# اكتشاف الأعمدة التي اختارها المستخدم لكنها غير موجودة في Dataset
def find_invalid_selected_columns(dataframe, selected_columns):

    available_columns = set(dataframe.columns)

    return [
        column
        for column in selected_columns
        if column not in available_columns
    ]

# التحقق من صحة الأعمدة التي اختارها المستخدم
def validate_selected_columns(
    dataframe,
    selected_columns
):

    invalid_columns = find_invalid_selected_columns(
        dataframe,
        selected_columns
    )

    return {
        "is_valid": len(invalid_columns) == 0,
        "invalid_columns": invalid_columns
    }
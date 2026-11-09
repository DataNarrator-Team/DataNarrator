
from sqlalchemy import inspect, text

from app import app
from database.database import db


# Columns required by the current User model
required_columns = {
    "role": "VARCHAR(20) NOT NULL DEFAULT 'user'",
    "chart_color": "VARCHAR(50) DEFAULT 'warm'",
    "currency": "VARCHAR(10) DEFAULT 'SAR'",
    "number_display": "VARCHAR(20) DEFAULT 'full'",
    "theme": "VARCHAR(20) DEFAULT 'light'",
}

with app.app_context():
    existing_columns = {
        column["name"]
        for column in inspect(db.engine).get_columns("users")
    }

    with db.engine.begin() as connection:
        for column_name, definition in required_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE users "
                        f"ADD COLUMN {column_name} {definition}"
                    )
                )
                print(f"Added column: {column_name}")
            else:
                print(f"Already exists: {column_name}")

    print("User table update completed.")

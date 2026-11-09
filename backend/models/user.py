from database.database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(150),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=False
    )
    role = db.Column(
        db.String(20),
        nullable=False,
        default="user"
    )

    display_name = db.Column(
        db.String(150),
        nullable=True
    )

    profile_image = db.Column(
        db.String(255),
        nullable=True
    )

    chart_color = db.Column(
        db.String(50),
        nullable=True,
        default="warm"
    )

    currency = db.Column(
        db.String(10),
        nullable=True,
        default="SAR"
    )

    number_display = db.Column(
        db.String(20),
        nullable=True,
        default="full"
    )

    theme = db.Column(
        db.String(20),
        nullable=True,
        default="light"
    )
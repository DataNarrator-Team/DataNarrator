from database.database import db
from sqlalchemy.dialects.postgresql import JSONB


class AnalysisSession(db.Model):

    __tablename__ = "analysis_sessions"

    id = db.Column(
        db.BigInteger,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    dataset_id = db.Column(
        db.Integer,
        db.ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False
    )

    analysis_type = db.Column(
        db.String(50),
        nullable=False
    )

    selected_columns = db.Column(
        JSONB,
        nullable=False
    )

    visualization_recommendation = db.Column(
        JSONB,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        server_default=db.func.now()
    )

    ai_explanation = db.Column(
    db.Text,
    nullable=True
)
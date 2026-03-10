from datetime import datetime, timezone
from .. import db


class Analysis(db.Model):
    __tablename__ = "analyses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)  # nullable = guest
    input_type = db.Column(db.String(10), nullable=False)  # "text" or "url"
    source_url = db.Column(db.Text, nullable=True)
    article_text = db.Column(db.Text, nullable=False)
    overall_score = db.Column(db.Float, nullable=False)  # 0–100

    # Multi-dimension scores
    sensationalism_score = db.Column(db.Float)
    bias_score = db.Column(db.Float)
    emotion_score = db.Column(db.Float)
    factual_score = db.Column(db.Float)

    # JSON: list of {sentence, score, explanation}
    sentence_results = db.Column(db.JSON, nullable=False, default=list)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "input_type": self.input_type,
            "source_url": self.source_url,
            "overall_score": self.overall_score,
            "scores": {
                "sensationalism": self.sensationalism_score,
                "bias": self.bias_score,
                "emotion": self.emotion_score,
                "factual": self.factual_score,
            },
            "sentence_results": self.sentence_results,
            "created_at": self.created_at.isoformat(),
        }

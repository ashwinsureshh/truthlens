from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
jwt = JWTManager()


def create_app(config=Config):
    app = Flask(__name__)
    app.config.from_object(config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"])

    from .routes.analyze import analyze_bp
    from .routes.auth import auth_bp
    from .routes.history import history_bp
    from .routes.benchmark import benchmark_bp

    app.register_blueprint(analyze_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(history_bp, url_prefix="/api")
    app.register_blueprint(benchmark_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app

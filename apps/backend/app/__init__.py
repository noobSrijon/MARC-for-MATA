from flask import Flask
from flask_cors import CORS

from config.settings import config

from app.api import vehicles_bp


def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    CORS(app)

    app.register_blueprint(vehicles_bp)

    @app.route("/")
    def index():
        return {"status": "ok", "message": "MARC backend running"}

    return app

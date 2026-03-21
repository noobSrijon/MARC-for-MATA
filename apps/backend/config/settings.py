import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY")
    MONGO_URI = os.getenv("MONGO_URI")
    MATA_API_BASE_URL = os.getenv("MATA_API_BASE_URL")
    MATA_VEHICLES_PATH = os.getenv("MATA_VEHICLES_PATH")
    MATA_LIGNES = os.getenv("MATA_LIGNES")
    DEBUG = False
    TESTING = False


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


class TestingConfig(Config):
    TESTING = True
    MONGO_URI = os.getenv("MONGO_URI_TEST")


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}

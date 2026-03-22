from app.api.vehicles import bp as vehicles_bp
from app.api.gtfs import bp as gtfs_bp
from app.api.reports import bp as reports_bp
from app.api.admin import bp as admin_bp

__all__ = ["vehicles_bp", "gtfs_bp", "reports_bp", "admin_bp"]

"""
Vehicles API routes.
"""

from flask import Blueprint, current_app, jsonify

from app.services import fetch_vehicles_safe

bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")


def _vehicle_for_response(vehicle: dict) -> dict:
    """Strip internal fields for public API response."""
    out = {k: v for k, v in vehicle.items() if k != "_raw"}
    return out


@bp.route("", methods=["GET"])
@bp.route("/", methods=["GET"])
def list_vehicles():
    """
    GET /api/vehicles

    Returns real-time vehicle positions from MATA.
    """
    vehicles = fetch_vehicles_safe(
        base_url=current_app.config["MATA_API_BASE_URL"],
        path=current_app.config["MATA_VEHICLES_PATH"],
        lignes=current_app.config["MATA_LIGNES"],
    )
    return jsonify({
        "vehicles": [_vehicle_for_response(v) for v in vehicles],
        "count": len(vehicles),
    })

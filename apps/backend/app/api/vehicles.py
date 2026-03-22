from flask import Blueprint, current_app, jsonify

from app.services import fetch_vehicles_safe
from app.services.gtfs_service import gtfs

bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")


def _enrich(vehicle: dict) -> dict:
    out = {k: v for k, v in vehicle.items() if k != "_raw"}
    route = gtfs.route_for_destination(vehicle.get("destination") or "")
    if route:
        out["route_short_name"] = route["short_name"]
        out["route_long_name"] = route["long_name"]
        out["route_color"] = route["color"]
        start, end = gtfs.route_terminals(route["id"])
        out["terminal_start"] = start
        out["terminal_end"] = end
    else:
        out["route_short_name"] = None
        out["route_long_name"] = None
        out["route_color"] = None
        out["terminal_start"] = None
        out["terminal_end"] = None
    return out


@bp.route("", methods=["GET"])
@bp.route("/", methods=["GET"])
def list_vehicles():
    vehicles = fetch_vehicles_safe(
        base_url=current_app.config["MATA_API_BASE_URL"],
        path=current_app.config["MATA_VEHICLES_PATH"],
        lignes=current_app.config["MATA_LIGNES"],
    )
    return jsonify({
        "vehicles": [_enrich(v) for v in vehicles],
        "count": len(vehicles),
    })

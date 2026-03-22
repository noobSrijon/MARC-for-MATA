from flask import Blueprint, current_app, jsonify

from app.services import fetch_vehicles_safe
from app.services.gtfs_service import gtfs

bp = Blueprint("vehicles", __name__, url_prefix="/api/vehicles")


def _enrich(vehicle: dict) -> dict:
    out = {k: v for k, v in vehicle.items() if k != "_raw"}
    route = gtfs.route_for_destination(vehicle.get("destination") or "")
    # Fall back to route_id from the raw vehicle data when headsign doesn't match
    if not route:
        raw_route_id = str(vehicle.get("route_id") or "").strip()
        if raw_route_id:
            route = gtfs.get_route_by_id(raw_route_id)
    if route:
        out["route_short_name"] = route["short_name"]
        out["route_long_name"] = route["long_name"]
        out["route_color"] = route["color"]
        start, end = gtfs.route_terminals(route["id"])
        out["terminal_start"] = start
        out["terminal_end"] = end
        out["route_shape_id"] = gtfs.get_route_shape_id(route["id"])
    else:
        out["route_short_name"] = None
        out["route_long_name"] = None
        out["route_color"] = None
        out["terminal_start"] = None
        out["terminal_end"] = None
        out["route_shape_id"] = None
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

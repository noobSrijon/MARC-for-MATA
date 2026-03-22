from flask import Blueprint, jsonify, request

from app.services.gtfs_service import gtfs

bp = Blueprint("gtfs", __name__, url_prefix="/api")


@bp.route("/stops", methods=["GET"])
def list_stops():
    """Return all stops for the search dropdown."""
    stops = gtfs.get_stops()
    return jsonify({"stops": stops, "count": len(stops)})


@bp.route("/routes", methods=["GET"])
def list_routes():
    """Return all GTFS routes."""
    routes = gtfs.get_routes()
    return jsonify({"routes": routes, "count": len(routes)})


@bp.route("/plan", methods=["GET"])
def plan_trip():
    from_stop = (request.args.get("from_stop") or "").strip()
    to_stop = (request.args.get("to_stop") or "").strip()

    if not from_stop or not to_stop:
        return jsonify({"error": "from_stop and to_stop are required"}), 400

    if from_stop == to_stop:
        return jsonify({"error": "from_stop and to_stop must be different"}), 400

    return jsonify(gtfs.plan_trip(from_stop, to_stop))


@bp.route("/plan/walk", methods=["GET"])
def plan_trip_walk():
    """Route between two coordinates, walking to/from nearby stops.
    ?from_lat=35.15&from_lon=-90.05&to_lat=35.12&to_lon=-90.03
    """
    try:
        from_lat = float(request.args.get("from_lat", ""))
        from_lon = float(request.args.get("from_lon", ""))
        to_lat = float(request.args.get("to_lat", ""))
        to_lon = float(request.args.get("to_lon", ""))
    except (TypeError, ValueError):
        return jsonify({"error": "from_lat, from_lon, to_lat, to_lon are required floats"}), 400

    return jsonify(gtfs.plan_trip_walk(from_lat, from_lon, to_lat, to_lon))


@bp.route("/shapes/<path:shape_id>", methods=["GET"])
def get_shape(shape_id: str):
    points = gtfs.get_shape(shape_id)
    return jsonify({"shape_id": shape_id, "points": points})


@bp.route("/routes/<path:route_id>/stops", methods=["GET"])
def get_route_stops(route_id: str):
    stops = gtfs.get_route_stops(route_id)
    return jsonify({"route_id": route_id, "stops": stops, "count": len(stops)})


@bp.route("/next_departures", methods=["GET"])
def next_departures():
    """Return next scheduled departure times for a route from a stop.
    ?route_id=X&from_stop=Y
    """
    route_id = (request.args.get("route_id") or "").strip()
    from_stop = (request.args.get("from_stop") or "").strip()
    if not route_id or not from_stop:
        return jsonify({"error": "route_id and from_stop are required"}), 400
    times = gtfs.get_next_departures(route_id, from_stop)
    return jsonify({"route_id": route_id, "from_stop": from_stop, "departures": times})

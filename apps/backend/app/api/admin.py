import logging
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, jsonify, current_app
from pymongo import MongoClient

logger = logging.getLogger(__name__)

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _get_db():
    if not current_app.config.get("MONGO_URI"):
        return None
    client = MongoClient(current_app.config["MONGO_URI"])
    db_name = current_app.config.get("MONGODB_DB_NAME", "marc")
    return client[db_name]


@bp.route("/reports", methods=["GET"])
def get_all_reports():
    """
    GET /api/admin/reports
    Returns all unresolved reports sorted by severityScore descending.
    """
    db = _get_db()
    if db is None:
        return jsonify({"error": "Storage not configured"}), 503

    try:
        cursor = db.reports.find(
            {"resolved": {"$ne": True}}
        ).sort("severityScore", -1).limit(200)

        docs = list(cursor)
        for d in docs:
            d["_id"] = str(d["_id"])
            # Ensure severityScore exists for older docs
            if "severityScore" not in d:
                d["severityScore"] = 50
        return jsonify({"reports": docs, "count": len(docs)})
    except Exception as e:
        logger.exception("Failed to list admin reports: %s", e)
        return jsonify({"error": "Failed to list reports"}), 500


@bp.route("/reports/<report_id>/resolve", methods=["POST", "DELETE"])
def resolve_report(report_id):
    """
    POST /api/admin/reports/<report_id>/resolve
    Marks a report as resolved (removes it from active reports).
    """
    db = _get_db()
    if db is None:
        return jsonify({"error": "Storage not configured"}), 503

    # Try custom string id first, then ObjectId
    doc = db.reports.find_one({"id": report_id})
    if not doc:
        try:
            doc = db.reports.find_one({"_id": ObjectId(report_id)})
        except (InvalidId, TypeError):
            pass

    if not doc:
        return jsonify({"error": "Report not found"}), 404

    try:
        db.reports.delete_one({"_id": doc["_id"]})
        return jsonify({"ok": True, "resolved": report_id})
    except Exception as e:
        logger.exception("Failed to resolve report: %s", e)
        return jsonify({"error": "Failed to resolve report"}), 500

"""
Reports API routes.

Handles image uploads for accessibility reports and serves stored images from MongoDB GridFS.
"""

import io
import logging
import time
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify, send_file, current_app
from gridfs import GridFS
from pymongo import MongoClient

logger = logging.getLogger(__name__)

# Max file size: 5MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _get_db():
    """Get MongoDB database for reports collection."""
    if not current_app.config.get("MONGO_URI"):
        return None
    client = MongoClient(current_app.config["MONGO_URI"])
    db_name = current_app.config.get("MONGODB_DB_NAME", "marc")
    return client[db_name]


def _get_gridfs():
    """Get GridFS bucket for report images. Uses 'report_images' collection."""
    db = _get_db()
    if db is None:
        return None
    return GridFS(db, collection="report_images")


@bp.route("", methods=["GET", "POST"])
@bp.route("/", methods=["GET", "POST"])
def reports():
    """
    GET /api/reports - List recent reports from the database.
    POST /api/reports - Create a new report (issue type, description, bus info, image URLs).
    """
    db = _get_db()
    if db is None:
        return jsonify({"error": "Storage not configured"}), 503

    if request.method == "GET":
        try:
            cursor = db.reports.find().sort("timestamp", -1).limit(50)
            docs = list(cursor)
            for d in docs:
                d["_id"] = str(d["_id"])
            return jsonify({"reports": docs, "count": len(docs)})
        except Exception as e:
            logger.exception("Failed to list reports: %s", e)
            return jsonify({"error": "Failed to list reports"}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    required = ["busId", "equipmentNumber", "issueType", "issueIcon"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    report = {
        "id": data.get("id") or f"rpt-{ObjectId()}",
        "busId": data["busId"],
        "equipmentNumber": data["equipmentNumber"],
        "routeShortName": data.get("routeShortName"),
        "routeLongName": data.get("routeLongName"),
        "issueType": data["issueType"],
        "issueIcon": data["issueIcon"],
        "description": (data.get("description") or "").strip(),
        "imageUrls": data.get("imageUrls") or [],
        "timestamp": data.get("timestamp") or int(time.time() * 1000),
    }

    try:
        result = db.reports.insert_one(report)
        report["_id"] = str(result.inserted_id)
        return jsonify({"ok": True, "id": report["id"]}), 201
    except Exception as e:
        logger.exception("Failed to save report: %s", e)
        return jsonify({"error": "Failed to save report"}), 500


@bp.route("/upload-image", methods=["POST"])
def upload_image():
    """
    POST /api/reports/upload-image

    Accepts multipart form data with 'image' file field.
    Stores image in MongoDB GridFS and returns the URL to fetch it.
    """
    fs = _get_gridfs()
    if fs is None:
        return jsonify({"error": "Storage not configured"}), 503

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "No image file selected"}), 400

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        return jsonify({"error": "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"}), 400

    data = file.read()
    if len(data) > MAX_IMAGE_SIZE:
        return jsonify({"error": "File too large. Max 5MB"}), 413

    try:
        file_id = fs.put(
            io.BytesIO(data),
            filename=file.filename or "image",
            content_type=content_type,
        )
        # Return full URL so frontend can use it directly in <img src="">
        base_url = request.url_root.rstrip("/")
        url = f"{base_url}/api/reports/images/{file_id}"
        return jsonify({"url": url})
    except Exception as e:
        logger.exception("Failed to store image: %s", e)
        return jsonify({"error": "Failed to store image"}), 500


@bp.route("/images/<file_id>", methods=["GET"])
def get_image(file_id):
    """
    GET /api/reports/images/<file_id>

    Serves an image from GridFS by ID.
    """
    fs = _get_gridfs()
    if fs is None:
        return jsonify({"error": "Storage not configured"}), 503

    try:
        oid = ObjectId(file_id)
    except (InvalidId, TypeError):
        return jsonify({"error": "Invalid image ID"}), 404

    try:
        grid_out = fs.get(oid)
    except Exception:
        return jsonify({"error": "Image not found"}), 404

    return send_file(
        io.BytesIO(grid_out.read()),
        mimetype=grid_out.content_type or "application/octet-stream",
        as_attachment=False,
        download_name=grid_out.filename or "image",
    )

import io
import logging
import os
import time
import requests as http_requests
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify, send_file, current_app
from gridfs import GridFS
from pymongo import MongoClient

logger = logging.getLogger(__name__)

_ISSUE_BASE_SCORES = {
    "broken ramp": 90,
    "ramp broken": 90,
    "wheelchair ramp": 88,
    "elevator out": 85,
    "elevator broken": 85,
    "blocked path": 75,
    "safety hazard": 80,
    "crowded bus": 55,
    "overcrowded": 55,
    "signage error": 35,
    "wrong sign": 35,
    "other": 50,
}


def _compute_severity(issue_type: str, description: str) -> int:
    """
    Compute a severity score 0–100 for a report.
    Tries OpenRouter AI first; falls back to rule-based scoring.
    """
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if api_key:
        try:
            prompt = (
                f"Rate the severity of this bus accessibility issue from 0 to 100 "
                f"(100 = life-threatening emergency, 0 = trivial cosmetic issue).\n"
                f"Issue type: {issue_type}\n"
                f"Description: {description or 'No description provided.'}\n\n"
                f"Respond with ONLY a JSON object like: {{\"score\": 75}}"
            )
            response = http_requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://marc-for-mata.app",
                    "X-Title": "MARC for MATA",
                },
                json={
                    "model": "openai/gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 30,
                },
                timeout=8,
            )
            result = response.json()
            import json as _json
            content = result["choices"][0]["message"]["content"].strip()
            parsed = _json.loads(content)
            score = int(parsed.get("score", 50))
            return max(0, min(100, score))
        except Exception as e:
            logger.warning("AI severity scoring failed", e)

    
    key = issue_type.lower().strip()
    base = 50
    for pattern, score in _ISSUE_BASE_SCORES.items():
        if pattern in key:
            base = score
            break


    word_count = len(description.split()) if description else 0
    boost = min(10, word_count // 5)
    return min(100, base + boost)


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
  
    db = _get_db()
    if db is None:
        return jsonify({"error": "Storage not configured"}), 503

    if request.method == "GET":
        try:
            query = {}
            route_short_name = request.args.get("route_short_name")
            if route_short_name:
                query["routeShortName"] = route_short_name

            cursor = db.reports.find(query).sort("timestamp", -1).limit(50)
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

    issue_type = data["issueType"]
    description = (data.get("description") or "").strip()
    severity_score = _compute_severity(issue_type, description)

    report = {
        "id": data.get("id") or f"rpt-{ObjectId()}",
        "busId": data["busId"],
        "equipmentNumber": data["equipmentNumber"],
        "routeShortName": data.get("routeShortName"),
        "routeLongName": data.get("routeLongName"),
        "issueType": issue_type,
        "issueIcon": data["issueIcon"],
        "description": description,
        "imageUrls": data.get("imageUrls") or [],
        "timestamp": data.get("timestamp") or int(time.time() * 1000),
        "likes": 0,
        "dislikes": 0,
        "severityScore": severity_score,
        "resolved": False,
    }

    try:
        result = db.reports.insert_one(report)
        report["_id"] = str(result.inserted_id)
        return jsonify({"ok": True, "id": report["id"], "severityScore": severity_score}), 201
    except Exception as e:
        logger.exception("Failed to save report: %s", e)
        return jsonify({"error": "Failed to save report"}), 500


@bp.route("/<report_id>/vote", methods=["POST"])
def vote_report(report_id):
    db = _get_db()
    if db is None:
        return jsonify({"error": "Storage not configured"}), 503

    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    vote = data.get("vote")
    if vote not in ("like", "dislike"):
        return jsonify({"error": "vote must be 'like' or 'dislike'"}), 400

    field = "likes" if vote == "like" else "dislikes"

    # Try finding by custom string id first, then by ObjectId
    doc = db.reports.find_one({"id": report_id})
    if not doc:
        try:
            doc = db.reports.find_one({"_id": ObjectId(report_id)})
        except (InvalidId, TypeError):
            pass

    if not doc:
        return jsonify({"error": "Report not found"}), 404

    # Use aggregation pipeline update so $ifNull handles existing null fields (pre-migration docs)
    db.reports.update_one(
        {"_id": doc["_id"]},
        [{"$set": {field: {"$add": [{"$ifNull": [f"${field}", 0]}, 1]}}}]
    )
    updated = db.reports.find_one({"_id": doc["_id"]})
    return jsonify({
        "ok": True,
        "likes": updated.get("likes", 0),
        "dislikes": updated.get("dislikes", 0),
    })


@bp.route("/ai-note", methods=["GET"])
def ai_note():
 
    route_short_name = request.args.get("route_short_name")
    if not route_short_name:
        return jsonify({"error": "route_short_name required"}), 400

    db = _get_db()
    if db is None:
        return jsonify({"error": "Storage not configured"}), 503

    cursor = db.reports.find({"routeShortName": route_short_name}).sort("timestamp", -1).limit(20)
    docs = list(cursor)

    if not docs:
        return jsonify({"note": "No reports available yet for this route."})

    report_lines = []
    for d in docs:
        issue = d.get("issueType", "Unknown issue")
        desc = (d.get("description") or "").strip()
        likes = d.get("likes") or 0
        dislikes = d.get("dislikes") or 0
        line = f"- {issue}"
        if desc:
            line += f": {desc}"
        line += f" (helpful: {likes}, not helpful: {dislikes})"
        report_lines.append(line)

    context = "\n".join(report_lines)

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        return jsonify({"note": "AI summary not available (API key not configured)."})

    try:
        response = http_requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://marc-for-mata.app",
                "X-Title": "MARC for MATA",
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a transit accessibility assistant for MATA (Memphis Area Transit Authority). "
                            "Summarize user-submitted reports about a bus route, focusing specifically on "
                            "wheelchair ramp and accessibility issues. Be concise (2-3 sentences max) and practical. "
                            "If there are no ramp-related reports, say so briefly."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Here are recent user reports for bus route {route_short_name}:\n\n"
                            f"{context}\n\n"
                            "What do these reports say about accessibility for ramp and wheelchair users? "
                            "Give a short, practical summary."
                        ),
                    },
                ],
                "max_tokens": 150,
            },
            timeout=15,
        )
        result = response.json()
        note = result["choices"][0]["message"]["content"].strip()
        return jsonify({"note": note})
    except Exception as e:
        logger.exception("AI note failed: %s", e)
        return jsonify({"note": "AI accessibility summary temporarily unavailable."})


@bp.route("/analyze-image", methods=["POST"])
def analyze_image():
    """
    POST /api/reports/analyze-image
    Body: {"image_base64": "<base64>", "mime_type": "image/jpeg"}
    Uses OpenRouter vision model to describe the accessibility issue in the image.
    """
    data = request.get_json()
    if not data or not data.get("image_base64"):
        return jsonify({"error": "image_base64 required"}), 400

    image_base64 = data["image_base64"]
    mime_type = data.get("mime_type", "image/jpeg")

    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        return jsonify({"error": "AI not configured"}), 503

    try:
        response = http_requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://marc-for-mata.app",
                "X-Title": "MARC for MATA",
            },
            json={
                "model": "openai/gpt-4o-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_base64}"
                                },
                            },
                            {
                                "type": "text",
                                "text": (
                                    "This photo was submitted with a MATA (Memphis Area Transit Authority) bus accessibility report. "
                                    "Write 1-2 sentences in first-person as the person reporting the problem — like a complaint or issue report, not a description. "
                                    "Example style: 'The wheelchair ramp was stuck and wouldn't deploy, making it impossible to board.' "
                                    "Focus on the impact of the problem (e.g. couldn't board, safety hazard, ramp broken) based on what you see. "
                                    "Do not start with 'I can see' or describe the photo — write as if you experienced the issue."
                                ),
                            },
                        ],
                    }
                ],
                "max_tokens": 120,
            },
            timeout=20,
        )
        result = response.json()
        description = result["choices"][0]["message"]["content"].strip()
        return jsonify({"description": description})
    except Exception as e:
        logger.exception("Image analysis failed: %s", e)
        return jsonify({"error": "Analysis failed"}), 500


@bp.route("/upload-image", methods=["POST"])
def upload_image():

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

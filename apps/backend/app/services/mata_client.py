

import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Any

import requests

# Memphis, TN timezone (Central Time)
MEMPHIS_TZ = ZoneInfo("America/Chicago")

logger = logging.getLogger(__name__)

# Default request timeout (seconds)
DEFAULT_TIMEOUT = 10


def _parse_status(avance_retard: str) -> str:

    if not avance_retard:
        return "unknown"
    lower = avance_retard.strip().lower()
    if "on time" in lower:
        return "on-time"
    if "late" in lower:
        return "delayed"
    if "early" in lower:
        return "early"
    return "unknown"


def _parse_vehicle(raw: dict[str, Any]) -> dict[str, Any]:
    localisation = raw.get("localisation") or {}
    conduite = raw.get("conduite") or {}
    arret_suiv = conduite.get("arretSuiv") or {}

    avance_retard = conduite.get("avanceRetard", "")

    return {
        "id": raw.get("id"),
        "equipment_number": raw.get("numeroEquipement"),
        "type": raw.get("type", "Bus"),
        "lat": localisation.get("lat"),
        "lng": localisation.get("lng"),
        "heading": localisation.get("cap"),
        "route_id": conduite.get("idLigne"),
        "destination": conduite.get("destination"),
        "speed": conduite.get("vitesse"),
        "status": _parse_status(avance_retard),
        "status_raw": avance_retard,
        "next_stop": arret_suiv.get("nomCommercial"),
        "eta_minutes": arret_suiv.get("estimationTemps"),
        "load": raw.get("vehiculeLoad"),
        # Keep raw for consumers that need it
        "_raw": raw,
    }


def fetch_vehicles(
    base_url: str,
    path: str,
    lignes: str,
    *,
    timeout: float = DEFAULT_TIMEOUT,
) -> list[dict[str, Any]]:

    url = base_url.rstrip("/") + path
    now_central = datetime.now(MEMPHIS_TZ)
    params = {"_tmp": int(now_central.timestamp()), "lignes": lignes}

    response = requests.get(url, params=params, timeout=timeout)
    response.raise_for_status()

    data = response.json()
    raw_vehicles = data.get("vehicule") or data.get("vehicules") or []

    if not isinstance(raw_vehicles, list):
        logger.warning("MATA API returned unexpected vehicule format: %s", type(raw_vehicles))
        return []

    return [_parse_vehicle(v) for v in raw_vehicles]


def fetch_vehicles_safe(
    base_url: str,
    path: str,
    lignes: str,
    *,
    timeout: float = DEFAULT_TIMEOUT,
) -> list[dict[str, Any]]:
    try:
        return fetch_vehicles(base_url, path, lignes, timeout=timeout)
    except requests.RequestException as e:
        logger.exception("MATA API request failed: %s", e)
        return []
    except (KeyError, TypeError, ValueError) as e:
        logger.exception("MATA API response parse error: %s", e)
        return []

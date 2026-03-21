"""
Unit tests for the MATA client service.
"""

from unittest.mock import MagicMock, patch

import pytest

from app.services.mata_client import (
    _parse_status,
    _parse_vehicle,
    fetch_vehicles,
    fetch_vehicles_safe,
)


# Sample raw vehicle from real MATA API response
SAMPLE_RAW_VEHICLE = {
    "localisation": {"lat": 35.05352911832416, "lng": -89.99130443986354, "cap": 180},
    "conduite": {
        "idLigne": 103147,
        "vitesse": 0,
        "destination": "IRS",
        "avanceRetard": "50 min late",
        "arretSuiv": {"nomCommercial": "WINCHESTER @HOLLY", "estimationTemps": 0},
    },
    "id": 19037,
    "vehiculeLoad": "4%",
    "type": "Bus",
    "numeroEquipement": "4028",
}


class TestParseStatus:
    """Tests for _parse_status helper."""

    def test_on_time(self):
        assert _parse_status("on time") == "on-time"
        assert _parse_status("On Time") == "on-time"
        assert _parse_status("  ON TIME  ") == "on-time"

    def test_delayed(self):
        assert _parse_status("50 min late") == "delayed"
        assert _parse_status("3 min late") == "delayed"
        assert _parse_status("LATE") == "delayed"

    def test_early(self):
        assert _parse_status("2 min early") == "early"
        assert _parse_status("6 min early") == "early"
        assert _parse_status("EARLY") == "early"

    def test_empty_or_none(self):
        assert _parse_status("") == "unknown"
        assert _parse_status(None) == "unknown"

    def test_unknown(self):
        assert _parse_status("something else") == "unknown"


class TestParseVehicle:
    """Tests for _parse_vehicle helper."""

    def test_full_vehicle(self):
        result = _parse_vehicle(SAMPLE_RAW_VEHICLE)
        assert result["id"] == 19037
        assert result["equipment_number"] == "4028"
        assert result["type"] == "Bus"
        assert result["lat"] == pytest.approx(35.0535, rel=1e-3)
        assert result["lng"] == pytest.approx(-89.9913, rel=1e-3)
        assert result["heading"] == 180
        assert result["route_id"] == 103147
        assert result["destination"] == "IRS"
        assert result["speed"] == 0
        assert result["status"] == "delayed"
        assert result["status_raw"] == "50 min late"
        assert result["next_stop"] == "WINCHESTER @HOLLY"
        assert result["eta_minutes"] == 0
        assert result["load"] == "4%"
        assert result["_raw"] == SAMPLE_RAW_VEHICLE

    def test_on_time_vehicle(self):
        raw = {**SAMPLE_RAW_VEHICLE}
        raw["conduite"] = {**raw["conduite"], "avanceRetard": "on time"}
        result = _parse_vehicle(raw)
        assert result["status"] == "on-time"

    def test_missing_optional_fields(self):
        minimal = {"id": 1, "localisation": {}, "conduite": {}}
        result = _parse_vehicle(minimal)
        assert result["id"] == 1
        assert result["type"] == "Bus"
        assert result["lat"] is None
        assert result["lng"] is None
        assert result["route_id"] is None
        assert result["destination"] is None
        assert result["status"] == "unknown"
        assert result["status_raw"] == ""
        assert result["next_stop"] is None
        assert result["eta_minutes"] is None


class TestFetchVehicles:
    """Tests for fetch_vehicles (with mocked HTTP)."""

    @patch("app.services.mata_client.requests.get")
    def test_returns_parsed_vehicles(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"vehicule": [SAMPLE_RAW_VEHICLE]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = fetch_vehicles(
            "https://example.com",
            "/vehicules",
            "TUFUQTowMQ==",
        )

        assert len(result) == 1
        assert result[0]["id"] == 19037
        assert result[0]["destination"] == "IRS"
        assert result[0]["status"] == "delayed"
        mock_get.assert_called_once()
        call_args = mock_get.call_args
        assert "lignes" in call_args[1]["params"]
        assert "_tmp" in call_args[1]["params"]

    @patch("app.services.mata_client.requests.get")
    def test_empty_vehicule_list(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"vehicule": []}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = fetch_vehicles("https://example.com", "/v", "x")

        assert result == []

    @patch("app.services.mata_client.requests.get")
    def test_vehicules_key_fallback(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"vehicules": [SAMPLE_RAW_VEHICLE]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = fetch_vehicles("https://example.com", "/v", "x")

        assert len(result) == 1
        assert result[0]["id"] == 19037

    @patch("app.services.mata_client.requests.get")
    def test_invalid_vehicule_format_returns_empty(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"vehicule": "not a list"}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = fetch_vehicles("https://example.com", "/v", "x")

        assert result == []

    @patch("app.services.mata_client.requests.get")
    def test_http_error_raises(self, mock_get):
        import requests as requests_module

        mock_get.side_effect = requests_module.HTTPError("500 Server Error")

        with pytest.raises(requests_module.RequestException):
            fetch_vehicles("https://example.com", "/v", "x")


class TestFetchVehiclesSafe:
    """Tests for fetch_vehicles_safe (graceful error handling)."""

    @patch("app.services.mata_client.requests.get")
    def test_success_returns_vehicles(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"vehicule": [SAMPLE_RAW_VEHICLE]}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = fetch_vehicles_safe("https://example.com", "/v", "x")

        assert len(result) == 1
        assert result[0]["id"] == 19037

    @patch("app.services.mata_client.requests.get")
    def test_connection_error_returns_empty(self, mock_get):
        import requests as requests_module

        mock_get.side_effect = requests_module.ConnectionError("Connection refused")

        result = fetch_vehicles_safe("https://example.com", "/v", "x")

        assert result == []

    @patch("app.services.mata_client.requests.get")
    def test_http_error_returns_empty(self, mock_get):
        import requests as requests_module

        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = requests_module.HTTPError("500")
        mock_get.return_value = mock_resp

        result = fetch_vehicles_safe("https://example.com", "/v", "x")

        assert result == []

    @patch("app.services.mata_client.requests.get")
    def test_invalid_json_returns_empty(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.side_effect = ValueError("Invalid JSON")
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        result = fetch_vehicles_safe("https://example.com", "/v", "x")

        assert result == []

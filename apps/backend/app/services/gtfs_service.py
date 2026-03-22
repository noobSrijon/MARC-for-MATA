import csv
import logging
import os
from collections import defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

GTFS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "GTFS")
MEMPHIS_TZ = ZoneInfo("America/Chicago")


def _read_csv(filename):
    path = os.path.join(GTFS_DIR, filename)
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


class GTFSService:
    def __init__(self):
        self._loaded = False
        self._stops = {}
        self._routes = {}
        self._trips = {}
        self._calendar = {}
        self._stop_times_by_trip = {}
        self._stop_to_trips = defaultdict(set)
        self._shapes = {}
        self._route_to_shape = {}
        self._name_to_stop_ids: dict[str, set[str]] = defaultdict(set)
        # headsign (uppercased) -> route_id, built during trip loading
        self._headsign_to_route_id: dict[str, str] = {}

    def load(self):
        if self._loaded:
            return
        logger.info("Loading GTFS data from %s", GTFS_DIR)
        self._load_routes()
        self._load_stops()
        self._load_calendar()
        self._load_trips()
        self._load_stop_times()
        self._load_shapes()
        self._loaded = True
        logger.info(
            "GTFS loaded — %d routes, %d stops, %d trips, %d shapes",
            len(self._routes), len(self._stops), len(self._trips), len(self._shapes),
        )

    def _load_routes(self):
        for row in _read_csv("routes.txt"):
            rid = row["route_id"].strip()
            self._routes[rid] = {
                "id": rid,
                "short_name": row["route_short_name"].strip(),
                "long_name": row["route_long_name"].strip(),
                "color": "#" + row.get("route_color", "0080FF").strip(),
                "text_color": "#" + row.get("route_text_color", "FFFFFF").strip(),
            }

    def _load_stops(self):
        for row in _read_csv("stops.txt"):
            sid = row["stop_id"].strip()
            try:
                lat = float(row["stop_lat"])
                lon = float(row["stop_lon"])
            except (ValueError, KeyError):
                continue
            name = row["stop_name"].strip()
            self._stops[sid] = {"id": sid, "name": name, "lat": lat, "lon": lon}
            self._name_to_stop_ids[name].add(sid)

    def _load_calendar(self):
        for row in _read_csv("calendar.txt"):
            sid = row["service_id"].strip()
            self._calendar[sid] = {
                "monday": row["monday"],
                "tuesday": row["tuesday"],
                "wednesday": row["wednesday"],
                "thursday": row["thursday"],
                "friday": row["friday"],
                "saturday": row["saturday"],
                "sunday": row["sunday"],
                "start_date": row["start_date"].strip(),
                "end_date": row["end_date"].strip(),
            }

    def _load_trips(self):
        for row in _read_csv("trips.txt"):
            tid = row["trip_id"].strip()
            rid = row["route_id"].strip()
            shape_id = row.get("shape_id", "").strip()
            self._trips[tid] = {
                "trip_id": tid,
                "route_id": rid,
                "service_id": row.get("service_id", "").strip(),
                "headsign": row.get("trip_headsign", "").strip(),
                "direction_id": row.get("direction_id", "0").strip(),
                "shape_id": shape_id,
            }
            if shape_id and rid not in self._route_to_shape:
                self._route_to_shape[rid] = shape_id

            headsign = row.get("trip_headsign", "").strip().upper()
            if headsign and headsign not in self._headsign_to_route_id:
                self._headsign_to_route_id[headsign] = rid

    def _load_stop_times(self):
        rows_by_trip = defaultdict(list)
        for row in _read_csv("stop_times.txt"):
            tid = row["trip_id"].strip()
            sid = row["stop_id"].strip()
            try:
                seq = int(row["stop_sequence"])
            except (ValueError, KeyError):
                seq = 0
            rows_by_trip[tid].append({"stop_id": sid, "stop_sequence": seq})
            self._stop_to_trips[sid].add(tid)

        for tid, entries in rows_by_trip.items():
            self._stop_times_by_trip[tid] = sorted(entries, key=lambda e: e["stop_sequence"])

    def _load_shapes(self):
        points_by_shape = defaultdict(list)
        for row in _read_csv("shapes.txt"):
            shape_id = row["shape_id"].strip()
            try:
                lat = float(row["shape_pt_lat"])
                lon = float(row["shape_pt_lon"])
                seq = int(row["shape_pt_sequence"])
            except (ValueError, KeyError):
                continue
            points_by_shape[shape_id].append((seq, lat, lon))

        for shape_id, pts in points_by_shape.items():
            self._shapes[shape_id] = [[lat, lon] for _, lat, lon in sorted(pts)]

    def _active_service_ids(self):
        today = datetime.now(MEMPHIS_TZ).date()
        today_str = today.strftime("%Y%m%d")
        day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        today_col = day_names[today.weekday()]

        active = set()
        for sid, cal in self._calendar.items():
            if cal["start_date"] <= today_str <= cal["end_date"] and cal[today_col] == "1":
                active.add(sid)
        return active

    def _expand_stop_ids(self, stop_id: str) -> set[str]:
        stop = self._stops.get(stop_id)
        if not stop:
            return {stop_id}
        return self._name_to_stop_ids.get(stop["name"], {stop_id})

    def _make_route_entry(self, route, headsigns, shape_id):
        return {
            **route,
            "headsigns": sorted(headsigns),
            "shape_id": shape_id or self._route_to_shape.get(route["id"], ""),
        }

    def route_terminals(self, route_id: str) -> tuple[str | None, str | None]:
        """Return (first_stop_name, last_stop_name) for a route."""
        stops = self.get_route_stops(route_id)
        if not stops:
            return None, None
        return stops[0]["name"], stops[-1]["name"]

    def route_for_destination(self, destination: str) -> dict | None:
        if not destination:
            return None
        rid = self._headsign_to_route_id.get(destination.strip().upper())
        return self._routes.get(rid) if rid else None

    def get_stops(self):
        return sorted(self._stops.values(), key=lambda s: s["name"])

    def get_routes(self):
        return sorted(self._routes.values(), key=lambda r: r["short_name"])

    def get_shape(self, shape_id):
        return self._shapes.get(shape_id, [])

    def get_route_stops(self, route_id):
        active = self._active_service_ids()

        # Prefer a trip that runs today; fall back to any trip for this route
        best_trip = None
        for trip_id, trip in self._trips.items():
            if trip["route_id"] != route_id:
                continue
            if trip["service_id"] in active:
                best_trip = trip_id
                break

        if not best_trip:
            for trip_id, trip in self._trips.items():
                if trip["route_id"] == route_id:
                    best_trip = trip_id
                    break

        if not best_trip:
            return []

        stops = []
        for entry in self._stop_times_by_trip.get(best_trip, []):
            stop = self._stops.get(entry["stop_id"])
            if stop:
                stops.append(stop)
        return stops

    def plan_trip(self, from_stop_id, to_stop_id):
        active = self._active_service_ids()

        direct = self._find_direct(from_stop_id, to_stop_id, active)
        if direct:
            return {"type": "direct", "direct": direct, "transfers": []}

        reverse = self._find_direct(to_stop_id, from_stop_id, active)
        if reverse:
            return {
                "type": "wrong_direction",
                "message": "Buses on these routes run in the opposite direction for that journey.",
                "direct": reverse,
                "transfers": [],
            }

        transfers = self._find_transfers(from_stop_id, to_stop_id, active)
        if transfers:
            return {"type": "transfer", "direct": [], "transfers": transfers}

        return {"type": "none", "message": "No routes found between these stops.", "direct": [], "transfers": []}

    def _find_direct(self, from_stop_id, to_stop_id, active_services):
        from_ids = self._expand_stop_ids(from_stop_id)
        to_ids = self._expand_stop_ids(to_stop_id)
        found = {}

        for trip_id, trip in self._trips.items():
            if trip["service_id"] not in active_services:
                continue

            stops = self._stop_times_by_trip.get(trip_id, [])
            stop_positions = {entry["stop_id"]: i for i, entry in enumerate(stops)}

            from_positions = [stop_positions[sid] for sid in from_ids if sid in stop_positions]
            to_positions = [stop_positions[sid] for sid in to_ids if sid in stop_positions]

            if not from_positions or not to_positions:
                continue
            if min(from_positions) >= min(to_positions):
                continue

            route_id = trip["route_id"]
            route = self._routes.get(route_id)
            if not route:
                continue

            if route_id not in found:
                found[route_id] = {"route": route, "headsigns": set(), "shape_id": trip["shape_id"]}
            found[route_id]["headsigns"].add(trip["headsign"])

        result = []
        for entry in found.values():
            result.append(self._make_route_entry(entry["route"], entry["headsigns"], entry["shape_id"]))

        return sorted(result, key=lambda r: r["short_name"])

    def _find_transfers(self, from_stop_id, to_stop_id, active_services):
        from_ids = self._expand_stop_ids(from_stop_id)
        to_ids = self._expand_stop_ids(to_stop_id)

        reachable_via = defaultdict(set)
        leads_to_via = defaultdict(set)

        for trip_id, trip in self._trips.items():
            if trip["service_id"] not in active_services:
                continue

            stops = self._stop_times_by_trip.get(trip_id, [])
            stop_ids = [e["stop_id"] for e in stops]
            route_id = trip["route_id"]

            matched_from = next((stop_ids.index(sid) for sid in from_ids if sid in stop_ids), None)
            matched_to = next((stop_ids.index(sid) for sid in to_ids if sid in stop_ids), None)

            if matched_from is not None:
                for stop_id in stop_ids[matched_from + 1:]:
                    reachable_via[stop_id].add(route_id)

            if matched_to is not None:
                for stop_id in stop_ids[:matched_to]:
                    leads_to_via[stop_id].add(route_id)

        transfer_stops = set(reachable_via.keys()) & set(leads_to_via.keys())

        options = []
        seen = set()

        for transfer_stop_id in transfer_stops:
            stop = self._stops.get(transfer_stop_id)
            if not stop:
                continue

            for r1_id in reachable_via[transfer_stop_id]:
                for r2_id in leads_to_via[transfer_stop_id]:
                    if r1_id == r2_id:
                        continue
                    key = (r1_id, transfer_stop_id, r2_id)
                    if key in seen:
                        continue
                    seen.add(key)

                    r1 = self._routes.get(r1_id)
                    r2 = self._routes.get(r2_id)
                    if r1 and r2:
                        options.append({
                            "leg1": {**r1, "shape_id": self._route_to_shape.get(r1_id, "")},
                            "transfer_stop": stop,
                            "leg2": {**r2, "shape_id": self._route_to_shape.get(r2_id, "")},
                        })

        options.sort(key=lambda o: (o["leg1"]["short_name"], o["leg2"]["short_name"]))
        return options[:15]


gtfs = GTFSService()

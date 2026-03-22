"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as LMap, Marker, Polyline, CircleMarker } from "leaflet";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface Vehicle {
  id: number;
  equipment_number: string;
  type: string;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  route_id: number | null;
  route_short_name: string | null;
  route_long_name: string | null;
  route_color: string | null;
  terminal_start: string | null;
  terminal_end: string | null;
  destination: string | null;
  speed: number | null;
  status: string;
  status_raw: string;
  next_stop: string | null;
  eta_minutes: number | null;
  load: string | null;
}

interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface RouteResult {
  id: string;
  short_name: string;
  long_name: string;
  color: string;
  text_color: string;
  headsigns?: string[];
  shape_id: string;
}

interface ReportBusInfo {
  id: number;
  equipmentNumber: string;
  routeShortName: string | null;
  routeLongName: string | null;
  routeColor: string | null;
}

interface MapViewProps {
  fromStop: Stop | null;
  toStop: Stop | null;
  routeResults: RouteResult[];
  selectedRouteId: string | null;
  onRouteSelect: (routeId: string) => void;
  onReportIssue: (bus: ReportBusInfo) => void;
  userLocation?: { lat: number; lon: number } | null;
}

function statusColor(status: string): string {
  if (status === "on-time") return "#0959b6";
  if (status === "delayed") return "#dc2626";
  if (status === "early") return "#16a34a";
  return "#555";
}

// Clean SVG bus icon — Material Design "directions_bus" path
const BUS_SVG_PATH =
  "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z";


function stopDotHtml(color: string) {
  return `
    <div style="
      width:8px;height:8px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
    "></div>`;
}

function terminalPinHtml(color: string, label: string, stopName: string) {
  return `
    <div style="
      display:flex;flex-direction:column;align-items:center;
      font-family:Inter,sans-serif;
    ">
      <div style="
        background:${color};color:#fff;
        padding:4px 8px;border-radius:8px;
        font-size:10px;font-weight:700;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        border:2px solid #fff;
        max-width:140px;overflow:hidden;text-overflow:ellipsis;
        display:flex;align-items:center;gap:5px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#fff">
          <path d="${label === "START"
            ? "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            : "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"
          }"/>
        </svg>
        <span>${label}</span>
        <span style="opacity:0.85;font-weight:400;max-width:100px;overflow:hidden;text-overflow:ellipsis">${stopName}</span>
      </div>
      <div style="
        width:2px;height:8px;background:${color};opacity:0.7;
      "></div>
      <div style="
        width:8px;height:8px;border-radius:50%;
        background:${color};border:2px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);
      "></div>
    </div>`;
}

export default function MapView({
  fromStop,
  toStop,
  routeResults,
  selectedRouteId,
  onRouteSelect,
  onReportIssue,
  userLocation,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const vehicleMarkersRef = useRef<Map<number, Marker>>(new Map());
  const routePolylinesRef = useRef<Map<string, Polyline>>(new Map());
  const routeStopMarkersRef = useRef<CircleMarker[]>([]);
  const fromMarkerRef = useRef<CircleMarker | null>(null);
  const toMarkerRef = useRef<CircleMarker | null>(null);
  const userLocationMarkerRef = useRef<Marker | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const onReportIssueRef = useRef(onReportIssue);
  onReportIssueRef.current = onReportIssue;

  // Init Leaflet map once
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
      if (mapRef.current || !mapContainerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current, {
        center: [35.1495, -90.049],
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Inject pulse animation once
      if (!document.getElementById("marc-pulse-style")) {
        const style = document.createElement("style");
        style.id = "marc-pulse-style";
        style.textContent = `
          @keyframes pulse-ring {
            0%   { transform: scale(1);   opacity: 0.55; }
            100% { transform: scale(1.7); opacity: 0; }
          }`;
        document.head.appendChild(style);
      }
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Keep vehiclesRef in sync for event delegation lookups
  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  // Report-issue button delegation: clicks on [data-report-bus-id] inside popups
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    function handleClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-report-bus-id]");
      if (!btn) return;
      const busId = Number(btn.dataset.reportBusId);
      const v = vehiclesRef.current.find((veh) => veh.id === busId);
      if (!v) return;
      mapRef.current?.closePopup();
      onReportIssueRef.current({
        id: v.id,
        equipmentNumber: v.equipment_number ?? String(v.id),
        routeShortName: v.route_short_name,
        routeLongName: v.route_long_name,
        routeColor: v.route_color,
      });
    }

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  // Fetch live vehicles every 15 s
  const refreshVehicles = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/vehicles`);
      if (!res.ok) return;
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshVehicles();
    const interval = setInterval(refreshVehicles, 15_000);
    return () => clearInterval(interval);
  }, [refreshVehicles]);

  // Update live bus markers
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current!;
      const existing = vehicleMarkersRef.current;
      const seen = new Set<number>();

      // Short names of direct-result routes so we can highlight matching buses
      const directRouteNames = new Set(
        routeResults.map((r) => r.short_name).filter(Boolean)
      );

      for (const v of vehicles) {
        if (v.lat == null || v.lng == null) continue;
        seen.add(v.id);

        const markerColor = statusColor(v.status);
        const routeLabel = v.route_short_name ? `Route ${v.route_short_name}` : v.destination ?? "Bus";
        const routeName = v.route_long_name ?? v.destination ?? "";
        const isOnDirectRoute = v.route_short_name != null && directRouteNames.has(v.route_short_name);

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:30px;height:30px">
              ${isOnDirectRoute ? `
                <div style="
                  position:absolute;inset:-5px;border-radius:50%;
                  border:2.5px solid ${markerColor};
                  opacity:0.6;
                  animation:pulse-ring 1.4s ease-out infinite;
                "></div>` : ""}
              <div style="
                width:30px;height:30px;border-radius:50%;
                background:${markerColor};
                display:flex;align-items:center;justify-content:center;
                border:${isOnDirectRoute ? "3px" : "2.5px"} solid #fff;
                box-shadow:0 2px ${isOnDirectRoute ? "12px" : "8px"} rgba(0,0,0,${isOnDirectRoute ? "0.45" : "0.35"});
                cursor:pointer;position:relative;z-index:1;
              ">
                <span style="color:#fff;font-family:Inter,sans-serif;font-size:${v.route_short_name && v.route_short_name.length > 2 ? "8" : "10"}px;font-weight:700;line-height:1;letter-spacing:-0.3px">${v.route_short_name ?? "?"}</span>
              </div>
              ${isOnDirectRoute ? `
                <div style="
                  position:absolute;top:-5px;right:-5px;
                  width:14px;height:14px;border-radius:50%;
                  background:#22c55e;border:2px solid #fff;
                  display:flex;align-items:center;justify-content:center;
                  z-index:2;box-shadow:0 1px 4px rgba(0,0,0,0.3);
                ">
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="#fff">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>` : ""}
            </div>`,
          iconAnchor: [15, 15],
          iconSize: [30, 30],
        });

        const popup = `
          <div style="font-family:Inter,sans-serif;font-size:12px;min-width:190px;line-height:1.6">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #eee">
              <div style="width:36px;height:36px;border-radius:10px;background:${markerColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative">
                ${v.route_short_name
                  ? `<span style="font-weight:900;font-size:${v.route_short_name.length > 2 ? "11" : "14"}px;color:#fff">${v.route_short_name}</span>`
                  : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="${BUS_SVG_PATH}"/></svg>`}
                ${isOnDirectRoute ? `<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff"></div>` : ""}
              </div>
              <div style="min-width:0">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span style="font-weight:700;font-size:13px;white-space:nowrap">${routeLabel}</span>
                  <span style="font-size:11px;color:#888;white-space:nowrap">· Bus #${v.equipment_number ?? v.id}</span>
                </div>
                ${routeName ? `<div style="color:#666;font-size:11px;overflow:hidden;text-overflow:ellipsis;max-width:140px;white-space:nowrap">${routeName}</div>` : ""}
                ${isOnDirectRoute ? `<div style="font-size:10px;color:#16a34a;font-weight:600">● On your route</div>` : ""}
              </div>
            </div>
            ${(v.terminal_start || v.terminal_end) ? `
            <div style="display:flex;flex-direction:column;gap:3px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #eee">
              ${v.terminal_start ? `
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:8px;height:8px;border-radius:50%;background:#16a34a;flex-shrink:0"></div>
                <div>
                  <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.05em">Start</div>
                  <div style="font-size:11px;font-weight:600;color:#111">${v.terminal_start}</div>
                </div>
              </div>` : ""}
              ${v.terminal_end ? `
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:8px;height:8px;border-radius:50%;background:#dc2626;flex-shrink:0"></div>
                <div>
                  <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:.05em">End</div>
                  <div style="font-size:11px;font-weight:600;color:#111">${v.terminal_end}</div>
                </div>
              </div>` : ""}
            </div>` : ""}
            ${v.next_stop ? `<div style="margin-bottom:4px"><span style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Next stop</span><br><b>${v.next_stop}</b>${v.eta_minutes != null ? ` <span style="color:#888">· ${v.eta_minutes} min</span>` : ""}</div>` : ""}
            <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px">
              <span style="font-size:11px;font-weight:700;color:${markerColor};background:${markerColor}18;padding:2px 8px;border-radius:99px">${v.status_raw || v.status}</span>
              ${v.speed != null ? `<span style="font-size:11px;color:#888">${v.speed} mph</span>` : ""}
              ${v.load ? `<span style="font-size:11px;color:#888">${v.load}</span>` : ""}
            </div>
            <button
              data-report-bus-id="${v.id}"
              style="
                margin-top:10px;width:100%;
                display:flex;align-items:center;justify-content:center;gap:6px;
                padding:8px 0;border-radius:10px;border:none;
                background:#ab2d00;color:#fff;
                font-family:Inter,sans-serif;font-size:12px;font-weight:700;
                cursor:pointer;transition:opacity 0.15s;
              "
              onmouseover="this.style.opacity='0.85'"
              onmouseout="this.style.opacity='1'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              Report Issue
            </button>
          </div>`;

        if (existing.has(v.id)) {
          existing.get(v.id)!.setLatLng([v.lat, v.lng]).setIcon(icon).getPopup()?.setContent(popup);
        } else {
          existing.set(v.id, L.marker([v.lat, v.lng], { icon }).addTo(map).bindPopup(popup));
        }
      }

      for (const [id, marker] of existing.entries()) {
        if (!seen.has(id)) { marker.remove(); existing.delete(id); }
      }
    });
  }, [vehicles, routeResults]);

  // Draw route polylines whenever routeResults changes
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then(async (L) => {
      const map = mapRef.current!;

      for (const pl of routePolylinesRef.current.values()) pl.remove();
      routePolylinesRef.current.clear();

      for (const route of routeResults) {
        if (!route.shape_id) continue;
        try {
          const res = await fetch(`${API}/api/shapes/${encodeURIComponent(route.shape_id)}`);
          if (!res.ok) continue;
          const data = await res.json();
          const points: [number, number][] = data.points ?? [];
          if (!points.length) continue;

          const isSelected = route.id === selectedRouteId;
          const pl = L.polyline(points, {
            color: route.color ?? "#0959b6",
            weight: isSelected ? 6 : 3,
            opacity: isSelected ? 1 : 0.5,
          })
            .addTo(map)
            .on("click", () => onRouteSelect(route.id))
            .bindTooltip(`Route ${route.short_name} – ${route.long_name}`, { sticky: true });

          routePolylinesRef.current.set(route.id, pl);
        } catch { /* skip */ }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeResults]);

  // Restyle polylines when selection changes
  useEffect(() => {
    for (const [id, pl] of routePolylinesRef.current.entries()) {
      const selected = id === selectedRouteId;
      pl.setStyle({ weight: selected ? 6 : 3, opacity: selected ? 1 : 0.5 });
      if (selected) pl.bringToFront();
    }
  }, [selectedRouteId]);

  // Fetch and render all stops for the selected route
  useEffect(() => {
    // Clear previous stop markers
    for (const m of routeStopMarkersRef.current) m.remove();
    routeStopMarkersRef.current = [];

    if (!selectedRouteId || !mapRef.current) return;

    const route = routeResults.find((r) => r.id === selectedRouteId);
    const routeColor = route?.color ?? "#0959b6";

    import("leaflet").then(async (L) => {
      const map = mapRef.current!;
      if (!map) return;

      try {
        const res = await fetch(`${API}/api/routes/${encodeURIComponent(selectedRouteId)}/stops`);
        if (!res.ok) return;
        const data = await res.json();
        const stops: Stop[] = data.stops ?? [];
        if (!stops.length) return;

        const markers: CircleMarker[] = [];

        stops.forEach((stop, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === stops.length - 1;
          const isEndpoint = isFirst || isLast;

          let markerIcon: ReturnType<typeof L.divIcon>;

          if (isEndpoint) {
            const label = isFirst ? "START" : "END";
            markerIcon = L.divIcon({
              className: "",
              html: terminalPinHtml(routeColor, label, stop.name),
              iconAnchor: [0, 26],
            });
          } else {
            markerIcon = L.divIcon({
              className: "",
              html: stopDotHtml(routeColor),
              iconAnchor: [4, 4],
            });
          }

          const marker = L.marker([stop.lat, stop.lon], {
            icon: markerIcon,
            zIndexOffset: isEndpoint ? 500 : -100,
          })
            .addTo(map)
            .bindTooltip(stop.name, { direction: "top", offset: [0, -8] });

          if (isEndpoint) {
            marker.bindPopup(
              `<div style="font-family:Inter,sans-serif;font-size:12px;line-height:1.5">
                <b style="color:${routeColor}">${isFirst ? "Start Terminal" : "End Terminal"}</b><br>
                ${stop.name}
              </div>`
            );
          }

          markers.push(marker as unknown as CircleMarker);
        });

        routeStopMarkersRef.current = markers;
      } catch { /* ignore */ }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteId]);

  // Draw from/to markers and fit map
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current!;

      fromMarkerRef.current?.remove();
      fromMarkerRef.current = null;
      if (fromStop) {
        fromMarkerRef.current = L.circleMarker([fromStop.lat, fromStop.lon], {
          radius: 9, color: "#fff", weight: 2.5, fillColor: "#0959b6", fillOpacity: 1,
        }).addTo(map).bindPopup(`<b>FROM</b><br>${fromStop.name}`);
      }

      toMarkerRef.current?.remove();
      toMarkerRef.current = null;
      if (toStop) {
        toMarkerRef.current = L.circleMarker([toStop.lat, toStop.lon], {
          radius: 9, color: "#fff", weight: 2.5, fillColor: "#ab2d00", fillOpacity: 1,
        }).addTo(map).bindPopup(`<b>TO</b><br>${toStop.name}`);
      }

      if (fromStop && toStop) {
        map.fitBounds([[fromStop.lat, fromStop.lon], [toStop.lat, toStop.lon]], { padding: [60, 60] });
      } else if (fromStop) {
        map.setView([fromStop.lat, fromStop.lon], 14);
      } else if (toStop) {
        map.setView([toStop.lat, toStop.lon], 14);
      }
    });
  }, [fromStop, toStop]);

  // Draw user location dot
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      userLocationMarkerRef.current?.remove();
      userLocationMarkerRef.current = null;
      if (!userLocation) return;
      const icon = L.divIcon({
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: `<div style="width:20px;height:20px;position:relative;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:20px;height:20px;border-radius:50%;background:rgba(9,89,182,0.25);animation:pulse-ring 1.4s ease-out infinite;"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#0959b6;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
        </div>`,
      });
      userLocationMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon })
        .addTo(mapRef.current!)
        .bindTooltip("Your location", { direction: "top", offset: [0, -10] });
    });
  }, [userLocation]);

  const handleCenter = useCallback(() => mapRef.current?.setView([35.1495, -90.049], 12), []);
  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  return (
    <div className="flex-1 relative">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapContainerRef} className="absolute inset-0" />

      {vehicles.length > 0 && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm shadow-sm rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-primary">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {vehicles.length} buses live
        </div>
      )}

      <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
        <button onClick={handleCenter} className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-95" title="Center">
          <span className="material-symbols-outlined text-[18px]">my_location</span>
        </button>
        <button onClick={handleZoomIn} className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-95">
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <button onClick={handleZoomOut} className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-95">
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
      </div>
    </div>
  );
}

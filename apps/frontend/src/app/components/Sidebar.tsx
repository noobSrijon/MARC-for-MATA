"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface Vehicle {
  id: number;
  route_short_name: string | null;
}

interface Stop {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface Route {
  id: string;
  short_name: string;
  long_name: string;
  color: string;
  text_color: string;
  headsigns?: string[];
  shape_id: string;
}

interface TransferOption {
  leg1: Route;
  transfer_stop: Stop;
  leg2: Route;
}

interface PlanResult {
  type: "direct" | "transfer" | "wrong_direction" | "none";
  message?: string;
  direct: Route[];
  transfers: TransferOption[];
}

interface Report {
  id: string;
  busId: number;
  equipmentNumber: string;
  routeShortName: string | null;
  routeLongName: string | null;
  issueType: string;
  issueIcon: string;
  description: string;
  imageUrls: string[];
  timestamp: number;
  likes?: number;
  dislikes?: number;
}

interface SidebarProps {
  onFromStop: (stop: Stop | null) => void;
  onToStop: (stop: Stop | null) => void;
  onPlanResult: (result: PlanResult | null) => void;
  onRouteSelect: (routeId: string) => void;
  selectedRouteId: string | null;
  planResult: PlanResult | null;
}

function formatTimeAgo(timestamp: number): string {
  // Normalise: if timestamp looks like seconds (< year 2100 in ms), convert to ms
  const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const diff = Date.now() - ts;
  if (diff < 0) return "Just now";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function RouteBadge({ route }: { route: Route }) {
  return (
    <span
      className="text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0"
      style={{ backgroundColor: route.color ?? "#0959b6", color: route.text_color ?? "#fff" }}
    >
      {route.short_name}
    </span>
  );
}

function StopSearch({
  label,
  placeholder,
  allStops,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  allStops: Stop[];
  value: Stop | null;
  onChange: (stop: Stop | null) => void;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<Stop[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value ? value.name : "");
  }, [value]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || (value && value.name === query)) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const results = allStops.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 50);
    setFiltered(results);
    setOpen(results.length > 0);
  }, [query, allStops, value]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function select(stop: Stop) {
    onChange(stop);
    setQuery(stop.name);
    setOpen(false);
    setFiltered([]);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setFiltered([]);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-0.5">
        {label}
      </p>
      <div className="relative flex items-center">
        <input
          className="w-full text-xs bg-surface-container-low rounded-md px-2 py-1.5 pr-6 outline-none placeholder:text-on-surface-variant/40 text-on-surface font-medium focus:ring-1 focus:ring-primary"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (filtered.length > 0) setOpen(true); }}
        />
        {value && (
          <button onClick={clear} className="absolute right-1.5 text-on-surface-variant/50 hover:text-on-surface">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-surface-container max-h-48 overflow-y-auto">
          {filtered.map((stop) => (
            <button
              key={stop.id}
              className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-primary/10 transition-colors border-b border-surface-container/50 last:border-0"
              onMouseDown={() => select(stop)}
            >
              <span className="font-semibold">{stop.name}</span>
              <span className="text-on-surface-variant ml-1 text-[10px]">({stop.id.replace("0:", "")})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  voted,
  onVote,
}: {
  report: Report;
  voted?: "like" | "dislike";
  onVote: (id: string, vote: "like" | "dislike") => void;
}) {
  const images = report.imageUrls ?? [];
  return (
    <div className="bg-white rounded-xl border border-surface-container p-2.5">
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5 shrink-0">
          {report.issueIcon || "flag"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-on-surface truncate">{report.issueType}</p>
            <p className="text-[9px] text-on-surface-variant/50 shrink-0">{formatTimeAgo(report.timestamp)}</p>
          </div>
          {report.description && (
            <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">{report.description}</p>
          )}
          <p className="text-[9px] text-on-surface-variant/40 mt-1">Bus #{report.equipmentNumber}</p>
        </div>
      </div>

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Report image ${i + 1}`}
                className="w-14 h-14 rounded-lg object-cover border border-surface-container hover:opacity-80 transition-opacity"
              />
            </a>
          ))}
        </div>
      )}

      {/* Like / Dislike */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-container">
        <button
          onClick={() => onVote(report.id, "like")}
          disabled={!!voted}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
            voted === "like"
              ? "bg-green-100 text-green-700"
              : voted
              ? "opacity-40 cursor-not-allowed text-on-surface-variant"
              : "hover:bg-green-50 text-on-surface-variant hover:text-green-700"
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">thumb_up</span>
          {report.likes ?? 0}
        </button>
        <button
          onClick={() => onVote(report.id, "dislike")}
          disabled={!!voted}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
            voted === "dislike"
              ? "bg-red-100 text-red-700"
              : voted
              ? "opacity-40 cursor-not-allowed text-on-surface-variant"
              : "hover:bg-red-50 text-on-surface-variant hover:text-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-[13px]">thumb_down</span>
          {report.dislikes ?? 0}
        </button>
        <span className="text-[9px] text-on-surface-variant/40 ml-auto">Was this helpful?</span>
      </div>
    </div>
  );
}

export default function Sidebar({
  onFromStop,
  onToStop,
  onPlanResult,
  onRouteSelect,
  selectedRouteId,
  planResult,
}: SidebarProps) {
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [loadingStops, setLoadingStops] = useState(true);
  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop, setToStop] = useState<Stop | null>(null);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveShortNames, setLiveShortNames] = useState<Set<string>>(new Set());
  const [nextDepartures, setNextDepartures] = useState<Record<string, { departures: string[]; next_service: string | null }>>({});

  // Reports state
  const [routeReports, setRouteReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [votedReports, setVotedReports] = useState<Record<string, "like" | "dislike">>({});
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [loadingAiNote, setLoadingAiNote] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/stops`)
      .then((r) => r.json())
      .then((data) => { setAllStops(data.stops ?? []); setLoadingStops(false); })
      .catch(() => setLoadingStops(false));
  }, []);

  // Poll live vehicles every 15s to detect which routes have a bus right now
  useEffect(() => {
    function fetchVehicles() {
      fetch(`${API}/api/vehicles`)
        .then((r) => r.json())
        .then((data: { vehicles: Vehicle[] }) => {
          const names = new Set<string>();
          for (const v of data.vehicles ?? []) {
            if (v.route_short_name) names.add(v.route_short_name);
          }
          setLiveShortNames(names);
        })
        .catch(() => {});
    }
    fetchVehicles();
    const id = setInterval(fetchVehicles, 15_000);
    return () => clearInterval(id);
  }, []);

  // Fetch next scheduled departures for all direct routes whenever they change
  const directRoutes = planResult?.direct ?? [];
  useEffect(() => {
    if (!fromStop || directRoutes.length === 0) { setNextDepartures({}); return; }
    const results: Record<string, { departures: string[]; next_service: string | null }> = {};
    Promise.all(
      directRoutes.map((route) =>
        fetch(`${API}/api/next_departures?route_id=${encodeURIComponent(route.id)}&from_stop=${encodeURIComponent(fromStop.id)}`)
          .then((r) => r.json())
          .then((data: { departures: string[]; next_service: string | null }) => {
            results[route.id] = { departures: data.departures ?? [], next_service: data.next_service ?? null };
          })
          .catch(() => { results[route.id] = { departures: [], next_service: null }; })
      )
    ).then(() => setNextDepartures({ ...results }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planResult, fromStop]);

  // Get selected direct route object
  const selectedRoute = planResult?.type === "direct"
    ? directRoutes.find((r) => r.id === selectedRouteId) ?? null
    : null;

  // Fetch reports for the selected direct route
  useEffect(() => {
    if (!selectedRoute) {
      setRouteReports([]);
      setAiNote(null);
      return;
    }
    setLoadingReports(true);
    setVotedReports({});
    fetch(`${API}/api/reports?route_short_name=${encodeURIComponent(selectedRoute.short_name)}`)
      .then((r) => r.json())
      .then((data) => {
        setRouteReports(data.reports ?? []);
        setLoadingReports(false);
      })
      .catch(() => setLoadingReports(false));
  }, [selectedRouteId, planResult?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch AI note once reports are loaded (only if there are reports)
  useEffect(() => {
    if (!selectedRoute || routeReports.length === 0) {
      setAiNote(null);
      return;
    }
    setLoadingAiNote(true);
    fetch(`${API}/api/reports/ai-note?route_short_name=${encodeURIComponent(selectedRoute.short_name)}`)
      .then((r) => r.json())
      .then((data) => {
        setAiNote(data.note ?? null);
        setLoadingAiNote(false);
      })
      .catch(() => setLoadingAiNote(false));
  }, [routeReports]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleVote(reportId: string, vote: "like" | "dislike") {
    if (votedReports[reportId]) return;
    try {
      const res = await fetch(`${API}/api/reports/${reportId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      const data = await res.json();
      if (data.ok) {
        setVotedReports((prev) => ({ ...prev, [reportId]: vote }));
        setRouteReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, likes: data.likes, dislikes: data.dislikes } : r
          )
        );
      }
    } catch { /* ignore */ }
  }

  const handleFromStop = useCallback((stop: Stop | null) => {
    setFromStop(stop);
    onFromStop(stop);
    setError(null);
    onPlanResult(null);
  }, [onFromStop, onPlanResult]);

  const handleToStop = useCallback((stop: Stop | null) => {
    setToStop(stop);
    onToStop(stop);
    setError(null);
    onPlanResult(null);
  }, [onToStop, onPlanResult]);

  async function planTrip() {
    if (!fromStop || !toStop) return;
    setPlanning(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/plan?from_stop=${encodeURIComponent(fromStop.id)}&to_stop=${encodeURIComponent(toStop.id)}`);
      const data: PlanResult = await res.json();
      onPlanResult(data);
      if (data.type === "direct" && data.direct.length > 0) onRouteSelect(data.direct[0].id);
      else if (data.type === "transfer" && data.transfers.length > 0) onRouteSelect(data.transfers[0].leg1.id);
    } catch {
      setError("Could not connect to the backend. Is the server running?");
    } finally {
      setPlanning(false);
    }
  }

  const canPlan = fromStop && toStop && fromStop.id !== toStop.id;

  const transfers = planResult?.transfers ?? [];

  return (
    <aside className="hidden md:flex w-[280px] bg-surface-container-lowest border-l border-surface-container flex-col shrink-0">
      <div className="p-4 flex flex-col h-full gap-4 overflow-hidden">

        {/* Trip planner inputs */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5">
            Plan a Trip
          </p>

          <div className="bg-white rounded-2xl shadow-sm px-3 py-2.5 flex gap-2.5">
            <div className="flex flex-col items-center pt-1 shrink-0">
              <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
              <div className="flex-1 w-px my-1 border-l-2 border-dashed border-on-surface-variant/20" />
              <div className="w-2 h-2 rounded-full bg-tertiary ring-2 ring-tertiary/20" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <StopSearch
                label="From"
                placeholder={loadingStops ? "Loading stops…" : "Search stop"}
                allStops={allStops}
                value={fromStop}
                onChange={handleFromStop}
              />
              <StopSearch
                label="To"
                placeholder={loadingStops ? "Loading stops…" : "Search destination"}
                allStops={allStops}
                value={toStop}
                onChange={handleToStop}
              />
            </div>
          </div>

          <button
            onClick={planTrip}
            disabled={!canPlan || planning}
            className="w-full mt-2.5 bg-primary text-on-primary hover:bg-primary-dim h-8 rounded-xl gap-1.5 text-xs font-semibold flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {planning ? (
              <><span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>Searching…</>
            ) : (
              <><span className="material-symbols-outlined text-[14px]">directions</span>Get Directions</>
            )}
          </button>

          {error && (
            <p className="mt-2 text-[11px] text-tertiary font-medium bg-tertiary/10 rounded-lg px-2.5 py-1.5">
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        {planResult && (
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">

            {/* Not possible */}
            {planResult.type === "none" && (
              <div className="flex flex-col items-center text-center gap-2 py-6 px-2">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant/30">do_not_disturb</span>
                <p className="text-xs font-semibold text-on-surface-variant">No routes available</p>
                <p className="text-[10px] text-on-surface-variant/60">
                  These two stops can&apos;t be connected by any single bus or one-transfer journey on today&apos;s schedule.
                </p>
              </div>
            )}

            {/* Wrong direction */}
            {planResult.type === "wrong_direction" && (
              <>
                <div className="bg-secondary/10 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-secondary mb-1">Opposite direction</p>
                  <p className="text-[10px] text-on-surface-variant">
                    These routes serve that corridor but run in the other direction. You may need to travel to a different stop.
                  </p>
                </div>
                <RouteList routes={directRoutes} selectedRouteId={selectedRouteId} onSelect={onRouteSelect} liveShortNames={liveShortNames} nextDepartures={nextDepartures} />
              </>
            )}

            {/* Direct routes */}
            {planResult.type === "direct" && directRoutes.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-on-surface">Direct Routes</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {directRoutes.length} route{directRoutes.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* AI Accessibility Note — above the route list */}
                {selectedRoute && (loadingAiNote || aiNote) && (
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">accessible</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        AI Accessibility Note
                      </p>
                    </div>
                    {loadingAiNote ? (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] animate-spin text-primary/50">progress_activity</span>
                        <p className="text-[10px] text-on-surface-variant/60">Analyzing ramp accessibility…</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">{aiNote}</p>
                    )}
                  </div>
                )}

                <RouteList routes={directRoutes} selectedRouteId={selectedRouteId} onSelect={onRouteSelect} liveShortNames={liveShortNames} nextDepartures={nextDepartures} />

                {/* Reports panel — shown when a route is selected */}
                {selectedRoute && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">flag</span>
                      <h3 className="text-xs font-bold text-on-surface flex-1">Route Reports</h3>
                      {routeReports.length > 0 && (
                        <span className="text-[10px] font-bold bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded-full">
                          {routeReports.length}
                        </span>
                      )}
                    </div>

                    {loadingReports ? (
                      <div className="flex items-center justify-center py-4">
                        <span className="material-symbols-outlined text-[20px] animate-spin text-on-surface-variant/40">progress_activity</span>
                      </div>
                    ) : routeReports.length === 0 ? (
                      <p className="text-[10px] text-on-surface-variant/50 text-center py-3 bg-surface-container/50 rounded-xl">
                        No reports for Route {selectedRoute.short_name} yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {routeReports.map((report) => (
                          <ReportCard
                            key={report.id}
                            report={report}
                            voted={votedReports[report.id]}
                            onVote={handleVote}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Transfer options */}
            {planResult.type === "transfer" && transfers.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-on-surface">Transfer Options</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                    1 transfer
                  </span>
                </div>
                <div className="space-y-2">
                  {transfers.map((opt, i) => (
                    <TransferCard
                      key={i}
                      option={opt}
                      selectedRouteId={selectedRouteId}
                      onSelect={onRouteSelect}
                    />
                  ))}
                </div>
              </>
            )}

          </div>
        )}

        {/* Empty state */}
        {!planResult && !error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30">directions_bus</span>
            <p className="text-xs text-on-surface-variant/60 font-medium">
              Search two stops to find available bus routes.
            </p>
            <p className="text-[10px] text-on-surface-variant/40">Live buses update every 15 seconds.</p>
          </div>
        )}

      </div>
    </aside>
  );
}

function RouteList({
  routes,
  selectedRouteId,
  onSelect,
  liveShortNames = new Set(),
  nextDepartures = {},
}: {
  routes: Route[];
  selectedRouteId: string | null;
  onSelect: (id: string) => void;
  liveShortNames?: Set<string>;
  nextDepartures?: Record<string, { departures: string[]; next_service: string | null }>;
}) {
  return (
    <div className="space-y-2">
      {routes.map((route) => {
        const isSelected = route.id === selectedRouteId;
        const isLive = liveShortNames.has(route.short_name);
        const info = nextDepartures[route.id];
        const upcoming = info?.departures ?? [];
        const nextService = info?.next_service ?? null;
        return (
          <button
            key={route.id}
            onClick={() => onSelect(route.id)}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border ${
              isSelected ? "border-transparent shadow-sm" : "border-transparent hover:bg-surface-container"
            }`}
            style={isSelected ? { backgroundColor: (route.color ?? "#0959b6") + "15", borderColor: route.color ?? "#0959b6" } : {}}
          >
            {/* Route number box */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: route.color ?? "#0959b6" }}
            >
              <span
                className="font-black leading-none text-center"
                style={{
                  color: route.text_color ?? "#fff",
                  fontSize: route.short_name.length > 3 ? "11px" : "16px",
                }}
              >
                {route.short_name}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-0.5">Bus Route</p>
              <p className="text-sm font-bold text-on-surface truncate">{route.long_name}</p>
              {route.headsigns && route.headsigns.length > 0 && (
                <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                  → {route.headsigns.slice(0, 2).join(" / ")}
                </p>
              )}
              {/* Live / next departure indicator */}
              {isLive ? (
                <p className="text-[10px] font-semibold mt-1 flex items-center gap-1" style={{ color: "#16a34a" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
                  Live now
                </p>
              ) : upcoming.length > 0 ? (
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Next: {upcoming.join(" · ")}
                </p>
              ) : nextService ? (
                <p className="text-[10px] text-on-surface-variant/60 mt-1">Next: {nextService}</p>
              ) : info && upcoming.length === 0 && !nextService ? (
                <p className="text-[10px] text-on-surface-variant/50 mt-1">No service this week</p>
              ) : null}
            </div>

            {isSelected && (
              <span className="material-symbols-outlined text-[18px] shrink-0" style={{ color: route.color ?? "#0959b6" }}>
                check_circle
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function TransferCard({
  option,
  selectedRouteId,
  onSelect,
}: {
  option: TransferOption;
  selectedRouteId: string | null;
  onSelect: (id: string) => void;
}) {
  const leg1Selected = option.leg1.id === selectedRouteId;
  const leg2Selected = option.leg2.id === selectedRouteId;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-surface-container">
      {/* Leg 1 */}
      <button
        onClick={() => onSelect(option.leg1.id)}
        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors ${leg1Selected ? "" : "hover:bg-surface-container"}`}
        style={leg1Selected ? { backgroundColor: (option.leg1.color ?? "#0959b6") + "15" } : {}}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: option.leg1.color ?? "#0959b6" }}
        >
          <span className="font-black text-[12px]" style={{ color: option.leg1.text_color ?? "#fff" }}>
            {option.leg1.short_name}
          </span>
        </div>
        <span className="text-xs font-semibold text-on-surface truncate flex-1">{option.leg1.long_name}</span>
        {leg1Selected && <span className="material-symbols-outlined text-[14px]" style={{ color: option.leg1.color }}>check_circle</span>}
      </button>

      {/* Transfer stop */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-container/70 border-y border-surface-container">
        <span className="material-symbols-outlined text-[15px] text-secondary">transfer_within_a_station</span>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-secondary mb-0.5">Transfer at</p>
          <p className="text-[11px] font-semibold text-on-surface truncate">{option.transfer_stop.name}</p>
        </div>
      </div>

      {/* Leg 2 */}
      <button
        onClick={() => onSelect(option.leg2.id)}
        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors ${leg2Selected ? "" : "hover:bg-surface-container"}`}
        style={leg2Selected ? { backgroundColor: (option.leg2.color ?? "#0959b6") + "15" } : {}}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: option.leg2.color ?? "#0959b6" }}
        >
          <span className="font-black text-[12px]" style={{ color: option.leg2.text_color ?? "#fff" }}>
            {option.leg2.short_name}
          </span>
        </div>
        <span className="text-xs font-semibold text-on-surface truncate flex-1">{option.leg2.long_name}</span>
        {leg2Selected && <span className="material-symbols-outlined text-[14px]" style={{ color: option.leg2.color }}>check_circle</span>}
      </button>
    </div>
  );
}

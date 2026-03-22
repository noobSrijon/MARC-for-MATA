"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import RouteFAB from "./components/RouteFAB";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

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

export default function HomeClient() {
  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop, setToStop] = useState<Stop | null>(null);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Flatten all routes from the plan result so MapView can draw shapes
  const allRoutes: Route[] = planResult
    ? [
        ...planResult.direct,
        ...planResult.transfers.flatMap((t) => [t.leg1, t.leg2]),
      ]
    : [];

  const handlePlanResult = useCallback((result: PlanResult | null) => {
    setPlanResult(result);
    if (!result) setSelectedRouteId(null);
  }, []);

  const handleRouteSelect = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 flex relative overflow-hidden">
        <MapView
          fromStop={fromStop}
          toStop={toStop}
          routeResults={allRoutes}
          selectedRouteId={selectedRouteId}
          onRouteSelect={handleRouteSelect}
        />
        <Sidebar
          onFromStop={setFromStop}
          onToStop={setToStop}
          onPlanResult={handlePlanResult}
          onRouteSelect={handleRouteSelect}
          selectedRouteId={selectedRouteId}
          planResult={planResult}
        />
      </main>
      <BottomNav />
      <RouteFAB />
    </div>
  );
}

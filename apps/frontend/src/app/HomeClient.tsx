"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import RouteFAB from "./components/RouteFAB";
import ReportIssueModal from "./components/ReportIssueModal";
import type { IssueReport } from "./components/ReportIssueModal";

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

interface ReportBusInfo {
  id: number;
  equipmentNumber: string;
  routeShortName: string | null;
  routeLongName: string | null;
  routeColor: string | null;
}

export default function HomeClient() {
  const [fromStop, setFromStop] = useState<Stop | null>(null);
  const [toStop, setToStop] = useState<Stop | null>(null);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [reportBus, setReportBus] = useState<ReportBusInfo | null>(null);
  const [reports, setReports] = useState<IssueReport[]>([]);

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

  const handleReportIssue = useCallback((bus: ReportBusInfo) => {
    setReportBus(bus);
  }, []);

  const handleReportSubmit = useCallback((report: IssueReport) => {
    setReports((prev) => [report, ...prev]);
  }, []);

  const handleReportClose = useCallback(() => {
    setReportBus(null);
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
          onReportIssue={handleReportIssue}
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

      {reportBus && (
        <ReportIssueModal
          bus={reportBus}
          onClose={handleReportClose}
          onSubmit={handleReportSubmit}
        />
      )}

      {/* Floating report count badge */}
      {reports.length > 0 && (
        <div className="fixed bottom-20 md:bottom-4 left-4 z-[1500] bg-tertiary text-on-tertiary rounded-full px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold shadow-lg">
          <span className="material-symbols-outlined text-[14px]">flag</span>
          {reports.length} issue{reports.length !== 1 ? "s" : ""} reported
        </div>
      )}
    </div>
  );
}

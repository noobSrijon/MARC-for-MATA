"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const issueTypes = [
  {
    icon: "accessible",
    label: "Broken Ramp",
    description: "Bus or station ramp malfunctioning.",
  },
  {
    icon: "elevator",
    label: "Elevator Out",
    description: "Station elevator is currently unavailable.",
  },
  {
    icon: "groups",
    label: "Crowded Bus",
    description: "Vehicle over capacity for mobility devices.",
  },
  {
    icon: "visibility_off",
    label: "Signage Error",
    description: "Audio or visual announcements missing.",
  },
];

const recentReports = [
  {
    icon: "elevator",
    title: "Elevator Out of Service",
    location: "Central Station - Level 2 Access",
    time: "2m ago",
    status: "Reported",
    statusColor: "text-tertiary",
    dotColor: "bg-tertiary",
    borderColor: "border-l-secondary",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
  },
  {
    icon: "accessible",
    title: "Broken Ramp",
    location: "Bus #422 - Beale Street Stop",
    time: "15m ago",
    status: "Investigating",
    statusColor: "text-primary",
    dotColor: "bg-primary-container",
    borderColor: "border-l-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: "check_circle",
    title: "Crowded Bus Resolved",
    location: "MATA Route 12 - Midtown",
    time: "1h ago",
    status: "Fixed",
    statusColor: "text-green-600",
    dotColor: "bg-green-500",
    borderColor: "border-l-green-600",
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    opacity: "opacity-80",
  },
];

const navItems = [
  { icon: "map", label: "Map", href: "/" },
  { icon: "leaderboard", label: "Leaderboard", href: "#" },
  { icon: "accessibility_new", label: "Access", href: "/access", active: true },
  { icon: "dashboard", label: "Dashboard", href: "#" },
];

export default function AccessPage() {
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState("");

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface text-on-surface font-body">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-[0_8px_24px_rgba(45,47,49,0.06)] shrink-0">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-2xl font-black italic text-primary tracking-tighter font-headline"
            >
              MARC
            </a>
            <nav className="hidden md:flex items-center gap-8 ml-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={
                    item.active
                      ? "text-primary font-bold border-b-2 border-primary transition-colors"
                      : "text-on-surface-variant font-medium hover:text-primary transition-colors"
                  }
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <span className="material-symbols-outlined text-on-surface">
                notifications
              </span>
            </Button>
            <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden ring-2 ring-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">
                account_circle
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable main area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto px-6 pt-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Report Form */}
            <section className="lg:col-span-7 space-y-10">
              {/* Title */}
              <header className="space-y-2">
                <h1 className="text-5xl font-extrabold tracking-tight font-headline text-on-surface leading-tight">
                  Report an{" "}
                  <span className="text-primary italic">Issue</span>
                </h1>
                <p className="text-on-surface-variant text-lg max-w-xl">
                  Help us keep Memphis moving. Identify accessibility barriers
                  in real-time to improve our community transit.
                </p>
              </header>

              {/* Issue Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {issueTypes.map((issue, i) => (
                  <Card
                    key={issue.label}
                    className={`cursor-pointer border-l-4 transition-all bg-surface-container-lowest shadow-[0_8px_24px_rgba(45,47,49,0.04)] ring-0 ${
                      selectedIssue === i
                        ? "border-l-primary bg-primary/5"
                        : "border-l-transparent hover:border-l-primary hover:bg-primary/5"
                    }`}
                    onClick={() =>
                      setSelectedIssue(selectedIssue === i ? null : i)
                    }
                  >
                    <CardContent className="flex flex-col items-start gap-2 pt-2">
                      <span className="material-symbols-outlined text-3xl text-primary">
                        {issue.icon}
                      </span>
                      <CardTitle className="font-bold text-xl text-on-surface font-body">
                        {issue.label}
                      </CardTitle>
                      <p className="text-on-surface-variant text-sm">
                        {issue.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Location + Form Bento */}
              <Card className="overflow-hidden p-1 bg-surface-container-low ring-0">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 h-[400px]">
                    {/* Map Side */}
                    <div className="relative rounded-lg overflow-hidden group map-bg">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="lg"
                          className="bg-white/90 backdrop-blur px-6 py-3 rounded-full font-bold shadow-xl text-on-surface cursor-pointer hover:bg-white h-auto"
                        >
                          <span className="material-symbols-outlined">
                            location_on
                          </span>
                          Drop Pin on Map
                        </Button>
                      </div>
                    </div>

                    {/* Form Side */}
                    <div className="bg-surface-container-lowest rounded-lg p-8 flex flex-col justify-center gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="vehicle-id"
                          className="text-xs font-bold tracking-widest text-on-surface-variant uppercase"
                        >
                          Vehicle ID
                        </Label>
                        <Input
                          id="vehicle-id"
                          type="text"
                          value={vehicleId}
                          onChange={(e) => setVehicleId(e.target.value)}
                          placeholder="Enter Bus Number (e.g. 42)"
                          className="h-auto bg-surface p-4 rounded-xl border-outline-variant text-lg font-bold placeholder:font-normal placeholder:text-on-surface-variant/60"
                        />
                      </div>
                      <Button className="w-full py-4 h-auto bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl text-lg shadow-lg active:scale-95 transition-all hover:opacity-90">
                        Submit Report
                      </Button>
                      <p className="text-xs text-on-surface-variant text-center italic">
                        Reports are monitored 24/7 by MARC dispatch.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Right Column: Recent Reports */}
            <aside className="lg:col-span-5 space-y-6">
              <Card className="bg-surface-container rounded-3xl ring-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-extrabold tracking-tight font-headline">
                    Recent{" "}
                    <span className="text-secondary italic">Reports</span>
                  </CardTitle>
                  <CardAction>
                    <Badge className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider h-auto">
                      Nearby
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                  {recentReports.map((report) => (
                    <Card
                      key={report.title}
                      className={`flex-row items-start gap-4 p-5 rounded-2xl bg-surface-container-lowest shadow-sm border-l-4 ring-0 ${report.borderColor} ${report.opacity ?? ""}`}
                    >
                      <div
                        className={`${report.iconBg} p-2 rounded-lg shrink-0`}
                      >
                        <span
                          className={`material-symbols-outlined ${report.iconColor}`}
                          style={
                            report.icon === "check_circle"
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          {report.icon}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-on-surface leading-tight">
                            {report.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold text-on-surface-variant uppercase bg-surface px-2 py-1 rounded shrink-0 h-auto border-transparent"
                          >
                            {report.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-on-surface-variant">
                          {report.location}
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                          <span
                            className={`w-2 h-2 rounded-full ${report.dotColor}`}
                          />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-widest ${report.statusColor}`}
                          >
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>

                <Separator className="bg-outline-variant/30" />

                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full py-3 h-auto text-sm font-bold text-primary hover:bg-primary/5 rounded-xl border-primary/20"
                  >
                    View History
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      {/* Bottom Nav — Mobile Only */}
      <nav className="md:hidden bg-surface-container-low/90 backdrop-blur-xl fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) =>
          item.active ? (
            <a
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-2xl px-5 py-2 scale-105 shadow-lg active:scale-90 transition-transform duration-150"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {item.icon}
              </span>
              <span className="font-label text-[10px] uppercase font-bold tracking-widest mt-1">
                {item.label}
              </span>
            </a>
          ) : (
            <a
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-2 opacity-70 hover:opacity-100 hover:bg-surface-container rounded-xl transition-all active:scale-90 duration-150"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label text-[10px] uppercase font-bold tracking-widest mt-1">
                {item.label}
              </span>
            </a>
          )
        )}
      </nav>

      {/* FAB — Mobile Only */}
      <div className="fixed bottom-24 right-6 md:hidden">
        <Button className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary-fixed text-on-secondary-fixed rounded-full shadow-2xl active:scale-95 transition-transform p-0">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            add
          </span>
        </Button>
      </div>
    </div>
  );
}

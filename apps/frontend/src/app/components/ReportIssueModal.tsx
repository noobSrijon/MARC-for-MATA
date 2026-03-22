"use client";

import { useState, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface BusInfo {
  id: number;
  equipmentNumber: string;
  routeShortName: string | null;
  routeLongName: string | null;
  routeColor: string | null;
}

interface ReportIssueModalProps {
  bus: BusInfo;
  onClose: () => void;
  onSubmit: (report: IssueReport) => void;
}

export interface IssueReport {
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
}

interface SelectedImage {
  file: File;
  previewUrl: string;
}

const ISSUE_TYPES = [
  { icon: "accessible", label: "Broken Ramp", description: "Wheelchair ramp malfunctioning or stuck" },
  { icon: "elevator", label: "Elevator Out", description: "Elevator at a stop is unavailable" },
  { icon: "more_horiz", label: "Other", description: "Something else not listed here" },
];

const MAX_IMAGES = 3;

async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API}/api/reports/upload-image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

async function saveReport(report: IssueReport): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function ReportIssueModal({ bus, onClose, onSubmit }: ReportIssueModalProps) {
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const routeLabel = bus.routeShortName ? `Route ${bus.routeShortName}` : "Bus";
  const routeName = bus.routeLongName ?? "";
  const color = bus.routeColor ?? "#0959b6";

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newImages: SelectedImage[] = [];
    const remaining = MAX_IMAGES - images.length;
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      newImages.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (selectedType === null) return;
    setSubmitting(true);

    const uploadedUrls: string[] = [];
    for (const img of images) {
      const url = await uploadImage(img.file);
      if (url) uploadedUrls.push(url);
    }

    const issueType = ISSUE_TYPES[selectedType];
    const report: IssueReport = {
      id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      busId: bus.id,
      equipmentNumber: bus.equipmentNumber,
      routeShortName: bus.routeShortName,
      routeLongName: bus.routeLongName,
      issueType: issueType.label,
      issueIcon: issueType.icon,
      description: description.trim(),
      imageUrls: uploadedUrls,
      timestamp: Date.now(),
    };

    setSubmitError(null);
    const saved = await saveReport(report);
    if (!saved) {
      setSubmitError("Failed to save report. Please try again.");
      setSubmitting(false);
      return;
    }

    onSubmit(report);
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div
          className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto p-8 shadow-2xl flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface font-headline">Report Submitted</h2>
          <p className="text-sm text-on-surface-variant text-center">
            Thanks for helping keep Memphis transit accessible. Your report for <strong>{routeLabel}</strong> (Bus #{bus.equipmentNumber}) has been recorded.
          </p>
          <button
            onClick={onClose}
            className="mt-2 w-full h-12 bg-primary text-on-primary font-bold rounded-xl text-sm hover:bg-primary-dim active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl w-full max-w-md mx-auto shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-4 border-b border-surface-container shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          >
            {bus.routeShortName ? (
              <span className="font-black text-white text-sm">{bus.routeShortName}</span>
            ) : (
              <span className="material-symbols-outlined text-white text-[18px]">directions_bus</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-on-surface font-headline">Report an Issue</h2>
            <p className="text-xs text-on-surface-variant truncate">
              {routeLabel}{routeName ? ` · ${routeName}` : ""} · Bus #{bus.equipmentNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Issue type grid */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2.5">
              What&apos;s the issue?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {ISSUE_TYPES.map((issue, i) => {
                const isSelected = selectedType === i;
                return (
                  <button
                    key={issue.label}
                    onClick={() => setSelectedType(isSelected ? null : i)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-surface-container hover:bg-surface-container-high"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] ${isSelected ? "text-primary" : "text-on-surface-variant"}`}
                    >
                      {issue.icon}
                    </span>
                    <p className={`text-xs font-bold mt-1 ${isSelected ? "text-primary" : "text-on-surface"}`}>
                      {issue.label}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/70 mt-0.5 leading-tight">
                      {issue.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">
              Details <span className="normal-case tracking-normal font-normal">(optional)</span>
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in more detail..."
              rows={3}
              className="w-full bg-surface-container rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          {/* Photo upload */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">
              Photos <span className="normal-case tracking-normal font-normal">(optional, up to {MAX_IMAGES})</span>
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-on-surface-variant/20 flex flex-col items-center justify-center gap-1 text-on-surface-variant/50 hover:border-primary/40 hover:text-primary/60 hover:bg-primary/5 transition-all"
                >
                  <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                  <span className="text-[9px] font-bold">Add</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 border-t border-surface-container shrink-0">
          {submitError && (
            <p className="text-sm text-red-600 font-medium mb-2">{submitError}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={selectedType === null || submitting}
            className="w-full h-12 bg-primary text-on-primary font-bold rounded-xl text-sm hover:bg-primary-dim active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Uploading…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                Submit Report
              </>
            )}
          </button>
          <p className="text-[10px] text-on-surface-variant/50 text-center mt-2">
            Your report helps improve transit for everyone in Memphis.
          </p>
        </div>
      </div>
    </div>
  );
}

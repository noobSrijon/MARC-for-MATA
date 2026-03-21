export default function MapPanel() {
  return (
    <div className="flex-1 relative bg-surface-container-high map-bg min-h-[400px] md:min-h-0">
      {/* Blue overlay */}
      <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

      {/* Map Controls */}
      <div className="absolute right-6 top-6 flex flex-col gap-3">
        <button className="w-12 h-12 bg-surface-container-lowest shadow-[0_8px_24px_rgba(45,47,49,0.06)] rounded-xl flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-95">
          <span className="material-symbols-outlined">my_location</span>
        </button>
        <button className="w-12 h-12 bg-surface-container-lowest shadow-[0_8px_24px_rgba(45,47,49,0.06)] rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="w-12 h-12 bg-surface-container-lowest shadow-[0_8px_24px_rgba(45,47,49,0.06)] rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all">
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>

      {/* Bus Pin – R42 (On-time) */}
      <div className="absolute top-1/3 left-1/4 animate-bounce">
        <div className="relative flex flex-col items-center">
          <div className="bg-primary text-white p-2 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-white">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_bus
            </span>
            <span className="font-bold text-xs pr-1">R42</span>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white -mt-0.5" />
        </div>
      </div>

      {/* Bus Pin – M10 (Delayed) */}
      <div className="absolute bottom-1/4 right-1/3">
        <div className="relative flex flex-col items-center">
          <div className="bg-tertiary text-white p-2 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-white">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_bus
            </span>
            <span className="font-bold text-xs pr-1">M10</span>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white -mt-0.5" />
        </div>
      </div>

      {/* Bus Pin – R52 (On-time) */}
      <div className="absolute top-1/2 left-2/3">
        <div className="relative flex flex-col items-center">
          <div className="bg-primary text-white p-2 rounded-2xl shadow-xl flex items-center gap-2 border-2 border-white">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_bus
            </span>
            <span className="font-bold text-xs pr-1">R52</span>
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white -mt-0.5" />
        </div>
      </div>
    </div>
  );
}

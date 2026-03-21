const navItems = [
  { icon: "map", label: "Map", active: true, href: "/" },
  { icon: "leaderboard", label: "Leaderboard", active: false, href: "#" },
  { icon: "accessibility_new", label: "Access", active: false, href: "/access" },
  { icon: "dashboard", label: "Dashboard", active: false, href: "#" },
];

export default function MapPanel() {
  return (
    <div className="flex-1 relative bg-surface-container-high map-bg">
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

      {/* Zoom Controls — top right of map area */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <button className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-95">
          <span className="material-symbols-outlined text-[18px]">my_location</span>
        </button>
        <button className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-95">
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <button className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-95">
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
      </div>

      {/* Bus Pin – R42 (On-time) */}
      <div className="absolute top-1/3 left-1/4 animate-bounce">
        <div className="relative flex flex-col items-center">
          <div className="bg-primary text-white px-2 py-1 rounded-xl shadow-lg flex items-center gap-1.5 border-2 border-white">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              directions_bus
            </span>
            <span className="font-bold text-[11px]">R42</span>
          </div>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white -mt-0.5" />
        </div>
      </div>

      {/* Bus Pin – M10 (Delayed) */}
      <div className="absolute bottom-1/4 right-1/3">
        <div className="relative flex flex-col items-center">
          <div className="bg-tertiary text-white px-2 py-1 rounded-xl shadow-lg flex items-center gap-1.5 border-2 border-white">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              directions_bus
            </span>
            <span className="font-bold text-[11px]">M10</span>
          </div>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white -mt-0.5" />
        </div>
      </div>

      {/* Bus Pin – R52 (On-time) */}
      <div className="absolute top-1/2 left-2/3">
        <div className="relative flex flex-col items-center">
          <div className="bg-primary text-white px-2 py-1 rounded-xl shadow-lg flex items-center gap-1.5 border-2 border-white">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              directions_bus
            </span>
            <span className="font-bold text-[11px]">R52</span>
          </div>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white -mt-0.5" />
        </div>
      </div>

      {/* Floating nav pills — bottom left, overlaid on map */}
      <div className="absolute bottom-5 left-5 flex gap-2 z-10">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm transition-all active:scale-95 ${
              item.active
                ? "bg-primary text-on-primary"
                : "bg-white/85 text-on-surface hover:bg-white"
            }`}
          >
            <span
              className="material-symbols-outlined text-[14px]"
              style={
                item.active
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

const navItems = [
  { icon: "map", label: "Map", active: true, fill: true, href: "/" },
  { icon: "leaderboard", label: "Leaderboard", active: false, fill: false, href: "#" },
  { icon: "accessibility_new", label: "Access", active: false, fill: false, href: "/access" },
  { icon: "dashboard", label: "Dashboard", active: false, fill: false, href: "#" },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden bg-surface-container-low/90 backdrop-blur-xl fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) =>
        item.active ? (
          <a
            key={item.label}
            className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-2xl px-5 py-2 scale-105 shadow-lg active:scale-90 transition-transform duration-150"
            href={item.href}
          >
            <span
              className="material-symbols-outlined"
              style={
                item.fill
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
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
            className="flex flex-col items-center justify-center text-on-surface-variant px-4 py-2 opacity-70 hover:opacity-100 hover:bg-surface-container rounded-xl transition-all active:scale-90 duration-150"
            href={item.href}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-[10px] uppercase font-bold tracking-widest mt-1">
              {item.label}
            </span>
          </a>
        )
      )}
    </nav>
  );
}

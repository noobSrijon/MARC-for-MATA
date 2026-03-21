import Image from "next/image";

const navItems = [
  { icon: "map", label: "Map", active: true },
  { icon: "leaderboard", label: "Leaderboard", active: false },
  { icon: "accessibility_new", label: "Access", active: false },
  { icon: "dashboard", label: "Dashboard", active: false },
];

export default function LeftNav() {
  return (
    <nav className="hidden md:flex flex-col w-[60px] bg-surface-container-lowest border-r border-surface-container shrink-0 h-full z-50">
      {/* Logo */}
      <div className="flex items-center justify-center h-12 border-b border-surface-container">
        <span className="text-sm font-black italic text-primary tracking-tighter font-headline">
          M
        </span>
      </div>

      {/* Spacer pushes nav to bottom */}
      <div className="flex-1" />

      {/* Nav items pinned to bottom-left */}
      <div className="flex flex-col items-center gap-1 px-2 pb-3">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg gap-0.5 transition-all active:scale-95 ${
              item.active
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
            title={item.label}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={
                item.active
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wide leading-none">
              {item.label}
            </span>
          </a>
        ))}

        {/* User avatar */}
        <div className="mt-2 w-7 h-7 rounded-full overflow-hidden border-2 border-surface-container">
          <Image
            alt="User"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZsNbMW7fWnt4C9KWVKM7_HnvL-t-Wgoyz2xtffbfPkOf-jCyJgDUHp9ynK15Ud4a9u4syvZAoXH-48BtLKjlXgcGPpccLgER0rqX6oqtaLaVp6wITneg6rQ_6oXJ1BgJLpyjOSeX7w_iwAe70cZ568uQaMgvGOdxi8gtKYenKAX6rZA1f9PpCytEWXE1Ev7ztH3QpNdr02xin-5n3HykzNggC9gLHaoxuhQYzY-ulI_dhQKkpTOjEU8nkG7x_OSdsDO_bKzcs41U"
            width={28}
            height={28}
            className="object-cover w-full h-full"
          />
        </div>
      </div>
    </nav>
  );
}

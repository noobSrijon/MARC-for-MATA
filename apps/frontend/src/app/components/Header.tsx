import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-[20px] sticky top-0 z-50 shadow-[0_8px_24px_rgba(45,47,49,0.06)]">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-8">
          <span className="text-2xl font-black italic text-primary tracking-tighter font-headline">
            MARC
          </span>
          <nav className="hidden md:flex items-center gap-6">
            <a
              className="text-primary font-bold border-b-2 border-primary hover:text-primary/80 transition-colors active:scale-95 duration-200"
              href="#"
            >
              Map
            </a>
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors active:scale-95 duration-200"
              href="#"
            >
              Leaderboard
            </a>
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors active:scale-95 duration-200"
              href="#"
            >
              Access
            </a>
            <a
              className="text-on-surface-variant font-medium hover:text-primary transition-colors active:scale-95 duration-200"
              href="#"
            >
              Dashboard
            </a>
          </nav>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Search Route"
              type="text"
            />
          </div>
          <button className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">
              notifications
            </span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-white">
            <Image
              alt="User Profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZsNbMW7fWnt4C9KWVKM7_HnvL-t-Wgoyz2xtffbfPkOf-jCyJgDUHp9ynK15Ud4a9u4syvZAoXH-48BtLKjlXgcGPpccLgER0rqX6oqtaLaVp6wITneg6rQ_6oXJ1BgJLpyjOSeX7w_iwAe70cZ568uQaMgvGOdxi8gtKYenKAX6rZA1f9PpCytEWXE1Ev7ztH3QpNdr02xin-5n3HykzNggC9gLHaoxuhQYzY-ulI_dhQKkpTOjEU8nkG7x_OSdsDO_bKzcs41U"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

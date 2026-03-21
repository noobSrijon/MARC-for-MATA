const routes = [
  {
    label: "Bus • Route 42",
    destination: "Beale St. Terminal",
    status: "On-Time",
    statusColor: "text-primary",
    hoverColor: "group-hover:text-primary",
    accentColor: "bg-primary",
    distance: "0.4 miles away",
    eta: "4",
    etaColor: "text-on-surface",
  },
  {
    label: "Main • Route 10",
    destination: "Overton Square",
    status: "8m Delay",
    statusColor: "text-tertiary",
    hoverColor: "group-hover:text-tertiary",
    accentColor: "bg-tertiary",
    distance: "1.2 miles away",
    eta: "12",
    etaColor: "text-tertiary",
  },
  {
    label: "Crosstown • Route 52",
    destination: "Crosstown Concourse",
    status: "On-Time",
    statusColor: "text-primary",
    hoverColor: "group-hover:text-primary",
    accentColor: "bg-primary",
    distance: "2.1 miles away",
    eta: "19",
    etaColor: "text-on-surface",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-full md:w-[400px] bg-surface flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
            Active Routes
          </h2>
          <span className="text-xs font-bold font-label uppercase tracking-widest text-primary bg-primary-container/30 px-3 py-1 rounded-full">
            3 Live
          </span>
        </div>

        {/* Mobile search */}
        <div className="relative md:hidden mb-6">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 focus:ring-primary focus:outline-none"
            placeholder="Search routes or stops..."
            type="text"
          />
        </div>

        {/* Route cards */}
        <div className="space-y-6">
          {routes.map((route) => (
            <div key={route.label} className="group cursor-pointer">
              <div className="flex items-start gap-4">
                <div
                  className={`w-1 ${route.accentColor} self-stretch rounded-full`}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold font-label text-on-surface-variant uppercase tracking-widest">
                      {route.label}
                    </span>
                    <span className={`text-sm font-bold ${route.statusColor}`}>
                      {route.status}
                    </span>
                  </div>
                  <h3
                    className={`text-xl font-bold text-on-surface ${route.hoverColor} transition-colors`}
                  >
                    {route.destination}
                  </h3>
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">
                        near_me
                      </span>
                      <span className="text-sm font-medium">
                        {route.distance}
                      </span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-black ${route.etaColor} leading-none tracking-tight`}
                      >
                        {route.eta}{" "}
                        <span className="text-sm font-bold uppercase ml-1 text-on-surface">
                          min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Refill Balance CTA */}
        <button className="w-full mt-10 py-5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
          <span className="material-symbols-outlined">payments</span>
          Refill Balance
        </button>
      </div>
    </aside>
  );
}

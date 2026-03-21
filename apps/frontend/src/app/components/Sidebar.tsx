import { Button } from "@/components/ui/button";

const routes = [
  {
    label: "Bus • Route 42",
    destination: "Beale St. Terminal",
    status: "On-Time",
    statusColor: "text-primary",
    accentColor: "bg-primary",
    distance: "0.4 mi",
    eta: "4",
    etaColor: "text-on-surface",
  },
  {
    label: "Main • Route 10",
    destination: "Overton Square",
    status: "8m Delay",
    statusColor: "text-tertiary",
    accentColor: "bg-tertiary",
    distance: "1.2 mi",
    eta: "12",
    etaColor: "text-tertiary",
  },
  {
    label: "Crosstown • Route 52",
    destination: "Crosstown Concourse",
    status: "On-Time",
    statusColor: "text-primary",
    accentColor: "bg-primary",
    distance: "2.1 mi",
    eta: "19",
    etaColor: "text-on-surface",
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-[264px] bg-surface-container-lowest border-l border-surface-container flex-col shrink-0">
      <div className="p-4 flex flex-col h-full gap-4">

        {/* Trip Planner — From / To */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2.5">
            Plan a Trip
          </p>
          <div className="bg-white rounded-2xl shadow-sm px-3 py-2.5 flex gap-2.5">
            {/* Route line indicator */}
            <div className="flex flex-col items-center pt-1 shrink-0">
              <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
              <div className="flex-1 w-px my-1 border-l-2 border-dashed border-on-surface-variant/20" />
              <div className="w-2 h-2 rounded-full bg-tertiary ring-2 ring-tertiary/20" />
            </div>

            {/* Inputs */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* From */}
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-0.5">From</p>
                <input
                  className="w-full text-xs bg-surface-container-low rounded-md px-2 py-1.5 outline-none placeholder:text-on-surface-variant/40 text-on-surface font-medium focus:ring-1 focus:ring-primary"
                  placeholder="Current location"
                  type="text"
                />
              </div>

              {/* To */}
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-0.5">To</p>
                <input
                  className="w-full text-xs bg-surface-container-low rounded-md px-2 py-1.5 outline-none placeholder:text-on-surface-variant/40 text-on-surface font-medium focus:ring-1 focus:ring-primary"
                  placeholder="Destination"
                  type="text"
                />
              </div>
            </div>
          </div>

          <Button className="w-full mt-2.5 bg-primary text-on-primary hover:bg-primary-dim h-8 rounded-xl gap-1.5 text-xs font-semibold">
            <span className="material-symbols-outlined text-[14px]">directions</span>
            Get Directions
          </Button>
        </div>

        {/* Active Routes header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface font-headline">
            Active Routes
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            3 Live
          </span>
        </div>

        {/* Route cards */}
        <div className="space-y-1 flex-1 overflow-y-auto">
          {routes.map((route) => (
            <div
              key={route.label}
              className="group cursor-pointer flex items-start gap-2.5 p-3 rounded-xl hover:bg-surface-container transition-colors"
            >
              <div
                className={`w-0.5 ${route.accentColor} self-stretch rounded-full shrink-0 mt-0.5`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest truncate">
                    {route.label}
                  </span>
                  <span className={`text-[10px] font-bold ${route.statusColor} shrink-0`}>
                    {route.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-on-surface mt-0.5 truncate">
                  {route.destination}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-on-surface-variant">{route.distance}</span>
                  <span className={`text-base font-black ${route.etaColor} leading-none`}>
                    {route.eta}
                    <span className="text-[10px] font-semibold text-on-surface-variant ml-0.5">min</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </aside>
  );
}

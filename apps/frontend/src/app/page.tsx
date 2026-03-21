import MapPanel from "./components/MapPanel";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import RouteFAB from "./components/RouteFAB";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <main className="flex-1 flex relative overflow-hidden">
        <MapPanel />
        <Sidebar />
      </main>
      <BottomNav />
      <RouteFAB />
    </div>
  );
}

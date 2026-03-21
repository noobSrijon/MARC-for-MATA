import Header from "./components/Header";
import MapPanel from "./components/MapPanel";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import RouteFAB from "./components/RouteFAB";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        <MapPanel />
        <Sidebar />
      </main>
      <BottomNav />
      <RouteFAB />
    </>
  );
}

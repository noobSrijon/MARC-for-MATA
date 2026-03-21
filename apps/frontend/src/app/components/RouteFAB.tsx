import { Button } from "@/components/ui/button";

export default function RouteFAB() {
  return (
    <Button
      className="md:hidden fixed right-4 bottom-24 bg-primary text-on-primary hover:bg-primary-dim w-11 h-11 rounded-xl shadow-md z-40 p-0"
      size="icon"
    >
      <span className="material-symbols-outlined text-xl">route</span>
    </Button>
  );
}

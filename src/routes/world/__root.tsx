/**
 * World Hub Root Layout
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SubTabNav } from "@/components/navigation/SubTabNav";

export const Route = createFileRoute("/world/__root")({
  component: WorldLayout,
});

function WorldLayout() {
  return (
    <div className="flex flex-col h-full">
      <SubTabNav />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

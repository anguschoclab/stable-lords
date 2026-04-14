/**
 * Operations Hub Root Layout
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SubTabNav } from "@/components/navigation/SubTabNav";

export const Route = createFileRoute("/ops/__root")({
  component: OpsLayout,
});

function OpsLayout() {
  return (
    <div className="flex flex-col h-full">
      <SubTabNav />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

/**
 * Command Hub Root Layout
 * Provides the layout for all Command hub pages with sub-navigation
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SubTabNav } from "@/components/navigation/SubTabNav";

export const Route = createFileRoute("/command/__root")({
  component: CommandLayout,
});

function CommandLayout() {
  return (
    <div className="flex flex-col h-full">
      <SubTabNav />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

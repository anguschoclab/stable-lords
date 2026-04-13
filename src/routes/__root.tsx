import React from "react";
import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import NotFound from "@/pages/NotFound";
import { useCoachTip } from "@/hooks/useCoachTip";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function RouterHooks() {
  const location = useLocation();

  // Use coach tip hook for contextual onboarding tips
  useCoachTip(location.pathname);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts({
    onToggleSidebar: () => {
      // TODO: Implement sidebar toggle functionality
      console.log("Toggle sidebar");
    },
  });

  return null;
}

export const Route = createRootRoute({
  component: () => (
    <>
      <RouterHooks />
      <AppShell>
        <React.Suspense fallback={
          <div className="h-screen w-screen bg-[#0d0f14] flex flex-col items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-primary/80 animate-pulse">
            <div className="mb-4">Synchronizing_Nodal_Link...</div>
            <div className="w-48 h-[1px] bg-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/60 animate-progress" />
            </div>
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </AppShell>
    </>
  ),
  notFoundComponent: () => <NotFound />,
});

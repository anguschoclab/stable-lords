import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { createRouter, RouterProvider, useLocation } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useGameStore, useWorldState } from "@/state/useGameStore";
import { useCoachTip } from "@/hooks/useCoachTip";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const ResolutionReveal = lazy(() => import("@/components/ResolutionReveal"));
const StartGame = lazy(() => import("@/pages/StartGame"));
const Orphanage = lazy(() => import("@/pages/Orphanage"));

// Create the router instance with context
const router = createRouter({
  routeTree,
  context: {
    isServer: false,
  },
  defaultPreload: 'intent',
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

function GameRoutes() {
  const state = useWorldState();
  const { atTitleScreen } = useGameStore();
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

  // No active game → show title / start screen
  if (atTitleScreen) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-[#050506]" />}>
        <StartGame />
      </Suspense>
    );
  }

  // FTUE not complete → Orphanage flow (stable already named on start page)
  if (!state.ftueComplete) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-[#050506]" />}>
        <Orphanage />
      </Suspense>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <ResolutionReveal />
      </Suspense>
      <RouterProvider router={router} />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={400}>
      <Toaster />
      <Sonner />
      <GameRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

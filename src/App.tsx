import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { useGame } from "@/state/GameContext";
import StartGame from "@/pages/StartGame";
import Orphanage from "@/pages/Orphanage";

const queryClient = new QueryClient();

function GameRoutes() {
  const { state, atTitleScreen } = useGame();

  // No active game → show title / start screen
  if (atTitleScreen) {
    return <StartGame />;
  }

  // FTUE not complete → Orphanage flow (stable already named on start page)
  if (!state.ftueComplete) {
    return <Orphanage />;
  }

  return <RouterProvider router={router} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

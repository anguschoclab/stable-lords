import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/state/GameContext";
import AppShell from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import RunRound from "@/pages/RunRound";
import Tournaments from "@/pages/Tournaments";
import Help from "@/pages/Help";
import WarriorDetail from "@/pages/WarriorDetail";
import HallOfFights from "@/lore/HallOfFights";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/run-round" element={<RunRound />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/help" element={<Help />} />
              <Route path="/warrior/:id" element={<WarriorDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

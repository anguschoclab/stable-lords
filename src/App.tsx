import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider, useGame } from "@/state/GameContext";
import AppShell from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import RunRound from "@/pages/RunRound";
import Tournaments from "@/pages/Tournaments";
import Help from "@/pages/Help";
import WarriorDetail from "@/pages/WarriorDetail";
import HallOfFights from "@/lore/HallOfFights";
import Recruit from "@/pages/Recruit";
import Graveyard from "@/pages/Graveyard";
import Training from "@/pages/Training";
import Trainers from "@/pages/Trainers";
import Orphanage from "@/pages/Orphanage";
import Scouting from "@/pages/Scouting";
import StableDetail from "@/pages/StableDetail";
import WorldOverview from "@/pages/WorldOverview";
import StartGame from "@/pages/StartGame";
import NotFound from "./pages/NotFound";
import Gazette from "@/pages/Gazette";
import HallOfFame from "@/pages/HallOfFame";
import KillAnalytics from "@/pages/KillAnalytics";
import EquipmentOptimizerPage from "@/pages/EquipmentOptimizerPage";
import TrainingPlanner from "@/pages/TrainingPlanner";
import SeasonalAwards from "@/pages/SeasonalAwards";
import TournamentAwards from "@/pages/TournamentAwards";

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

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/run-round" element={<RunRound />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/recruit" element={<Recruit />} />
        <Route path="/training" element={<Training />} />
        <Route path="/scouting" element={<Scouting />} />
        <Route path="/stable/:id" element={<StableDetail />} />
        <Route path="/world" element={<WorldOverview />} />
        <Route path="/graveyard" element={<Graveyard />} />
        <Route path="/trainers" element={<Trainers />} />
        <Route path="/help" element={<Help />} />
        <Route path="/warrior/:id" element={<WarriorDetail />} />
        <Route path="/hall-of-fights" element={<HallOfFights />} />
        <Route path="/gazette" element={<Gazette />} />
        <Route path="/hall-of-fame" element={<HallOfFame />} />
        <Route path="/kill-analytics" element={<KillAnalytics />} />
        <Route path="/equipment-optimizer" element={<EquipmentOptimizerPage />} />
        <Route path="/training-planner" element={<TrainingPlanner />} />
        <Route path="/seasonal-awards" element={<SeasonalAwards />} />
        <Route path="/tournament-awards" element={<TournamentAwards />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameProvider>
        <BrowserRouter>
          <GameRoutes />
        </BrowserRouter>
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

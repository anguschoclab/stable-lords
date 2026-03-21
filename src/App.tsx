import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
import { GameProvider } from "@/state/GameContext";
import { useGameStore } from "@/state/useGameStore";
import AppShell from "@/components/AppShell";
import ResolutionReveal from "@/components/ResolutionReveal";
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

const queryClient = new QueryClient();

function GameRoutes() {
  const { state, atTitleScreen } = useGameStore();

  // No active game → show title / start screen
  if (atTitleScreen) {
    return <StartGame />;
  }

  // FTUE not complete → Orphanage flow (stable already named on start page)
  if (!state.ftueComplete) {
    return <Orphanage />;
  }

  return (
    <>
      <ResolutionReveal />
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
        <Route path="/style-guide" element={<StyleGuide />} />
        <Route path="/arena-hub" element={<ArenaHub />} />
        <Route path="/stable-ledger" element={<StableLedger />} />
        <Route path="/stable-hall" element={<StableHall />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GameProvider>
        <GameRoutes />
      </GameProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { RootRoute, Route, Router, Outlet, createMemoryHistory, createBrowserHistory } from "@tanstack/react-router";
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
import Scouting from "@/pages/Scouting";
import StableDetail from "@/pages/StableDetail";
import WorldOverview from "@/pages/WorldOverview";
import NotFound from "./pages/NotFound";
import Gazette from "@/pages/Gazette";
import DesignBible from "@/pages/DesignBible";
import PhysicalsSimulator from "@/pages/PhysicalsSimulator";
import AdminTools from "@/pages/AdminTools";
import HallOfFame from "@/pages/HallOfFame";
import KillAnalytics from "@/pages/KillAnalytics";
import EquipmentOptimizerPage from "@/pages/EquipmentOptimizerPage";
import TrainingPlanner from "@/pages/TrainingPlanner";
import SeasonalAwards from "@/pages/SeasonalAwards";
import TournamentAwards from "@/pages/TournamentAwards";
import StyleGuide from "@/pages/StyleGuide";
import ArenaHub from "@/pages/ArenaHub";
import StableLedger from "@/pages/StableLedger";
import StableHall from "@/pages/StableHall";
import Owners from "@/pages/Owners";
import ArchivesStyles from "@/pages/ArchivesStyles";
import Settings from "@/pages/Settings";
import Mods from "@/pages/Mods";
import ImportExport from "@/pages/ImportExport";
import Telemetry from "@/pages/Telemetry";


// Create a root route
const rootRoute = new RootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => <NotFound />,
});

// Create child routes
const indexRoute = new Route({ getParentRoute: () => rootRoute, path: "/", component: Dashboard });
const runRoundRoute = new Route({ getParentRoute: () => rootRoute, path: "/run-round", component: RunRound });
const tournamentsRoute = new Route({ getParentRoute: () => rootRoute, path: "/tournaments", component: Tournaments });
const recruitRoute = new Route({ getParentRoute: () => rootRoute, path: "/recruit", component: Recruit });
const trainingRoute = new Route({ getParentRoute: () => rootRoute, path: "/training", component: Training });
const scoutingRoute = new Route({ getParentRoute: () => rootRoute, path: "/scouting", component: Scouting });
const stableDetailRoute = new Route({ getParentRoute: () => rootRoute, path: "/stable/$id", component: StableDetail });
const worldRoute = new Route({ getParentRoute: () => rootRoute, path: "/world", component: WorldOverview });
const graveyardRoute = new Route({ getParentRoute: () => rootRoute, path: "/graveyard", component: Graveyard });
const trainersRoute = new Route({ getParentRoute: () => rootRoute, path: "/trainers", component: Trainers });
const helpRoute = new Route({ getParentRoute: () => rootRoute, path: "/help", component: Help });
const warriorDetailRoute = new Route({ getParentRoute: () => rootRoute, path: "/warrior/$id", component: WarriorDetail });
const hallOfFightsRoute = new Route({ getParentRoute: () => rootRoute, path: "/hall-of-fights", component: HallOfFights });
const gazetteRoute = new Route({ getParentRoute: () => rootRoute, path: "/gazette", component: Gazette });
const designBibleRoute = new Route({ getParentRoute: () => rootRoute, path: "/design-bible", component: DesignBible });
const physicalsSimulatorRoute = new Route({ getParentRoute: () => rootRoute, path: "/physicals-simulator", component: PhysicalsSimulator });
const adminToolsRoute = new Route({ getParentRoute: () => rootRoute, path: "/admin-tools", component: AdminTools });
const hallOfFameRoute = new Route({ getParentRoute: () => rootRoute, path: "/hall-of-fame", component: HallOfFame });
const killAnalyticsRoute = new Route({ getParentRoute: () => rootRoute, path: "/kill-analytics", component: KillAnalytics });
const equipmentOptimizerRoute = new Route({ getParentRoute: () => rootRoute, path: "/equipment-optimizer", component: EquipmentOptimizerPage });
const trainingPlannerRoute = new Route({ getParentRoute: () => rootRoute, path: "/training-planner", component: TrainingPlanner });
const seasonalAwardsRoute = new Route({ getParentRoute: () => rootRoute, path: "/seasonal-awards", component: SeasonalAwards });
const tournamentAwardsRoute = new Route({ getParentRoute: () => rootRoute, path: "/tournament-awards", component: TournamentAwards });
const styleGuideRoute = new Route({ getParentRoute: () => rootRoute, path: "/style-guide", component: StyleGuide });
const arenaHubRoute = new Route({ getParentRoute: () => rootRoute, path: "/arena-hub", component: ArenaHub });
const stableLedgerRoute = new Route({ getParentRoute: () => rootRoute, path: "/stable-ledger", component: StableLedger });
const stableHallRoute = new Route({ getParentRoute: () => rootRoute, path: "/stable-hall", component: StableHall });
const schedulingAssistantRoute = new Route({ getParentRoute: () => rootRoute, path: "/scheduling-assistant", component: SchedulingAssistant });


const ownersRoute = new Route({ getParentRoute: () => rootRoute, path: "/owners", component: Owners });
const archivesStylesRoute = new Route({ getParentRoute: () => rootRoute, path: "/archives/styles", component: ArchivesStyles });
const settingsRoute = new Route({ getParentRoute: () => rootRoute, path: "/settings", component: Settings });
const modsRoute = new Route({ getParentRoute: () => rootRoute, path: "/mods", component: Mods });
const importExportRoute = new Route({ getParentRoute: () => rootRoute, path: "/import-export", component: ImportExport });
const telemetryRoute = new Route({ getParentRoute: () => rootRoute, path: "/telemetry", component: Telemetry });

// Create the route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  runRoundRoute,
  tournamentsRoute,
  recruitRoute,
  trainingRoute,
  scoutingRoute,
  stableDetailRoute,
  worldRoute,
  graveyardRoute,
  trainersRoute,
  helpRoute,
  warriorDetailRoute,
  hallOfFightsRoute,
  gazetteRoute,
  designBibleRoute,
  physicalsSimulatorRoute,
  adminToolsRoute,
  hallOfFameRoute,
  killAnalyticsRoute,
  equipmentOptimizerRoute,
  trainingPlannerRoute,
  seasonalAwardsRoute,
  tournamentAwardsRoute,
  styleGuideRoute,
  arenaHubRoute,
  stableLedgerRoute,
  stableHallRoute,

  ownersRoute,
  archivesStylesRoute,
  settingsRoute,
  modsRoute,
  importExportRoute,
  telemetryRoute,
]);

// Create the router
export const router = new Router({
  routeTree,
  // history: typeof window !== "undefined" ? createBrowserHistory() : createMemoryHistory()
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

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
const indexRoute = new Route({ getParentRoute: () => rootRoute, path: "/", component: ArenaHub });
const runRoundRoute = new Route({ getParentRoute: () => rootRoute, path: "/run-round", component: RunRound });
const warriorDetailRoute = new Route({ getParentRoute: () => rootRoute, path: "/warrior/$id", component: WarriorDetail });
const welcomeRoute = new Route({ getParentRoute: () => rootRoute, path: "/welcome", component: () => import("@/pages/Orphanage").then(m => m.default) });

// Pillar 2: Stable Management
const stablePillar = new Route({ getParentRoute: () => rootRoute, path: "/stable" });
const stableIndexRoute = new Route({ getParentRoute: () => stablePillar, path: "/", component: StableHall });
const stableDetailRoute = new Route({ getParentRoute: () => stablePillar, path: "/$id", component: StableDetail });
const stableTrainingRoute = new Route({ getParentRoute: () => stablePillar, path: "/training", component: Training });
const stableRecruitRoute = new Route({ getParentRoute: () => stablePillar, path: "/recruit", component: Recruit });
const stableGearRoute = new Route({ getParentRoute: () => stablePillar, path: "/equipment", component: EquipmentOptimizerPage });
const stablePlannerRoute = new Route({ getParentRoute: () => stablePillar, path: "/planner", component: TrainingPlanner });
const stableTrainersRoute = new Route({ getParentRoute: () => stablePillar, path: "/trainers", component: Trainers });
const stableFinanceRoute = new Route({ getParentRoute: () => stablePillar, path: "/finance", component: StableLedger });

// Pillar 3: World
const worldPillar = new Route({ getParentRoute: () => rootRoute, path: "/world" });
const worldIndexRoute = new Route({ getParentRoute: () => worldPillar, path: "/", component: WorldOverview });
const worldTournamentsRoute = new Route({ getParentRoute: () => worldPillar, path: "/tournaments", component: Tournaments });
const worldScoutingRoute = new Route({ getParentRoute: () => worldPillar, path: "/scouting", component: Scouting });
const worldGazetteRoute = new Route({ getParentRoute: () => worldPillar, path: "/gazette", component: Gazette });
const worldHistoryRoute = new Route({ getParentRoute: () => worldPillar, path: "/history", component: HallOfFights });

// Pillar 4: Legacy
const legacyPillar = new Route({ getParentRoute: () => rootRoute, path: "/legacy" });
const legacyIndexRoute = new Route({ getParentRoute: () => legacyPillar, path: "/", component: Graveyard });
const legacyHoFRoute = new Route({ getParentRoute: () => legacyPillar, path: "/hall-of-fame", component: HallOfFame });
const legacyAnalyticsRoute = new Route({ getParentRoute: () => legacyPillar, path: "/analytics", component: KillAnalytics });
const legacyAwardsRoute = new Route({ getParentRoute: () => legacyPillar, path: "/awards", component: SeasonalAwards });
const legacyTourneyAwardsRoute = new Route({ getParentRoute: () => legacyPillar, path: "/tournament-awards", component: TournamentAwards });

// Development / Help Tools
const helpRoute = new Route({ getParentRoute: () => rootRoute, path: "/help", component: Help });
const designBibleRoute = new Route({ getParentRoute: () => rootRoute, path: "/design-bible", component: DesignBible });
const physSimRoute = new Route({ getParentRoute: () => rootRoute, path: "/physicals-simulator", component: PhysicalsSimulator });
const adminToolsRoute = new Route({ getParentRoute: () => rootRoute, path: "/admin-tools", component: AdminTools });
const styleGuideRoute = new Route({ getParentRoute: () => rootRoute, path: "/style-guide", component: StyleGuide });

// Create the route tree
const routeTree = rootRoute.addChildren([
  welcomeRoute,
  indexRoute,
  runRoundRoute,
  warriorDetailRoute,
  stablePillar.addChildren([
    stableIndexRoute,
    stableDetailRoute,
    stableTrainingRoute,
    stableRecruitRoute,
    stableGearRoute,
    stablePlannerRoute,
    stableTrainersRoute,
    stableFinanceRoute,
  ]),
  worldPillar.addChildren([
    worldIndexRoute,
    worldTournamentsRoute,
    worldScoutingRoute,
    worldGazetteRoute,
    worldHistoryRoute,
  ]),
  legacyPillar.addChildren([
    legacyIndexRoute,
    legacyHoFRoute,
    legacyAnalyticsRoute,
    legacyAwardsRoute,
    legacyTourneyAwardsRoute,
  ]),
  helpRoute,
  designBibleRoute,
  physSimRoute,
  adminToolsRoute,
  styleGuideRoute,
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

/**
 * SubTabNav — Contextual secondary navigation tabs
 * Shows different tabs based on the active hub
 */
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type HubId, getActiveHubId } from "./HubNav";

// Command hub sub-tabs
const COMMAND_TABS = [
  { to: "/command", label: "Overview", exact: true },
  { to: "/command/roster", label: "Roster" },
  { to: "/command/training", label: "Training" },
  { to: "/command/tactics", label: "Tactics" },
  { to: "/command/combat", label: "Combat" },
] as const;

// Operations hub sub-tabs
const OPS_TABS = [
  { to: "/ops/personnel", label: "Personnel" },
  { to: "/ops/equipment", label: "Equipment" },
  { to: "/ops/finance", label: "Finance" },
  { to: "/ops/contracts", label: "Contracts" },
] as const;

// World hub sub-tabs
const WORLD_TABS = [
  { to: "/world", label: "Rankings", exact: true },
  { to: "/world/tournaments", label: "Tournaments" },
  { to: "/world/intelligence", label: "Scouting" },
  { to: "/world/chronicle", label: "Chronicle" },
] as const;

const HUB_TABS: Record<HubId, readonly { to: string; label: string; exact?: boolean }[]> = {
  command: COMMAND_TABS,
  ops: OPS_TABS,
  world: WORLD_TABS,
};

interface SubTabNavProps {
  className?: string;
}

export function SubTabNav({ className }: SubTabNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const activeHub = getActiveHubId(currentPath);

  // Don't render if not in a hub context
  if (!activeHub) return null;

  const tabs = HUB_TABS[activeHub];

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-black/20",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? currentPath === tab.to
          : currentPath === tab.to || currentPath.startsWith(`${tab.to}/`);

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "relative px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-200",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="subtab-indicator"
                className="absolute inset-0 bg-primary/10 rounded-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export { COMMAND_TABS, OPS_TABS, WORLD_TABS };

/**
 * HubNav — Primary 3-hub navigation component
 * Replaces the sidebar navigation with a top-level hub selector
 */
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Swords, Users, Globe } from "lucide-react";
import { motion } from "framer-motion";

const HUBS = [
  { id: "command", label: "Command", icon: Swords, to: "/command" },
  { id: "ops", label: "Operations", icon: Users, to: "/ops" },
  { id: "world", label: "World", icon: Globe, to: "/world" },
] as const;

export type HubId = (typeof HUBS)[number]["id"];

interface HubNavProps {
  className?: string;
}

export function HubNav({ className }: HubNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine active hub based on current path
  const activeHub = HUBS.find((hub) =>
    currentPath === hub.to || currentPath.startsWith(`${hub.to}/`)
  )?.id;

  return (
    <nav
      className={cn(
        "flex items-center justify-center gap-1 p-1 bg-neutral-900/60 border-b border-white/5",
        className
      )}
    >
      {HUBS.map((hub) => {
        const isActive = activeHub === hub.id;
        const Icon = hub.icon;

        return (
          <Link
            key={hub.id}
            to={hub.to}
            className={cn(
              "relative flex items-center gap-2 px-6 py-2.5 rounded-none transition-all duration-200",
              "text-sm font-black uppercase tracking-wider",
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="hub-indicator"
                className="absolute inset-0 bg-primary/10 rounded-none"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={cn("h-4 w-4 relative z-10", isActive && "text-primary")} />
            <span className="relative z-10">{hub.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function getActiveHubId(pathname: string): HubId | null {
  return HUBS.find((hub) => pathname === hub.to || pathname.startsWith(`${hub.to}/`))?.id ?? null;
}

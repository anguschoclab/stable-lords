/**
 * Global keyboard shortcuts for Stable Lords.
 *
 * Shortcuts (active when no input/textarea is focused):
 *   Space       — Navigate to Run Round (advance time)
 *   1-9         — Navigate to nav items by index
 *   E           — Toggle event log sidebar
 *   ?           — Navigate to Help
 */
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const NAV_ROUTES = [
  "/",             // 1 — Hub
  "/run-round",    // 2 — Run Round
  "/recruit",      // 3 — Recruit
  "/training",     // 4 — Training
  "/scouting",     // 5 — Scouting
  "/trainers",     // 6 — Trainers
  "/tournaments",  // 7 — Tournaments
  "/hall-of-fights",// 8 — Chronicle
  "/graveyard",    // 9 — Hall of Warriors
];

interface UseKeyboardShortcutsOpts {
  onToggleSidebar: () => void;
}

export function useKeyboardShortcuts({ onToggleSidebar }: UseKeyboardShortcutsOpts) {
  const navigate = useNavigate();

  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Skip when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Skip if modifier keys are held (allow browser shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      // Space → go to Run Round
      if (key === " ") {
        e.preventDefault();
        navigate("/run-round");
        return;
      }

      // E → toggle event log
      if (key === "e" || key === "E") {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // ? → help
      if (key === "?") {
        e.preventDefault();
        navigate("/help");
        return;
      }

      // 1-9 → nav by index
      const num = parseInt(key, 10);
      if (num >= 1 && num <= 9 && num <= NAV_ROUTES.length) {
        e.preventDefault();
        navigate(NAV_ROUTES[num - 1]);
        return;
      }
    },
    [navigate, onToggleSidebar]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}

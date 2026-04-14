/**
 * World Hub - Chronicle Page
 * Unified archive: Gazette + Hall of Fame + Graveyard + Analytics + History
 */
import { createFileRoute } from "@tanstack/react-router";
import Gazette from "@/pages/Gazette";

export const Route = createFileRoute("/world/chronicle")({
  component: Gazette,
});

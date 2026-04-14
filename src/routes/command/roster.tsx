/**
 * Command Hub - Roster Page
 * Full warrior roster grid with quick actions
 */
import { createFileRoute } from "@tanstack/react-router";
import StableHall from "@/pages/StableHall";

export const Route = createFileRoute("/command/roster")({
  component: StableHall,
});

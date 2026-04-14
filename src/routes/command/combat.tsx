/**
 * Command Hub - Combat Page
 * Bout execution and match management
 */
import { createFileRoute } from "@tanstack/react-router";
import RunRound from "@/pages/RunRound";

export const Route = createFileRoute("/command/combat")({
  component: RunRound,
});

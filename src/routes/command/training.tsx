/**
 * Command Hub - Training Page
 * Unified training management with Overview | Assignments | Analysis tabs
 */
import { createFileRoute } from "@tanstack/react-router";
import Training from "@/pages/Training";

export const Route = createFileRoute("/command/training")({
  component: Training,
});

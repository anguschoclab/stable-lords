/**
 * Command Hub - Overview Page
 * Merged Dashboard + Critical Alerts
 */
import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/command/")({
  component: Dashboard,
});

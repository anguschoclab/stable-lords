import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/stable/planner")({
  component: () => <Navigate to="/command/tactics" />,
});

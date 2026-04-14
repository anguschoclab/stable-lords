import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/world/scouting")({
  component: () => <Navigate to="/world/intelligence" />,
});

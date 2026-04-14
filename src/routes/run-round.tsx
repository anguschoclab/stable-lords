import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/run-round")({
  component: () => <Navigate to="/command/combat" />,
});

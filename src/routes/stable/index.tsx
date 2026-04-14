import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/stable/")({
  component: () => <Navigate to="/command/roster" />,
});

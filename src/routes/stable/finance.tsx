import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/stable/finance")({
  component: () => <Navigate to="/ops/finance" />,
});

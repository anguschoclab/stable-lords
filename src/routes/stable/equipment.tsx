import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/stable/equipment")({
  component: () => <Navigate to="/ops/equipment" />,
});

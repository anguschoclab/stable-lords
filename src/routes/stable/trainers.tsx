import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/stable/trainers")({
  component: () => <Navigate to="/ops/personnel" />,
});

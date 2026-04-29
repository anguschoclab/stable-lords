import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/stable/")({
  component: () => <Navigate to="/ops/overview" />,
});

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/world/history")({
  component: () => <Navigate to="/world/chronicle" search={{ tab: "history" }} />,
});

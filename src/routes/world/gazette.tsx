import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/world/gazette")({
  component: () => <Navigate to="/world/chronicle" search={{ tab: "gazette" }} />,
});

import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/stable/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <Navigate to="/world/stable/$id" params={{ id }} />;
  },
});

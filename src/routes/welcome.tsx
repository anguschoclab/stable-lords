import { createFileRoute } from "@tanstack/react-router";
import Orphanage from "@/pages/Orphanage";

export const Route = createFileRoute("/welcome")({
  component: Orphanage,
});

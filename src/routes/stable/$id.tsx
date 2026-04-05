import { createFileRoute } from "@tanstack/react-router";
import StableDetail from "@/pages/StableDetail";

export const Route = createFileRoute("/stable/$id")({
  component: StableDetail,
});

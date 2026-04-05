import { createFileRoute } from "@tanstack/react-router";
import RunRound from "@/pages/RunRound";

export const Route = createFileRoute("/run-round")({
  component: RunRound,
});

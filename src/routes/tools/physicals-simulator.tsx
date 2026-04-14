import { createFileRoute } from "@tanstack/react-router";
import PhysicalsSimulator from "@/pages/PhysicalsSimulator";

export const Route = createFileRoute("/tools/physicals-simulator")({
  component: PhysicalsSimulator,
});

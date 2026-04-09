import { createFileRoute } from "@tanstack/react-router";
import StableEquipment from "@/pages/StableEquipment";

export const Route = createFileRoute("/stable/equipment")({
  component: StableEquipment,
});

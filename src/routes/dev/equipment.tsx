import { createFileRoute } from "@tanstack/react-router";
import EquipmentOptimizerPage from "@/pages/EquipmentOptimizerPage";

export const Route = createFileRoute("/dev/equipment")({
  component: EquipmentOptimizerPage,
});

/**
 * Operations Hub - Equipment Page
 * Armory and gear management
 */
import { createFileRoute } from "@tanstack/react-router";
import StableEquipment from "@/pages/StableEquipment";

export const Route = createFileRoute("/ops/equipment")({
  component: StableEquipment,
});

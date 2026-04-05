import { createFileRoute } from "@tanstack/react-router";
import WarriorDetail from "@/pages/WarriorDetail";

export const Route = createFileRoute("/warrior/$id")({
  component: WarriorDetail,
});

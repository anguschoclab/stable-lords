import { createFileRoute } from "@tanstack/react-router";
import AdminTools from "@/pages/AdminTools";

export const Route = createFileRoute("/dev/admin")({
  component: AdminTools,
});

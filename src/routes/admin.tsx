import { createFileRoute } from '@tanstack/react-router';
import AdminTools from '@/pages/AdminTools';

export const Route = createFileRoute('/admin')({
  component: AdminTools,
});

import { createFileRoute } from '@tanstack/react-router';
import WorldOverview from '@/pages/WorldOverview';

export const Route = createFileRoute('/world/')({
  component: WorldOverview,
});

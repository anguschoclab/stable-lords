import { createFileRoute } from '@tanstack/react-router';
import HallOfFame from '@/pages/HallOfFame';

export const Route = createFileRoute('/world/history')({
  component: HallOfFame,
});

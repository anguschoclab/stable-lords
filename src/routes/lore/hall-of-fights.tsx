import { createFileRoute } from '@tanstack/react-router';
import HallOfFights from '@/lore/HallOfFights';

export const Route = createFileRoute('/lore/hall-of-fights')({
  component: HallOfFights,
});

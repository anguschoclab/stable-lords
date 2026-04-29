import { createFileRoute } from '@tanstack/react-router';
import ArenaHub from '@/pages/ArenaHub';

export const Route = createFileRoute('/arena-hub')({
  component: ArenaHub,
});

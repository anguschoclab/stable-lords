/**
 * Command Hub - Arena Page
 * Pre-bout arena overview: crowd mood, stats, matchups.
 */
import { createFileRoute } from '@tanstack/react-router';
import ArenaHub from '@/pages/ArenaHub';

export const Route = createFileRoute('/command/arena')({
  component: ArenaHub,
});

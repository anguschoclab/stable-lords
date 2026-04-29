/**
 * Operations Hub - Roster Page
 * Full warrior roster grid.
 */
import { createFileRoute } from '@tanstack/react-router';
import StableHall from '@/pages/StableHall';

export const Route = createFileRoute('/ops/roster')({
  component: StableHall,
});

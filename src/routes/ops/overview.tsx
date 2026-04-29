/**
 * Operations Hub - Overview Page
 * Stable overview: roster wall, reputation, trainers summary.
 */
import { createFileRoute } from '@tanstack/react-router';
import StableHall from '@/pages/StableHall';

export const Route = createFileRoute('/ops/overview')({
  component: StableHall,
});

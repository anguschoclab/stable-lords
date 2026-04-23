/**
 * Command Hub - Tactics Page
 * Tournament prep and bout planning
 */
import { createFileRoute } from '@tanstack/react-router';
import TrainingPlanner from '@/pages/TrainingPlanner';

export const Route = createFileRoute('/command/tactics')({
  component: TrainingPlanner,
});

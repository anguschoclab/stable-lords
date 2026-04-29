import { createFileRoute } from '@tanstack/react-router';
import Recruit from '@/pages/Recruit';

export const Route = createFileRoute('/ops/recruit')({
  component: Recruit,
});

import { createFileRoute } from '@tanstack/react-router';
import Recruit from '@/pages/Recruit';

export const Route = createFileRoute('/stable/recruit')({
  component: Recruit,
});

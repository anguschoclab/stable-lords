import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/stable/training')({
  component: () => <Navigate to="/command/training" />,
});

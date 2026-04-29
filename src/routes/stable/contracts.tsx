import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/stable/contracts')({
  component: () => <Navigate to="/ops/contracts" />,
});

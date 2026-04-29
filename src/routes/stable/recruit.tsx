import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/stable/recruit')({
  component: () => <Navigate to="/ops/recruit" />,
});

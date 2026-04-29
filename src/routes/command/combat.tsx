import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/command/combat')({
  beforeLoad: () => {
    throw redirect({ to: '/command/arena' });
  },
  component: () => null,
});

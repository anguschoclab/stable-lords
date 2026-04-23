/**
 * Operations Hub Root Layout
 */
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/ops/__root')({
  component: OpsLayout,
});

function OpsLayout() {
  return <Outlet />;
}

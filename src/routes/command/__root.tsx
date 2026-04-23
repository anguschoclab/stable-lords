/**
 * Command Hub Root Layout
 * Provides the layout for all Command hub pages with sub-navigation
 */
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/command/__root')({
  component: CommandLayout,
});

function CommandLayout() {
  return <Outlet />;
}

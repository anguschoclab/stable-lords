/**
 * World Hub - Stable Detail Page
 * Shows rival stable identity, owner, roster, career records
 */
import { createFileRoute } from '@tanstack/react-router';
import StableDetail from '@/pages/StableDetail';

export const Route = createFileRoute('/world/stable/$id')({
  component: StableDetail,
});

/**
 * Operations Hub - Promoter Detail Page
 * Individual promoter profile and history
 */
import { createFileRoute } from '@tanstack/react-router';
import PromoterDetail from '@/pages/PromoterDetail';

export const Route = createFileRoute('/ops/promoter/$id')({
  component: PromoterDetail,
});

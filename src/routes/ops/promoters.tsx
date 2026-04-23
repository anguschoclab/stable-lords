/**
 * Operations Hub - Promoters Page
 * Directory of all promoters in the realm
 */
import { createFileRoute } from '@tanstack/react-router';
import PromoterDirectory from '@/pages/PromoterDirectory';

export const Route = createFileRoute('/ops/promoters')({
  component: PromoterDirectory,
});

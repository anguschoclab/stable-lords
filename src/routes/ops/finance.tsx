/**
 * Operations Hub - Finance Page
 * Treasury and financial management
 */
import { createFileRoute } from '@tanstack/react-router';
import StableLedger from '@/pages/StableLedger';

export const Route = createFileRoute('/ops/finance')({
  component: StableLedger,
});

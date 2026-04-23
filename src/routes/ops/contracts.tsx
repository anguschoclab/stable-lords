/**
 * Operations Hub - Contracts Page
 * Booking office and bout offers
 */
import { createFileRoute } from '@tanstack/react-router';
import BookingOffice from '@/pages/BookingOffice';

export const Route = createFileRoute('/ops/contracts')({
  component: BookingOffice,
});

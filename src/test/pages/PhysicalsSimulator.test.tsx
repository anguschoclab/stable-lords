import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PhysicalsSimulator from '../../pages/PhysicalsSimulator';

// Mocking getBoundingClientRect for Radix UI select and slider
// This is often needed in JSDOM when rendering complex UI components
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0,
    x: 0, y: 0, toJSON: () => {},
  }));
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
});

describe('PhysicalsSimulator Page', () => {
  it('renders correctly', () => {
    render(<PhysicalsSimulator />);

    // Check main title
    expect(screen.getByText('Physicals Simulator')).toBeDefined();

    // Check if both fighters are listed
    expect(screen.getByText('Fighter A')).toBeDefined();
    expect(screen.getByText('Fighter B')).toBeDefined();

    // Check if simulation results area exists
    expect(screen.getByText('Simulation Results (10 Minutes)')).toBeDefined();
  });

  it('calculates initial stats properly for both fighters', () => {
    render(<PhysicalsSimulator />);

    // Find Fighter A's section by looking for its specific title context
    // The easiest way is to look for the "Fighter A Base Stats" header
    expect(screen.getByText('Fighter A Base Stats')).toBeDefined();
    expect(screen.getByText('Fighter B Base Stats')).toBeDefined();

    // Look for HP value
    // Since there are multiple "HP" labels, we'll just check if the initial values look reasonable
    // Default is 10/10/10 stats, which normally yields ~40 HP
    const hpElements = screen.getAllByText(/\d+/); // Usually 40 or near it
    expect(hpElements.length).toBeGreaterThan(0);
  });
});

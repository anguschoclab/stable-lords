import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PhysicalsSimulator from '../../pages/PhysicalsSimulator';

// Mocking getBoundingClientRect for Radix UI select and slider
// This is often needed in JSDOM when rendering complex UI components
beforeAll(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
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
    expect(screen.getByText(/SIMULATION RESULTS/i)).toBeDefined();
  });

  it('calculates initial stats properly for both fighters', () => {
    render(<PhysicalsSimulator />);

    // Find Fighter A's analysis section
    expect(screen.getByText('Fighter A Analysis')).toBeDefined();
    expect(screen.getByText('Fighter B Analysis')).toBeDefined();

    // Check that numeric stat values exist
    const numElements = screen.getAllByText(/\d+/);
    expect(numElements.length).toBeGreaterThan(0);
  });
});

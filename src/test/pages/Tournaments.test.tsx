import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tournaments from '../../pages/Tournaments';
import { useGameStore } from '../../state/useGameStore';

// We mock @tanstack/react-router to avoid setting up a full router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock useGameStore
vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn()
}));

// Mock ResizeObserver for Radix UI Tooltip
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('Tournaments Page', () => {
  const mockSetState = vi.fn();

  const mockActiveWarrior = {
    id: 'w1', name: 'Grom', status: 'Active', style: 'Bash Artist',
    fame: 85, // High fame to trigger FE freeze warning
    career: { wins: 5, losses: 1, kills: 0 }
  };

  const mockActiveWarrior2 = {
    id: 'w2', name: 'Thor', status: 'Active', style: 'Parry Riposte',
    fame: 40,
    career: { wins: 2, losses: 2, kills: 0 }
  };

  const mockState = {
    week: 1,
    season: 'Spring',
    roster: [mockActiveWarrior, mockActiveWarrior2],
    tournaments: [],
    rivals: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockReturnValue({
      state: mockState,
      setState: mockSetState
    });
  });

  it('renders prep mode button when criteria are met', () => {
    render(<Tournaments />);

    // Check main title
    expect(screen.getByText(/Seasonal Tournaments/)).toBeDefined();

    // Check Prep Mode & Start button is present
    const prepBtn = screen.getByRole('button', { name: /Prep Mode/i });
    expect(prepBtn).toBeDefined();
  });


});

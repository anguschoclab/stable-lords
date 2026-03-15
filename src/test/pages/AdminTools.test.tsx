import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTools from '../../pages/AdminTools';
import { useGame } from '../../state/GameContext';

// Mock the context hook
vi.mock('@/state/GameContext', () => ({
  useGame: vi.fn()
}));

describe('AdminTools Page', () => {
  const mockSetState = vi.fn();
  const mockDoReset = vi.fn();
  const mockState = {
    week: 1,
    season: 'Spring',
    year: 1,
    roster: [],
    gold: 500,
    tournaments: [],
    rivals: [],
    arenaHistory: [],
    trainers: [],
    trainingAssignments: [],
    graveyard: [],
    retired: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGame as any).mockReturnValue({
      state: mockState,
      setState: mockSetState,
      doReset: mockDoReset
    });
  });

  it('renders all administrative panels', () => {
    render(<AdminTools />);

    // Check main title
    expect(screen.getByText('Admin & Telemetry Tools')).toBeDefined();

    // Check section headers
    expect(screen.getByText('Save Management')).toBeDefined();
    expect(screen.getByText('Time Control')).toBeDefined();
    expect(screen.getByText('Telemetry & System State')).toBeDefined();
  });

  it('provides buttons for time skipping', () => {
    render(<AdminTools />);

    const skipWeekBtn = screen.getByRole('button', { name: /Skip 1 Week/i });
    expect(skipWeekBtn).toBeDefined();

    const skipSeasonBtn = screen.getByRole('button', { name: /Skip Season/i });
    expect(skipSeasonBtn).toBeDefined();

    // Test skip week fires setState
    fireEvent.click(skipWeekBtn);
    expect(mockSetState).toHaveBeenCalled();
  });

  it('provides button for hard reset', () => {
    render(<AdminTools />);

    const resetBtn = screen.getByRole('button', { name: /Hard Reset/i });
    expect(resetBtn).toBeDefined();

    // Test reset fires doReset
    fireEvent.click(resetBtn);
    expect(mockDoReset).toHaveBeenCalled();
  });

  it('renders a JSON state dump', () => {
    render(<AdminTools />);
    expect(screen.getByText(/"week": 1/)).toBeDefined();
    expect(screen.getByText(/"gold": 500/)).toBeDefined();
  });
});

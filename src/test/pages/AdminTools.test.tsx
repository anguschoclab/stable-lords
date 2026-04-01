import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTools from '../../pages/AdminTools';
import { useGameStore } from '@/state/useGameStore';

// Mock the context hook
vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn()
}));

describe('AdminTools Page', () => {
  const mockSetState = vi.fn();
  const mockDoReset = vi.fn();
  const mockState = {
  newsletter: [],
  ledger: [],
  matchHistory: [],
  moodHistory: [],
  graveyard: [],
  retired: [],
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useGameStore as any).mockReturnValue({
      state: mockState,
      setState: mockSetState,
      doReset: mockDoReset
    });
  });

  it('renders all administrative panels', () => {
    render(<AdminTools />);

    // Check main title
    expect(screen.getByText('Admin_Interface')).toBeDefined();

    // Check section headers
    expect(screen.getByText('Save_Core')).toBeDefined();
    expect(screen.getByText('temporal_Drift')).toBeDefined();
    expect(screen.getByText('Telemetry_Output_Stream')).toBeDefined();
  });

  it('provides buttons for time skipping', () => {
    render(<AdminTools />);

    const skipWeekBtn = screen.getByRole('button', { name: /Advance 1 Week/i });
    expect(skipWeekBtn).toBeDefined();

    const skipSeasonBtn = screen.getByRole('button', { name: /Advance Season/i });
    expect(skipSeasonBtn).toBeDefined();

    // Test skip week fires setState
    fireEvent.click(skipWeekBtn);
    expect(mockSetState).toHaveBeenCalled();
  });

  it('provides button for hard reset', () => {
    render(<AdminTools />);

    const resetBtn = screen.getByRole('button', { name: /Wipe_All_Data/i });
    expect(resetBtn).toBeDefined();

    // Test reset fires doReset
    fireEvent.click(resetBtn);
    expect(mockDoReset).toHaveBeenCalled();
  });

  it('provides button to skip FTUE', () => {
    render(<AdminTools />);
    const skipFtueBtn = screen.getByRole('button', { name: /Bypass_FTUE_Gate/i });
    expect(skipFtueBtn).toBeDefined();

    fireEvent.click(skipFtueBtn);
    expect(mockSetState).toHaveBeenCalledWith(expect.objectContaining({ ftueComplete: true }));
  });

  it('renders a JSON state dump', () => {
    render(<AdminTools />);
    expect(screen.getByText(/"week": 1/)).toBeDefined();
    expect(screen.getByText(/"gold": 500/)).toBeDefined();
  });
});

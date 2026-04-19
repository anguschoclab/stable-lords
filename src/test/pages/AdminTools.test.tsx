/**
 * @vitest-environment jsdom
 */
import { enableMapSet } from 'immer';
enableMapSet();
import { describe, it, expect, vi, beforeEach , Mock} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminTools from '../../pages/AdminTools';
import { renderWithGameState } from '../testUtils';

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
    treasury: 500,
    tournaments: [],
    rivals: [],
    arenaHistory: [],
    trainers: [],
    trainingAssignments: [],
    fame: 0,
    player: { id: "p1", name: "Player", stableName: "Dragon's Hearth", fame: 0, renown: 0, titles: 0 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all administrative panels', () => {
    renderWithGameState(<AdminTools />, { ...mockState, setState: mockSetState, doReset: mockDoReset } as any);

    // Check main title
    expect(screen.getByText('Admin_Interface')).toBeDefined();

    // Check section headers
    expect(screen.getByText('Save_Core')).toBeDefined();
    expect(screen.getByText('temporal_Drift')).toBeDefined();
    expect(screen.getByText('Telemetry_Output_Stream')).toBeDefined();
  });

  it('provides buttons for time skipping', () => {
    renderWithGameState(<AdminTools />, { ...mockState, setState: mockSetState, doReset: mockDoReset } as any);

    const skipWeekBtn = screen.getByRole('button', { name: /Advance 1 Week/i });
    expect(skipWeekBtn).toBeDefined();

    const skipSeasonBtn = screen.getByRole('button', { name: /Advance Season/i });
    expect(skipSeasonBtn).toBeDefined();

    // Test skip week fires setState
    fireEvent.click(skipWeekBtn);
    expect(mockSetState).toHaveBeenCalled();
  });

  it('provides button for hard reset', () => {
    renderWithGameState(<AdminTools />, { ...mockState, setState: mockSetState, doReset: mockDoReset } as any);

    const resetBtn = screen.getByRole('button', { name: /Wipe_All_Data/i });
    expect(resetBtn).toBeDefined();

    // Test reset fires doReset
    fireEvent.click(resetBtn);
    expect(mockDoReset).toHaveBeenCalled();
  });

  it('provides button to skip FTUE', () => {
    renderWithGameState(<AdminTools />, { ...mockState, setState: mockSetState, doReset: mockDoReset } as any);
    const skipFtueBtn = screen.getByRole('button', { name: /Bypass FTUE/i });
    expect(skipFtueBtn).toBeDefined();

    fireEvent.click(skipFtueBtn);
    expect(mockSetState).toHaveBeenCalled();
    
    // AdminTools uses a functional update: draft => { ... }
    const draft = { ...mockState, ftueComplete: false };
    const updater = mockSetState.mock.calls[0][0];
    const result = updater(draft); 
    expect(result.ftueComplete).toBe(true);
  });

  it('renders a JSON state dump', () => {
    renderWithGameState(<AdminTools />, { ...mockState, setState: mockSetState, doReset: mockDoReset } as any);
    expect(screen.getByText(/"week": 1/)).toBeDefined();
    expect(screen.getByText(/"treasury": 500/)).toBeDefined();
  });
});

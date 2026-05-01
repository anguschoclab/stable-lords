import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
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
    player: {
      id: 'p1',
      name: 'Player',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all administrative panels', () => {
    renderWithGameState(<AdminTools />, mockState as any);

    // Check main title
    expect(screen.getByText('Administration')).toBeDefined();

    // Check category nav labels are visible
    expect(screen.getByText('Core_System')).toBeDefined();
    expect(screen.getByText('Temporal_Flux')).toBeDefined();
    expect(screen.getByText('Data_Stream')).toBeDefined();
  });

  it('provides buttons for time skipping', () => {
    renderWithGameState(<AdminTools />, mockState as any);

    // Navigate to the WORLD category tab
    fireEvent.click(screen.getByText('Temporal_Flux'));

    const skipWeekBtn = screen.getByRole('button', { name: /Advance 1 Week/i });
    expect(skipWeekBtn).toBeDefined();

    const skipSeasonBtn = screen.getByRole('button', { name: /Advance Season/i });
    expect(skipSeasonBtn).toBeDefined();

    // Test skip week fires without crashing
    fireEvent.click(skipWeekBtn);
  });

  it('provides button for hard reset', () => {
    renderWithGameState(<AdminTools />, mockState as any);

    // The SYSTEM tab (default) shows the Execute System Wipe button
    const resetBtn = screen.getByRole('button', { name: /Execute System Wipe/i });
    expect(resetBtn).toBeDefined();
  });

  it('provides button to skip FTUE', () => {
    renderWithGameState(<AdminTools />, { ...mockState, ftueComplete: false } as any);

    // Navigate to the WORLD category tab
    fireEvent.click(screen.getByText('Temporal_Flux'));

    const skipFtueBtn = screen.getByRole('button', { name: /Bypass FTUE/i });
    expect(skipFtueBtn).toBeDefined();

    // Clicking it should not throw
    fireEvent.click(skipFtueBtn);
  });

  it('renders a JSON state dump', () => {
    renderWithGameState(<AdminTools />, mockState as any);

    // Navigate to Data Stream tab
    fireEvent.click(screen.getByText('Data_Stream'));

    // The dump uses nested keys: temporal.week and inventory.treasury
    expect(screen.getByText(/"week":/)).toBeDefined();
    expect(screen.getByText(/"treasury":/)).toBeDefined();
  });
});

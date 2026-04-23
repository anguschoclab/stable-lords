import { describe, it, expect, vi, beforeEach, beforeAll, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tournaments from '../../pages/Tournaments';
import { useGameStore } from '../../state/useGameStore';
import { renderWithGameState } from '../testUtils';

// We mock @tanstack/react-router to avoid setting up a full router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock context hook removed - using actual store + renderWithGameState

describe('Tournaments Page', () => {
  const mockSetState = vi.fn();

  const mockActiveWarrior = {
    id: 'w1',
    name: 'Grom',
    status: 'Active',
    style: 'Bash Artist',
    fame: 85, // High fame to trigger FE freeze warning
    career: { wins: 5, losses: 1, kills: 0 },
  };

  const mockActiveWarrior2 = {
    id: 'w2',
    name: 'Thor',
    status: 'Active',
    style: 'Parry Riposte',
    fame: 40,
    career: { wins: 2, losses: 2, kills: 0 },
  };

  const mockState = {
    week: 1,
    season: 'Spring' as const,
    roster: [mockActiveWarrior],
    tournaments: [],
    rivals: [],
    treasury: 1000,
    fame: 10,
    lastSimulationReport: null,
    newsletter: [],
    gazettes: [],
    awards: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // No mockReturnValue needed - renderWithGameState handles it
  });

  it('renders recruit operatives button when criteria are met', () => {
    const { getByText, getByRole } = renderWithGameState(<Tournaments />, mockState as any);

    // Check main title
    expect(getByText(/Seasonal Campaigns/)).toBeDefined();

    // Check Recruit Operatives button is present when tournament is not active
    const recruitBtn = getByRole('button', { name: /RECRUIT_OPERATIVES/i });
    expect(recruitBtn).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach, beforeAll , Mock} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tournaments from '../../pages/Tournaments';
import { useGameStore } from '../../state/useGameStore';

// We mock @tanstack/react-router to avoid setting up a full router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock context hook removed - using actual store + renderWithGameState


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
    roster: [mockActiveWarrior], // Only 1 active warrior, so it satisfies < 2 condition
    tournaments: [],
    rivals: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // No mockReturnValue needed - renderWithGameState handles it
  });

  it('renders recruit operatives button when criteria are met', () => {
    render(<Tournaments />);

    // Check main title
    expect(screen.getByText(/Seasonal Campaigns/)).toBeDefined();

    // Check Recruit Operatives button is present when tournament is not active
    const recruitBtn = screen.getByRole('button', { name: /RECRUIT_OPERATIVES/i });
    expect(recruitBtn).toBeDefined();
  });


});

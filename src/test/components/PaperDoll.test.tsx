import { render, screen, cleanup } from '@testing-library/react';
import { PaperDoll } from '@/components/ui/PaperDoll';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom';

describe('PaperDoll', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders all body parts', () => {
    render(<PaperDoll healthMap={{}} />);
    expect(screen.getByTestId('body-part-head')).toBeInTheDocument();
    expect(screen.getByTestId('body-part-torso')).toBeInTheDocument();
    expect(screen.getByTestId('body-part-left-arm')).toBeInTheDocument();
    expect(screen.getByTestId('body-part-right-arm')).toBeInTheDocument();
    expect(screen.getByTestId('body-part-legs')).toBeInTheDocument();
  });

  it('applies red color for critical health', () => {
    render(<PaperDoll healthMap={{ Torso: 10 }} />);
    const torso = screen.getByTestId('body-part-torso');
    // We expect a red fill class or style when health is < 20%
    expect(torso).toHaveClass('fill-red-600');
  });

  it('applies yellow color for moderate health', () => {
    render(<PaperDoll healthMap={{ Head: 50 }} />);
    const head = screen.getByTestId('body-part-head');
    expect(head).toHaveClass('fill-yellow-500');
  });

  it('applies green color for full health', () => {
    render(<PaperDoll healthMap={{ LeftArm: 100 }} />);
    const arm = screen.getByTestId('body-part-left-arm');
    expect(arm).toHaveClass('fill-green-500');
  });
});

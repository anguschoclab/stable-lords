import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StableCrest } from './StableCrest';
import type { CrestData } from '@/types/crest.types';

const mockCrest: CrestData = {
  shieldShape: 'heater',
  fieldType: 'solid',
  primaryColor: '#DC143C',
  metalColor: 'gold',
  charge: {
    type: 'beast',
    name: 'lion',
    posture: 'rampant',
    count: 1,
  },
  generation: 0,
};

const mockComplexCrest: CrestData = {
  shieldShape: 'french',
  fieldType: 'fess',
  primaryColor: '#000080',
  secondaryColor: '#FFD700',
  metalColor: 'silver',
  charge: {
    type: 'weapon',
    name: 'sword',
    count: 2,
  },
  generation: 2,
};

describe('StableCrest Component', () => {
  it('should render a crest with solid field', () => {
    const { container } = render(<StableCrest crest={mockCrest} size="md" />);

    // Should render an SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Should have the correct viewBox
    expect(svg).toHaveAttribute('viewBox', '0 0 100 100');
  });

  it('should render with different sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const sizeMap = { xs: 16, sm: 24, md: 40, lg: 64, xl: 120 };

    sizes.forEach((size) => {
      const { container } = render(<StableCrest crest={mockCrest} size={size} />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveAttribute('width', String(sizeMap[size]));
      expect(svg).toHaveAttribute('height', String(sizeMap[size]));
    });
  });

  it('should render with custom numeric size', () => {
    const { container } = render(<StableCrest crest={mockCrest} size={150} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '150');
    expect(svg).toHaveAttribute('height', '150');
  });

  it('should render complex field patterns', () => {
    const { container } = render(<StableCrest crest={mockComplexCrest} size="lg" />);

    // Should render with mantling/helmet for larger sizes
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have accessibility label', () => {
    render(<StableCrest crest={mockCrest} size="md" />);

    // Should have aria-label with crest description
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label');
    expect(svg?.getAttribute('aria-label')).toContain('lion');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StableCrest crest={mockCrest} size="md" className="my-custom-class" />
    );

    const wrapper = container.querySelector('.stable-crest');
    expect(wrapper).toHaveClass('my-custom-class');
  });

  it('should render with generation badge for inherited crests', () => {
    const inheritedCrest = {
      ...mockCrest,
      generation: 3,
    };

    const { container } = render(<StableCrest crest={inheritedCrest} size="lg" />);

    // Should still render correctly
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render different shield shapes', () => {
    const shapes: Array<CrestData['shieldShape']> = [
      'heater',
      'french',
      'swiss',
      'spanish',
      'lozenge',
    ];

    shapes.forEach((shape) => {
      const crest = { ...mockCrest, shieldShape: shape };
      const { container } = render(<StableCrest crest={crest} size="sm" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('should render different field types', () => {
    const fields: Array<CrestData['fieldType']> = [
      'solid',
      'fess',
      'pale',
      'bend',
      'chevron',
      'cross',
      'per-pale',
      'per-fess',
    ];

    fields.forEach((fieldType) => {
      const crest = {
        ...mockCrest,
        fieldType,
        secondaryColor: fieldType !== 'solid' ? '#FFD700' : undefined,
      };
      const { container } = render(<StableCrest crest={crest} size="sm" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('should render with animation', () => {
    const { container } = render(<StableCrest crest={mockCrest} size="md" animate />);

    const wrapper = container.querySelector('.stable-crest');
    expect(wrapper).toBeInTheDocument();
  });
});

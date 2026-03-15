import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DesignBible from '../../pages/DesignBible';

// Mock the imported JSON data
vi.mock('@/data/docs.json', () => ({
  default: [
    { filename: 'DocA.md', content: 'Content for Doc A with some unique keywords like applesauce' },
    { filename: 'DocB.md', content: 'Content for Doc B' }
  ]
}));

describe('DesignBible Page', () => {
  it('renders correctly and lists documents', () => {
    render(<DesignBible />);

    // Check header
    expect(screen.getByText('Design Bibles & Archives')).toBeDefined();

    // Check if both documents are listed in the sidebar
    expect(screen.getByText('DocA')).toBeDefined();
    expect(screen.getByText('DocB')).toBeDefined();
  });

  it('selects the first document by default', () => {
    render(<DesignBible />);

    // Check if content of DocA is rendered
    expect(screen.getByText('DocA.md')).toBeDefined();
    expect(screen.getByText(/Content for Doc A/)).toBeDefined();
  });

  it('can select a different document', () => {
    render(<DesignBible />);

    // Click on DocB
    const docBButton = screen.getByRole('button', { name: /DocB/ });
    fireEvent.click(docBButton);

    // Check if content of DocB is now rendered
    expect(screen.getByText('DocB.md')).toBeDefined();
    expect(screen.getByText('Content for Doc B')).toBeDefined();
  });

  it('filters documents based on search query', () => {
    render(<DesignBible />);

    // Search for 'applesauce' (which is in DocA but not DocB)
    const searchInput = screen.getByPlaceholderText('Search specs or content...');
    fireEvent.change(searchInput, { target: { value: 'applesauce' } });

    // DocA should still be visible
    expect(screen.getByText('DocA')).toBeDefined();

    // DocB should not be visible in the list anymore
    expect(screen.queryByText('DocB')).toBeNull();
  });
});

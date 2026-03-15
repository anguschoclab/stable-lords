import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownReader } from '../../components/MarkdownReader';

describe('MarkdownReader', () => {
  it('renders markdown content correctly', () => {
    const markdownContent = '# Heading 1\n\nSome **bold** text and a [link](https://example.com)';
    render(<MarkdownReader content={markdownContent} />);

    // Check if heading is rendered
    expect(screen.getByRole('heading', { level: 1, name: 'Heading 1' })).toBeDefined();

    // Check if bold text is rendered
    const boldElement = screen.getByText('bold');
    expect(boldElement.tagName.toLowerCase()).toBe('strong');

    // Check if link is rendered
    const linkElement = screen.getByRole('link', { name: 'link' });
    expect(linkElement.getAttribute('href')).toBe('https://example.com');
  });

  it('renders tables correctly (remarkGfm)', () => {
    const markdownTable = '| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |';
    render(<MarkdownReader content={markdownTable} />);

    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByText('Col 1')).toBeDefined();
    expect(screen.getByText('Val 1')).toBeDefined();
  });
});

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownReaderProps {
  content: string;
}

export function MarkdownReader({ content }: MarkdownReaderProps) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:font-display prose-headings:text-primary
                    prose-a:text-arena-blue hover:prose-a:text-arena-gold
                    prose-code:text-accent prose-code:bg-muted/50 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-secondary prose-pre:border prose-pre:border-border"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

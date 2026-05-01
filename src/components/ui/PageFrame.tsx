import { cn } from '@/lib/utils';

interface PageFrameProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function PageFrame({ children, className, maxWidth = 'xl' }: PageFrameProps) {
  const widthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1440px]',
    full: 'max-w-full',
  };

  return (
    <main
      className={cn(
        'flex-1 flex flex-col gap-8 px-6 py-8 mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out',
        widthClasses[maxWidth],
        className
      )}
    >
      {children}
    </main>
  );
}

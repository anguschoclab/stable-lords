import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="h-screen w-screen bg-[#050506] flex flex-col items-center justify-center gap-6 font-mono text-center px-8">
        <div className="text-primary text-[10px] uppercase tracking-[0.5em] animate-pulse">
          System Failure
        </div>
        <h1 >
          Critical System Failure
        </h1>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] max-w-sm">
          Nodal link severed. All combat protocols offline.
        </p>
        {this.state.error && (
          <details className="text-left mt-2 max-w-lg w-full">
            <summary className="text-[10px] text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">
              Error Details
            </summary>
            <pre className="mt-2 text-[9px] text-red-400 bg-black/50 p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          </details>
        )}
        <button
          aria-label="Reboot System and Reload Page"
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 border border-primary text-primary text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:text-black transition-colors"
        >
          Reboot System
        </button>
      </div>
    );
  }
}

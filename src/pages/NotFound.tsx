import { useLocation, Link } from "@tanstack/react-router";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050506]">
      <div className="text-center font-mono">
        <div className="text-primary text-[10px] uppercase tracking-[0.5em] mb-4 animate-pulse">
          Route Not Found
        </div>
        <h1 className="text-white text-6xl font-bold uppercase tracking-widest mb-4">404</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] mb-8">
          This sector of the arena does not exist
        </p>
        <Link
          to="/"
          className="text-primary text-[10px] uppercase tracking-[0.4em] border border-primary px-6 py-2 hover:bg-primary hover:text-black transition-colors"
        >
          Return to Hub
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

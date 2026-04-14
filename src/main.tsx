import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cinzel/900.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";

// Initialize HowlerGlobal for Electron environment
if (typeof (window as any).HowlerGlobal === 'undefined') {
  (window as any).HowlerGlobal = {};
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <App />
    </ThemeProvider>
  </ErrorBoundary>
);

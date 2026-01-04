import { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import AtomLogo from "@/components/ui/AtomLogo";
import ResultNavigation from "@/components/ui/ResultNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResultLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

const ResultLayout = ({ children, showNavigation = true }: ResultLayoutProps) => {
  // Use mobile detection hook for responsive behavior
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-background hero-gradient">
      {/* Header */}
      <header className="w-full py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AtomLogo className="w-9 h-9 animate-rotate-slow" />
            <span className="font-display font-semibold text-xl text-foreground tracking-wide">
              AtomGuard
            </span>
          </div>
          {/* Hide subtitle on mobile devices using hook */}
          <div className={isMobile ? "hidden" : "hidden sm:flex items-center gap-2 text-sm text-muted-foreground"}>
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-body">AI-Powered Phishing Detection</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {showNavigation && <ResultNavigation />}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-border/30 mt-8">
        <p className="font-body text-center text-sm text-muted-foreground">
          AtomGuard is an educational phishing detection tool. Always verify URLs through official sources.
        </p>
      </footer>
    </div>
  );
};

export default ResultLayout;


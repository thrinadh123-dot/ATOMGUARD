import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import AtomLogo from "@/components/common/AtomLogo";
import ResultNavigation from "@/components/layout/ResultNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResultLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

const ResultLayout = ({ children, showNavigation = true }: ResultLayoutProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background hero-gradient flex flex-col">
      {/* HEADER */}
      <header className="w-full border-b border-border/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-10 min-h-[96px] md:min-h-[104px]">
          {/* Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => navigate("/")}
          >
            <AtomLogo className="w-6 h-6 md:w-7 md:h-7 animate-rotate-slow" />
            <h1 className="font-display text-xl md:text-2xl font-semibold tracking-wide text-foreground">
              AtomGuard
            </h1>
          </div>

          {/* Context */}
          {!isMobile && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Advanced Phishing Detection</span>
            </div>
          )}
        </div>
      </header>

      {/* NAVIGATION */}
      {showNavigation && (
        <div className="mt-8 mb-12 flex justify-center">
          <ResultNavigation />
        </div>
      )}

      {/* PAGE CONTENT */}
      <main className="flex-1 flex justify-center px-4 pb-16">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ResultLayout;

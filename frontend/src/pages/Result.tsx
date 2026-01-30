import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, ArrowLeft } from "lucide-react";
import ResultLayout from "@/components/ui/ResultLayout";
import { analyzeUrl, type AnalysisResult } from "@/lib/urlAnalysis";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ========== HARD ROUTE GUARD (DEFENSIVE) ==========
  // React Router location.state is ephemeral - lost on refresh or direct navigation.
  // This guard prevents blank screens and crashes by redirecting immediately.
  const state = location.state as { url?: string; result?: AnalysisResult } | null;
  const url = state?.url;

  // All hooks must be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    // Guard: If location.state is missing OR url is missing, redirect immediately
    if (!state || !url) {
      // Use replace: true to prevent back button from returning to broken state
      navigate("/", { replace: true });
      return;
    }

    // Call backend API for analysis
    const performAnalysis = async () => {
      // Reset state to prevent leaking previous verdict/explanation between analyses
      setIsLoading(true);
      setResult(null);
      try {
        const analysisResult = await analyzeUrl(url);
        setResult(analysisResult);
      } catch (error) {
        console.error('Analysis error:', error);
        // Error handling is done in analyzeUrl, so this shouldn't happen
      } finally {
        setIsLoading(false);
      }
    };

    performAnalysis();
  }, [state, url, navigate]);

  // Guard: If location.state is missing OR url is missing, return null (after hooks)
  if (!state || !url) {
    return null; // Prevent any rendering
  }

  const getVerdictIcon = () => {
    if (!result) return null;
    if (result.verdict === "PHISHING") {
      return <ShieldAlert className="w-14 h-14 md:w-16 md:h-16 text-destructive" />;
    } else if (result.verdict === "SUSPICIOUS") {
      return <AlertTriangle className="w-14 h-14 md:w-16 md:h-16 text-yellow-500" />;
    } else if (result.verdict === "PENDING") {
      return <AlertCircle className="w-14 h-14 md:w-16 md:h-16 text-muted-foreground" />;
    } else {
      return <ShieldCheck className="w-14 h-14 md:w-16 md:h-16 text-success" />;
    }
  };

  const getVerdictStyles = () => {
    if (!result) return "";
    // If ML is unavailable, show a neutral style even if fallback verdict is PHISHING/SUSPICIOUS
    if (result.mlAvailable === false) {
      return "border-border/50 bg-secondary/30";
    }
    if (result.verdict === "PHISHING") {
      return "border-destructive/30 bg-destructive/5";
    } else if (result.verdict === "SUSPICIOUS") {
      return "border-yellow-500/30 bg-yellow-500/5";
    } else if (result.verdict === "PENDING") {
      return "border-border/50 bg-secondary/30";
    } else {
      return "border-success/30 bg-success/5";
    }
  };

  const getVerdictTextColor = () => {
    if (!result) return "";
    if (result.mlAvailable === false) {
      return "text-muted-foreground";
    }
    if (result.verdict === "PHISHING") {
      return "text-destructive";
    } else if (result.verdict === "SUSPICIOUS") {
      return "text-yellow-500";
    } else if (result.verdict === "PENDING") {
      return "text-muted-foreground";
    } else {
      return "text-success";
    }
  };

  const getRiskLevelColor = () => {
    if (!result) return "";
    // Cap UI risk color at Medium when ML is unavailable
    if (result.mlAvailable === false) {
      if (result.riskLevel === "High") {
        return "text-yellow-500"; // Cap at Medium color
      } else if (result.riskLevel === "Medium") {
        return "text-yellow-500";
      } else if (result.riskLevel === "Unknown") {
        return "text-muted-foreground";
      } else {
        return "text-success";
      }
    }
    if (result.riskLevel === "High") {
      return "text-destructive";
    } else if (result.riskLevel === "Medium") {
      return "text-yellow-500";
    } else if (result.riskLevel === "Unknown") {
      return "text-muted-foreground";
    } else {
      return "text-success";
    }
  };

  // Generate one-line summary (simple, non-technical)
  const getOneLineSummary = () => {
    if (!result) return "";
    
    if (result.verdict === "PHISHING") {
      return "This URL shows multiple characteristics commonly associated with phishing websites.";
    } else if (result.verdict === "SUSPICIOUS") {
      return "This URL shows some warning signs that require caution.";
    } else {
      return "This URL appears safe based on standard security indicators.";
    }
  };

  // Get simplified verdict text
  const getVerdictText = () => {
    if (!result) return "";
    
    if (result.mlAvailable === false) {
      return "PRELIMINARY ANALYSIS";
    }
    
    if (result.verdict === "PHISHING") {
      return "PHISHING DETECTED";
    } else if (result.verdict === "SUSPICIOUS") {
      return "SUSPICIOUS";
    } else if (result.verdict === "PENDING") {
      return "VERDICT: PENDING";
    } else {
      return "SAFE URL";
    }
  };

  return (
    <ResultLayout>
      <div className="pt-6">
        {isLoading ? (
          <div className="glass-card p-12 text-center animate-fade-in-up">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Analyzing URL...
            </h2>
            <p className="font-body text-base text-muted-foreground">
              Checking for phishing patterns
            </p>
          </div>
        ) : result ? (
          <div className="space-y-6 animate-fade-in-up w-full">
          {/* B. ANALYZED URL (Context - Subtle but Readable) */}
          <div className="text-center">
            <p className="font-body text-sm font-medium text-muted-foreground mb-2 tracking-wide">
              Analyzed URL
            </p>
            <div 
              className="inline-block px-4 py-2.5 rounded-lg bg-secondary/50 border border-border/50 max-w-full"
              title={url} // Full URL on hover
            >
              <p className="font-mono text-sm text-foreground break-all max-w-2xl">
                {url.length > 80 ? `${url.substring(0, 80)}...` : url}
              </p>
            </div>
          </div>

          {/* A. DETECTION RESULT CARD (Hero Section - Dominant) */}
          <div 
            className={`glass-card px-8 py-5 md:px-10 md:py-6 lg:px-12 lg:py-7 text-center border-2 ${getVerdictStyles()} shadow-lg`}
          >
            {/* 1. Status Icon */}
            <div className="inline-flex p-2.5 rounded-full bg-background/50 mb-3">
              {getVerdictIcon()}
            </div>

            {/* 2. Verdict (Most Important - Large, Commanding) */}
            <h1 
              className={`font-display ${
                result.verdict === "SUSPICIOUS" 
                  ? "text-3xl md:text-4xl lg:text-4xl xl:text-5xl"
                  : "text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
              } font-bold mb-3 ${getVerdictTextColor()}`}
            >
              {getVerdictText()}
            </h1>
            
            {/* 3. One-Line Summary (Readable, Not Tiny) */}
            <p className="font-body text-base md:text-lg text-foreground/80 mb-4 max-w-2xl mx-auto leading-relaxed">
              {getOneLineSummary()}
            </p>

            {/* 4. Risk & Confidence (Clear Badge Size, Easy to Scan) */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              {/* Risk Level Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-border/50">
                <span className="font-body text-sm text-muted-foreground">Risk Level:</span>
                <span className={`font-display font-semibold text-sm ${getRiskLevelColor()}`}>
                  {result.riskLevel === "Unknown" ? "Unknown" : result.riskLevel}
                </span>
              </div>

              {/* Detection Confidence */}
              {/* PHISHING → show high confidence, SUSPICIOUS → show confidence, SAFE → hide low confidence */}
              {result.backendAvailable && result.mlAvailable !== false && typeof result.confidence === "number" && 
               (result.verdict === "PHISHING" || result.verdict === "SUSPICIOUS" || result.confidence >= 50) && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-border/50">
                  <span className="font-body text-sm text-muted-foreground">Detection Confidence:</span>
                  <span className="font-display font-semibold text-sm text-foreground">
                    {result.confidence}%
                  </span>
                </div>
              )}
              {result.backendAvailable && result.mlAvailable === false && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-border/50">
                  <span className="font-body text-sm text-muted-foreground">Detection Confidence:</span>
                  <span className="font-display font-semibold text-sm text-muted-foreground">
                    Unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Confidence Explanation (Optional, Subtle) */}
            {result.backendAvailable && result.mlAvailable !== false && typeof result.confidence === "number" && 
             (result.verdict === "PHISHING" || result.verdict === "SUSPICIOUS" || result.confidence >= 50) && (
              <p className="font-body text-xs text-muted-foreground mt-3">
                Confidence based on multiple URL and security indicators.
              </p>
            )}
          </div>

          {/* D. Action Buttons (Immediately Below Card - Large, Actionable) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
            {/* Primary CTA */}
            <button
              onClick={() => navigate("/")}
              className="btn-primary font-body text-base inline-flex items-center gap-2 px-6 py-3 w-full sm:w-auto"
            >
              <ArrowLeft className="w-5 h-5" />
              Check Another URL
            </button>

            {/* Secondary: View Details */}
            <button
              onClick={() => navigate("/result/what-we-checked", { state: { url } })}
              className="font-body text-base px-6 py-3 rounded-lg border border-border/50 bg-secondary/30 text-foreground hover:bg-secondary/50 transition-colors w-full sm:w-auto"
            >
              View Details
            </button>
          </div>
        </div>
        ) : (
          // Fallback: If result is missing after analysis completes
          <div className="glass-card p-12 text-center animate-fade-in-up">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              No analysis result found
            </h2>
            <p className="font-body text-muted-foreground mb-6">
              Please analyze a URL again.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn-primary font-body inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Go to Home
            </button>
          </div>
        )}
      </div>
    </ResultLayout>
  );
};

export default Result;
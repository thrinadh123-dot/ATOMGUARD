import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ResultLayout from "@/components/ui/ResultLayout";
import { analyzeUrl, type AnalysisResult } from "@/lib/urlAnalysis";

const Summary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const url = (location.state as { url?: string })?.url;

  useEffect(() => {
    if (!url) {
      navigate("/");
      return;
    }

    // Call backend API for analysis
    const performAnalysis = async () => {
      try {
        const analysisResult = await analyzeUrl(url);
        setResult(analysisResult);
      } catch (error) {
        console.error('Analysis error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performAnalysis();
  }, [url, navigate]);

  if (!url) return null;

  const calculateRiskScore = (result: AnalysisResult): number | string => {
    if (result.verdict === "PENDING") {
      return "N/A";
    }
    
    let score = 0;
    const totalChecks = result.checkedItems.length;
    const riskFactors = result.evidence.filter((e) => e.status === "danger" || e.status === "warning").length;
    
    if (result.verdict === "PHISHING") {
      score = Math.min(100, 70 + riskFactors * 10);
    } else if (result.verdict === "SUSPICIOUS") {
      score = Math.min(100, 40 + riskFactors * 10);
    } else {
      score = Math.max(0, 20 - riskFactors * 5);
    }
    
    return Math.round(score);
  };

  const getRiskLevelText = (riskLevel: string): string => {
    return riskLevel.toLowerCase();
  };

  return (
    <ResultLayout showNavigation={false}>
      {isLoading ? (
        <div className="glass-card p-12 text-center animate-fade-in-up">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Loading...
          </h2>
        </div>
      ) : result && (
        <div className="space-y-8 animate-fade-in-up max-w-3xl mx-auto">
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
                Analysis Summary
              </h1>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3 pb-4 border-b border-border/40">
                <h2 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Case Reference</h2>
                <p className="font-mono text-sm text-foreground bg-secondary/30 px-4 py-3 rounded border border-border/40 break-all select-all">
                  {url}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <h2 className="font-display text-xl font-bold text-foreground">Verdict</h2>
                  <p className="font-display text-3xl font-bold text-foreground">
                    {result.verdict === "PENDING" ? "PENDING" : result.verdict}
                  </p>
                  {result.verdict === "PENDING" && (
                    <p className="font-body text-sm text-muted-foreground">
                      Backend ML analysis unavailable. Showing preliminary technical indicators only.
                    </p>
                  )}
                </div>
                <div className="space-y-2 pt-1">
                  <h2 className="font-display text-xl font-bold text-foreground">Risk Level</h2>
                  <p className="font-display text-2xl font-bold text-foreground uppercase tracking-wide">
                    {result.riskLevel === "Unknown" ? "UNKNOWN" : result.riskLevel}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-border/30">
                <h2 className="font-display text-xl font-bold text-foreground">Explanation</h2>
                <p className="font-body text-foreground leading-relaxed">{result.explanation}</p>
              </div>

              <div className="space-y-3 pt-6 border-t border-border/30">
                <h2 className="font-display text-xl font-bold text-foreground">What We Checked</h2>
                <ul className="space-y-2.5 mt-3">
                  {result.checkedItems.map((item, index) => (
                    <li key={index} className="font-body text-foreground leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 pt-6 border-t border-border/30">
                <h2 className="font-display text-xl font-bold text-foreground">Evidence Indicators</h2>
                <ul className="space-y-2.5 mt-3">
                  {result.evidence.map((item, index) => {
                    const statusText = item.status === "safe" ? "SAFE" : item.status === "warning" ? "WARNING" : "RISK";
                    return (
                      <li key={index} className="font-body text-foreground leading-relaxed">
                        • {item.label}: <span className="font-bold uppercase tracking-wide">{statusText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                {result.verdict !== "PENDING" && (
                  <p className="font-body text-foreground italic">
                    Based on the above analysis, the overall risk level is {getRiskLevelText(result.riskLevel)}.
                  </p>
                )}
                {result.verdict === "PENDING" && (
                  <p className="font-body text-foreground italic">
                    Final risk assessment requires ML analysis which is currently unavailable.
                  </p>
                )}
                <h2 className="font-display text-xl font-bold text-foreground pt-2">Final Risk Score</h2>
                <p className="font-display text-3xl font-bold text-foreground">
                  {calculateRiskScore(result) === "N/A" ? "N/A" : `${calculateRiskScore(result)}/100`}
                </p>
                {result.verdict === "PENDING" && (
                  <p className="font-body text-xs text-muted-foreground mt-2">
                    Risk score calculation requires ML analysis.
                  </p>
                )}
              </div>
            </div>

            {/* Check Another URL Button */}
            <div className="text-center pt-8 border-t border-border/50">
              <button
                onClick={() => navigate("/")}
                className="btn-primary font-body inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Check Another URL
              </button>
            </div>
          </div>
        </div>
      )}
    </ResultLayout>
  );
};

export default Summary;


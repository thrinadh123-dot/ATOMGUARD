import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import ResultLayout from "@/components/ui/ResultLayout";
import { analyzeUrl, type AnalysisResult } from "@/lib/urlAnalysis";

const WhatWeChecked = () => {
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

  const getIndicatorIcon = (icon: string, status: string) => {
    const iconClass = status === "safe" 
      ? "text-success" 
      : status === "warning" 
      ? "text-yellow-500" 
      : "text-destructive";
    
    switch (icon) {
      case "check":
        return <CheckCircle2 className={`w-5 h-5 ${iconClass}`} />;
      case "x":
        return <XCircle className={`w-5 h-5 ${iconClass}`} />;
      case "alert":
        return <AlertCircle className={`w-5 h-5 ${iconClass}`} />;
      default:
        return <AlertCircle className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  const getIndicatorStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "border-success/30 bg-success/5";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "danger":
        return "border-destructive/30 bg-destructive/5";
      default:
        return "border-border/30 bg-secondary/5";
    }
  };

  return (
    <ResultLayout>
      {isLoading ? (
        <div className="glass-card p-12 text-center animate-fade-in-up">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Loading...
          </h2>
        </div>
      ) : result && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="glass-card p-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
              What we checked
            </h1>
            
            {!result.backendAvailable && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="font-body text-sm text-yellow-600 dark:text-yellow-400 mb-2">
                  ⚠️ <strong>Preliminary Technical Analysis</strong>
                </p>
                <p className="font-body text-xs text-yellow-600/80 dark:text-yellow-400/80">
                  Backend ML analysis is currently unavailable. The indicators shown below are technical parameters that were evaluated. These checks are indicators and do not individually determine the final result. The final verdict requires ML analysis.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {result.frontendIndicators && result.frontendIndicators.length > 0 ? (
                <div className="space-y-3">
                  {result.frontendIndicators.map((indicator, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${getIndicatorStatusColor(indicator.status)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {getIndicatorIcon(indicator.icon, indicator.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-display text-sm font-semibold text-foreground">
                              {indicator.parameter}
                            </h3>
                            <span className={`font-body text-xs font-medium ${
                              indicator.status === "safe" 
                                ? "text-success" 
                                : indicator.status === "warning" 
                                ? "text-yellow-500" 
                                : "text-destructive"
                            }`}>
                              {indicator.status === "safe" ? "✓ Normal" : 
                               indicator.status === "warning" ? "⚠ Warning" : 
                               "✗ Risk"}
                            </span>
                          </div>
                          <p className="font-body text-sm text-foreground/90 mb-2">
                            {indicator.message}
                          </p>
                          <p className="font-body text-xs text-muted-foreground leading-relaxed">
                            {indicator.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {result.checkedItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-primary">{index + 1}</span>
                      </div>
                      <p className="font-body text-foreground/80 leading-relaxed flex-1">
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 pt-6 border-t border-border/30">
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Important:</strong> These checks are indicators and do not individually determine the final result. We evaluated multiple technical parameters and derived the result using combined ML analysis. Each indicator provides insight into one aspect of the URL's structure and should be considered as part of the overall analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </ResultLayout>
  );
};

export default WhatWeChecked;


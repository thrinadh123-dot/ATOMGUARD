import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ResultLayout from "@/components/ui/ResultLayout";
import { analyzeUrl, type AnalysisResult } from "@/lib/urlAnalysis";

const HowItWorks = () => {
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
      // Reset state to prevent leaking previous analysis between URLs
      setIsLoading(true);
      setResult(null);
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
              How to identify phishing URLs
            </h1>
            <div className="space-y-4">
              <ul className="space-y-3">
                {result.identificationTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">{index + 1}</span>
                    </div>
                    <p className="font-body text-foreground/80 leading-relaxed flex-1">
                      {tip}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </ResultLayout>
  );
};

export default HowItWorks;


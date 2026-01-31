import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ResultLayout from "@/components/layout/ResultLayout";
import { analyzeUrl } from "@/services/analysisService";
import type { AnalysisResult } from "@/types/analysis";

const Summary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // Improve quality
        useCORS: true,
        backgroundColor: '#09090b', // Dark theme background
        logging: false,
        onclone: (clonedDoc) => {
            // Ensure the cloned element has the correct background and padding if needed
            const element = clonedDoc.getElementById('pdf-content');
            if (element) {
                element.style.padding = '2rem';
                element.style.backgroundColor = '#09090b';
            }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('AtomGuard_Analysis_Report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!url) return null;

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
            <div className="flex justify-between items-start mb-8">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Analysis Summary
              </h1>
              <button
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Analyze another URL
              </button>
            </div>
            
            <div id="pdf-content" ref={contentRef} className="space-y-8">
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
                    {result.mlAvailable === false
                      ? "PRELIMINARY ANALYSIS"
                      : result.verdict === "PENDING"
                      ? "PENDING"
                      : result.verdict}
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
                    {result.riskLevel === "Unknown"
                      ? "UNKNOWN"
                      : result.mlAvailable === false && result.riskLevel === "High"
                      ? "Medium"
                      : result.riskLevel}
                  </p>
                </div>
                {result.backendAvailable && result.mlAvailable !== false && typeof result.confidence === "number" && (
                  <div className="space-y-2 pt-1">
                    <h2 className="font-display text-xl font-bold text-foreground">ML Confidence</h2>
                    <p className="font-display text-2xl font-bold text-foreground uppercase tracking-wide">
                      {result.confidence}%
                    </p>
                  </div>
                )}
                {result.backendAvailable && result.mlAvailable === false && (
                  <div className="space-y-2 pt-1">
                    <h2 className="font-display text-xl font-bold text-foreground">ML Confidence</h2>
                    <p className="font-display text-2xl font-bold text-muted-foreground uppercase tracking-wide">
                      ML unavailable
                    </p>
                  </div>
                )}
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
                <p className="font-body text-xs text-muted-foreground mt-2">
                  This summary displays backend results as-is. No client-side risk scoring is computed.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-border/50">
              <button
                onClick={() => navigate("/")}
                className="btn-primary font-body inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Check Another URL
              </button>

              <button
                onClick={handleDownloadPDF}
                className="font-body text-base px-6 py-3 rounded-xl border border-border/50 bg-secondary/30 text-foreground hover:bg-secondary/50 transition-colors inline-flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </ResultLayout>
  );
};

export default Summary;


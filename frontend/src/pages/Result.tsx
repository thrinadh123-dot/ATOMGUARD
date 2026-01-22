import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, AlertCircle, ArrowLeft, Lock, Globe, Link2, AlertTriangle as AlertIcon } from "lucide-react";
import ResultLayout from "@/components/ui/ResultLayout";
import { analyzeUrl, type AnalysisResult } from "@/lib/urlAnalysis";

interface RiskCard {
  icon: React.ReactNode;
  category: string;
  status: "safe" | "risk";
  explanation: string;
  confidence: number;
  statusLabel: "Safe" | "Warning" | "Risk";
}

const Result = () => {
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
        // Error handling is done in analyzeUrl, so this shouldn't happen
      } finally {
        setIsLoading(false);
      }
    };

    performAnalysis();
  }, [url, navigate]);

  if (!url) return null;

  const getVerdictIcon = () => {
    if (!result) return null;
    if (result.verdict === "PHISHING") {
      return <ShieldAlert className="w-12 h-12 text-destructive" />;
    } else if (result.verdict === "SUSPICIOUS") {
      return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
    } else if (result.verdict === "PENDING") {
      return <AlertCircle className="w-12 h-12 text-muted-foreground" />;
    } else {
      return <ShieldCheck className="w-12 h-12 text-success" />;
    }
  };

  const getVerdictStyles = () => {
    if (!result) return "";
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

  const getEvidenceIcon = (icon: string) => {
    switch (icon) {
      case "check":
        return <CheckCircle2 className="w-4 h-4" />;
      case "x":
        return <XCircle className="w-4 h-4" />;
      case "alert":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getVerdictJustification = (result: AnalysisResult): string => {
    if (result.verdict === "PHISHING") {
      return "We evaluated multiple technical indicators and derived this result using combined ML analysis. Multiple security indicators flagged this URL as potentially malicious.";
    } else if (result.verdict === "SUSPICIOUS") {
      return "We evaluated multiple technical indicators and derived this result using combined ML analysis. Some security concerns were detected, but the URL may still be legitimate.";
    } else if (result.verdict === "PENDING") {
      return result.explanation || "Preliminary technical analysis (backend unavailable). We evaluated multiple technical indicators, but the final verdict requires ML analysis which is currently unavailable.";
    } else {
      return "We evaluated multiple technical indicators and derived this result using combined ML analysis. Overall, the URL passes critical security checks and is considered safe.";
    }
  };

  const getRiskSnapshot = (result: AnalysisResult, url: string): RiskCard[] => {
    const lowerUrl = url.toLowerCase().trim();
    const urlLength = url.length;
    
    // Protocol Security
    const hasHttps = lowerUrl.startsWith("https://");
    const protocolCard: RiskCard = {
      icon: <Lock className="w-5 h-5" />,
      category: "Protocol Security",
      status: hasHttps ? "safe" : "risk",
      explanation: hasHttps ? "Uses secure connection" : "Uses insecure connection",
      confidence: hasHttps ? 95 : 30,
      statusLabel: hasHttps ? "Safe" : "Risk",
    };

    // Domain Pattern
    let domain = "";
    try {
      const urlObj = new URL(lowerUrl.startsWith("http") ? lowerUrl : `https://${lowerUrl}`);
      domain = urlObj.hostname;
    } catch {
      domain = lowerUrl.split("/")[0].split("?")[0];
    }

    const suspiciousFreeDomains = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz"];
    const hasSuspiciousTld = suspiciousFreeDomains.some((tld) => domain.endsWith(tld));
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    const isIP = ipPattern.test(domain);
    const brandPatterns = [
      { pattern: /paypa[l1]|paypai/i },
      { pattern: /amaz[o0]n|amazn/i },
      { pattern: /g[o0]{2}gle|go0gle/i },
      { pattern: /micr[o0]soft|micrsoft/i },
      { pattern: /app[1l]e|aple/i },
      { pattern: /faceb[o0]ok|facebok/i },
      { pattern: /tw[i1]tter|twtter/i },
    ];
    const hasBrandImitation = brandPatterns.some((p) => p.pattern.test(lowerUrl));
    const domainRisk = hasSuspiciousTld || isIP || hasBrandImitation;
    const domainCard: RiskCard = {
      icon: <Globe className="w-5 h-5" />,
      category: "Domain Pattern",
      status: domainRisk ? "risk" : "safe",
      explanation: domainRisk ? "Suspicious domain structure" : "Standard domain format",
      confidence: domainRisk ? (hasSuspiciousTld ? 25 : hasBrandImitation ? 40 : 20) : 85,
      statusLabel: domainRisk ? "Risk" : "Safe",
    };

    // URL Structure
    const isLongUrl = urlLength > 75;
    const hasUnusualFormatting = /[-.]{2,}/.test(lowerUrl) || /[a-z]+\.[a-z]+\.[a-z]+\.[a-z]+/i.test(domain);
    const urlStructureRisk = isLongUrl || hasUnusualFormatting;
    const urlCard: RiskCard = {
      icon: <Link2 className="w-5 h-5" />,
      category: "URL Structure",
      status: urlStructureRisk ? "risk" : "safe",
      explanation: urlStructureRisk ? "Abnormal URL length" : "Normal URL length",
      confidence: urlStructureRisk ? 55 : 80,
      statusLabel: urlStructureRisk ? "Warning" : "Safe",
    };

    // Content Indicators
    const suspiciousKeywords = [
      { pattern: /(login|signin|verify|secure|update|confirm|account)/i },
      { pattern: /(bank|password|credential|payment|billing)/i },
    ];
    const hasSuspiciousKeywords = suspiciousKeywords.some((kw) => kw.pattern.test(lowerUrl));
    const contentCard: RiskCard = {
      icon: <AlertIcon className="w-5 h-5" />,
      category: "Content Indicators",
      status: hasSuspiciousKeywords ? "risk" : "safe",
      explanation: hasSuspiciousKeywords ? "Contains phishing keywords" : "No suspicious keywords",
      confidence: hasSuspiciousKeywords ? 65 : 90,
      statusLabel: hasSuspiciousKeywords ? "Warning" : "Safe",
    };

    return [protocolCard, domainCard, urlCard, contentCard];
  };

  return (
    <ResultLayout>
          {isLoading ? (
            <div className="glass-card p-12 text-center animate-fade-in-up">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Analyzing URL...
              </h2>
              <p className="font-body text-muted-foreground">
                Checking for phishing patterns
              </p>
            </div>
          ) : result && (
        <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto">
          {/* Analyzed URL Section */}
          <div className="text-center">
                <p className="font-body text-sm text-muted-foreground mb-2">Analyzed URL</p>
            <div className="inline-block px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
              <p className="font-mono text-sm text-foreground break-all max-w-2xl">
                  {url}
                </p>
              </div>
                </div>

          {/* Verdict Card */}
          <div className={`glass-card p-6 md:p-8 text-center border-2 ${getVerdictStyles()}`}>
            <div className="inline-flex p-3 rounded-full bg-background/50 mb-4">
              {getVerdictIcon()}
            </div>
            <h1 className={`font-display text-3xl md:text-4xl font-bold mb-3 ${getVerdictTextColor()}`}>
              {result.verdict === "PHISHING" ? "PHISHING DETECTED" : 
               result.verdict === "SUSPICIOUS" ? "SUSPICIOUS" : 
               result.verdict === "PENDING" ? "VERDICT: PENDING" : 
               "SAFE"}
                </h1>
            <p className="font-body text-foreground/90 text-sm md:text-base mb-4 leading-relaxed max-w-xl mx-auto font-medium">
              {getVerdictJustification(result)}
            </p>
            {result.verdict !== "PENDING" && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-border/50 mb-2">
                <span className="font-body text-xs text-muted-foreground">Risk Level:</span>
                <span className={`font-display font-semibold text-xs ${getRiskLevelColor()}`}>
                  {result.riskLevel}
                </span>
              </div>
            )}
            {result.verdict === "PENDING" && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 border border-border/50 mb-2">
                <span className="font-body text-xs text-muted-foreground">Risk Level:</span>
                <span className={`font-display font-semibold text-xs ${getRiskLevelColor()}`}>
                  Unknown
                </span>
              </div>
            )}
            {!result.backendAvailable && (
              <div className="mt-3 px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="font-body text-xs text-yellow-600 dark:text-yellow-400 text-center">
                  ⚠️ Backend ML analysis unavailable. Showing preliminary technical indicators only.
                </p>
              </div>
            )}
            <p className="font-body text-foreground/70 text-xs mt-3 leading-relaxed max-w-xl mx-auto">
              {result.explanation}
            </p>
              </div>

          {/* Risk Snapshot - Only show if backend is available */}
          {result.backendAvailable && (
          <div className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">
              Risk Snapshot
                </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const snapshotCards = getRiskSnapshot(result, url);
                const highestConfidence = Math.max(...snapshotCards.map(c => c.confidence));
                return snapshotCards.map((card, index) => {
                  const isPrimaryFactor = card.confidence === highestConfidence && card.confidence >= 85;
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-2 ${
                        card.status === "safe"
                          ? "border-success/30 bg-success/5"
                          : "border-destructive/30 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            card.status === "safe"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-display text-sm font-semibold text-foreground">
                              {card.category}
                            </h3>
                            {isPrimaryFactor && (
                              <span className="font-body text-xs text-muted-foreground italic">
                                Primary factor
                              </span>
                            )}
                            <span className="font-body text-xs text-muted-foreground">
                              — {card.confidence}%
                            </span>
                            <span className={`font-body text-xs font-bold ${
                              card.statusLabel === "Safe" ? "text-success" : 
                              card.statusLabel === "Warning" ? "text-yellow-500" : 
                              "text-destructive"
                            }`}>
                              ({card.statusLabel.toUpperCase()})
                            </span>
                            {card.status === "safe" ? (
                              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive shrink-0" />
                            )}
                          </div>
                      <p
                        className={`font-body text-xs ${
                          card.status === "safe" ? "text-success/80" : "text-destructive/80"
                        }`}
                      >
                        {card.explanation}
                      </p>
                    </div>
                  </div>
                </div>
                  );
                });
              })()}
            </div>
            <p className="font-body text-xs text-muted-foreground mt-4 text-center">
              Percentages indicate estimated confidence levels for each indicator, not absolute certainty.
            </p>
            {result.verdict === "SAFE" && getRiskSnapshot(result, url).some(card => card.status === "risk") && (
              <p className="font-body text-xs text-muted-foreground mt-3 text-center italic">
                Minor anomalies were detected but were not sufficient to mark the URL as unsafe.
              </p>
            )}
              </div>
          )}

          {/* View Analysis Summary Button */}
          <div className="text-center">
            <button
              onClick={() => navigate("/result/summary", { state: { url } })}
              className="font-body px-6 py-2.5 rounded-xl border border-border/50 bg-secondary/30 text-foreground hover:bg-secondary/50 transition-colors"
            >
              View Analysis Summary
            </button>
          </div>

          {/* Check Another URL Button */}
          <div className="text-center pt-2">
                <button
                  onClick={() => navigate("/")}
                  className="btn-primary font-body inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Check Another URL
                </button>
              </div>
            </div>
          )}
    </ResultLayout>
  );
};

export default Result;


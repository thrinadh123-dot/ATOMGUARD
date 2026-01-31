/**
 * ResultDisplay Component
 * 
 * FUTURE USE COMPONENT
 * 
 * This component is defined for future use in displaying URL analysis results
 * in a simplified format. Currently, the Result.tsx page uses its own
 * custom display logic.
 * 
 * Usage: This component can be integrated into Result.tsx or other pages
 * when a standardized result display format is needed.
 * 
 * To use: Import this component and pass an AnalysisResult object as prop
 */

import { Shield, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

interface AnalysisResult {
  isSafe: boolean;
  reasons: string[];
  confidence: number;
}

interface ResultDisplayProps {
  result: AnalysisResult;
}

const ResultDisplay = ({ result }: ResultDisplayProps) => {
  const { isSafe, reasons } = result;

  return (
    <div
      className={`w-full max-w-2xl mx-auto rounded-2xl border p-8 animate-fade-in-up ${
        isSafe ? "result-safe" : "result-phishing"
      }`}
    >
      {/* Status Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div
          className={`p-4 rounded-2xl ${
            isSafe ? "bg-success/10" : "bg-destructive/10"
          }`}
        >
          {isSafe ? (
            <Shield className="w-12 h-12 text-success" />
          ) : (
            <ShieldAlert className="w-12 h-12 text-destructive" />
          )}
        </div>
        <div className="text-left">
          <p className="text-muted-foreground text-sm font-medium mb-1">
            Analysis Result
          </p>
          <h2
            className={`text-3xl font-display font-bold ${
              isSafe ? "text-success" : "text-destructive"
            }`}
          >
            {isSafe ? "SAFE" : "PHISHING"}
          </h2>
        </div>
      </div>

      {/* Reasons */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Why we think this
        </h3>
        {reasons.map((reason, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 border border-border/50 animate-fade-in-up"
            style={{ animationDelay: `${(index + 1) * 100}ms` }}
          >
            {isSafe ? (
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            )}
            <p className="text-foreground/90 text-sm leading-relaxed">{reason}</p>
          </div>
        ))}
      </div>

      {/* Footer tip */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <p className="text-muted-foreground text-xs text-center">
          {isSafe
            ? "This URL appears legitimate, but always stay cautious with sensitive information."
            : "We recommend not visiting this URL. When in doubt, go directly to the official website."}
        </p>
      </div>
    </div>
  );
};

export default ResultDisplay;

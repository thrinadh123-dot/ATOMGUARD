export type Verdict = "PHISHING" | "SAFE" | "SUSPICIOUS" | "PENDING";
export type RiskLevel = "Low" | "Medium" | "High" | "Unknown";

export interface EvidenceIndicator {
  label: string;
  status: "safe" | "warning" | "danger";
  icon: "check" | "x" | "alert";
}

export interface AnalysisResult {
  verdict: Verdict;
  riskLevel: RiskLevel;
  confidence?: number; // ML confidence score (0-100 percentage)
  explanation: string;
  evidence: EvidenceIndicator[];
  checkedItems: string[];
  identificationTips: string[];
  actionSteps: string[];
  backendAvailable: boolean;
  mlAvailable?: boolean;
  frontendIndicators?: Array<{
    parameter: string;
    status: "safe" | "warning" | "danger";
    icon: "check" | "alert" | "x";
    message: string;
    explanation: string;
  }>;
}

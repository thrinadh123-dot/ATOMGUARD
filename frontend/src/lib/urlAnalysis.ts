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
  explanation: string;
  evidence: EvidenceIndicator[];
  checkedItems: string[];
  identificationTips: string[];
  actionSteps: string[];
  backendAvailable: boolean;
  frontendIndicators?: Array<{
    parameter: string;
    status: "safe" | "warning" | "danger";
    icon: "check" | "alert" | "x";
    message: string;
    explanation: string;
  }>;
}

/* ---------------- API CONFIGURATION ---------------- */

// Backend API URL - defaults to localhost:5000 for development
// In production, this should be set via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ---------------- FRONTEND INDICATOR EXTRACTION ---------------- */

import { extractFrontendIndicators, indicatorsToCheckedItems, type URLIndicator } from './frontendIndicators';

/**
 * Always extracts frontend indicators (runs regardless of backend availability)
 * These are technical indicators only - NOT verdicts
 */
function getFrontendIndicators(url: string): URLIndicator[] {
  return extractFrontendIndicators(url);
}

/* ---------------- MAIN ANALYSIS (API CALL) ---------------- */

/**
 * Analyzes a URL by:
 * 1. Always extracting frontend indicators
 * 2. Attempting backend ML analysis
 * 3. Gracefully falling back to frontend-only if backend unavailable
 * 
 * IMPORTANT: Frontend never makes verdicts. Only backend ML can determine final verdict.
 * 
 * @param url - The URL string to analyze
 * @returns Promise<AnalysisResult> - Analysis result with backend verdict or frontend indicators only
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  // ALWAYS extract frontend indicators first
  const frontendIndicators = getFrontendIndicators(url);
  const frontendCheckedItems = indicatorsToCheckedItems(frontendIndicators);
  
  try {
    // Attempt to call Flask backend API
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url.trim() }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      // Backend returned error - fall back to frontend-only
      console.warn(`Backend returned error ${response.status}. Using frontend indicators only.`);
      
      return {
        verdict: "PENDING",
        riskLevel: "Unknown",
        explanation: "Preliminary technical analysis (backend unavailable). We evaluated multiple technical indicators, but the final verdict requires ML analysis which is currently unavailable.",
        evidence: frontendIndicators.map(ind => ({
          label: ind.parameter,
          status: ind.status,
          icon: ind.icon,
        })),
        checkedItems: frontendCheckedItems,
        identificationTips: [
          "Check for misspelled or altered brand names",
          "Look for urgent action keywords like 'verify' or 'confirm'",
          "Be cautious of free domain extensions",
          "Avoid entering sensitive information unless the site is verified"
        ],
        actionSteps: [
          "Review the technical indicators shown above",
          "Proceed with caution until full analysis is available",
          "Verify the URL through official sources if possible"
        ],
        backendAvailable: false,
        frontendIndicators: frontendIndicators,
      };
    }

    // Parse successful backend response
    const backendData: Omit<AnalysisResult, 'backendAvailable' | 'frontendIndicators'> = await response.json();
    
    // Merge backend result with frontend indicators for educational display
    return {
      ...backendData,
      backendAvailable: true,
      frontendIndicators: frontendIndicators,
      // Ensure checkedItems includes both backend and frontend checks
      checkedItems: [
        ...(backendData.checkedItems || []),
        ...frontendCheckedItems,
      ],
    };

  } catch (error) {
    // Network failure or parsing error - graceful fallback to frontend-only
    console.warn('Backend unavailable. Using frontend indicators only:', error);
    
    return {
      verdict: "PENDING",
      riskLevel: "Unknown",
      explanation: "Preliminary technical analysis (backend unavailable). We evaluated multiple technical indicators, but the final verdict requires ML analysis which is currently unavailable.",
      evidence: frontendIndicators.map(ind => ({
        label: ind.parameter,
        status: ind.status,
        icon: ind.icon,
      })),
      checkedItems: frontendCheckedItems,
      identificationTips: [
        "Check for misspelled or altered brand names",
        "Look for urgent action keywords like 'verify' or 'confirm'",
        "Be cautious of free domain extensions",
        "Avoid entering sensitive information unless the site is verified"
      ],
      actionSteps: [
        "Review the technical indicators shown above",
        "Proceed with caution until full analysis is available",
        "Verify the URL through official sources if possible"
      ],
      backendAvailable: false,
      frontendIndicators: frontendIndicators,
    };
  }
};


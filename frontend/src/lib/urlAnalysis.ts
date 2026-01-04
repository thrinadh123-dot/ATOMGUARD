export type Verdict = "PHISHING" | "SAFE" | "SUSPICIOUS";
export type RiskLevel = "Low" | "Medium" | "High";

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
}

/* ---------------- API CONFIGURATION ---------------- */

// Backend API URL - defaults to localhost:5000 for development
// In production, this should be set via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ---------------- MAIN ANALYSIS (API CALL) ---------------- */

/**
 * Analyzes a URL by calling the Flask backend API
 * 
 * This function sends the URL to the backend for analysis and returns
 * the structured result. Includes error handling for network failures
 * and backend errors.
 * 
 * @param url - The URL string to analyze
 * @returns Promise<AnalysisResult> - Analysis result from backend
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  try {
    // Call Flask backend API
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url.trim() }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If backend returns error with verdict, use it; otherwise use fallback
      if (errorData.verdict && errorData.riskLevel) {
        return {
          verdict: errorData.verdict as Verdict,
          riskLevel: errorData.riskLevel as RiskLevel,
          explanation: errorData.error || 'Analysis failed',
          evidence: [],
          checkedItems: [],
          identificationTips: ['Ensure the URL is complete and properly formatted'],
          actionSteps: ['Please try again with a valid URL'],
        };
      }

      // Network/HTTP error fallback
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Parse successful response
    const data: AnalysisResult = await response.json();
    return data;

  } catch (error) {
    // Network failure or parsing error - return safe fallback result
    console.error('URL analysis error:', error);
    
    return {
      verdict: "SUSPICIOUS",
      riskLevel: "Medium",
      explanation: "Unable to analyze URL. Please check your connection and try again.",
      evidence: [
        {
          label: "Connection Error",
          status: "warning",
          icon: "alert",
        },
      ],
      checkedItems: ["Unable to reach analysis server"],
      identificationTips: [
        "Check your internet connection",
        "Ensure the backend server is running",
        "Try again in a moment",
      ],
      actionSteps: [
        "Verify your connection",
        "Refresh the page and try again",
        "Contact support if the issue persists",
      ],
    };
  }
};


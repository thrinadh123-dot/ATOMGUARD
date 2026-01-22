/**
 * Frontend URL Indicator Extractor
 * 
 * This module extracts technical indicators from URLs WITHOUT making verdicts.
 * These indicators are used for educational purposes and to show what was checked.
 * The backend ML model is the only authority for final verdicts.
 */

export type IndicatorStatus = "safe" | "warning" | "danger";

export interface URLIndicator {
  parameter: string;
  status: IndicatorStatus;
  icon: "check" | "alert" | "x";
  message: string;
  explanation: string;
}

/**
 * Extracts technical indicators from a URL
 * These are indicators only - NOT verdicts
 * 
 * @param url - The URL string to analyze
 * @returns Array of URL indicators
 */
export function extractFrontendIndicators(url: string): URLIndicator[] {
  const indicators: URLIndicator[] = [];
  const lowerUrl = url.toLowerCase().trim();
  
  // Normalize URL for parsing
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = "https://" + normalizedUrl;
  }
  
  let hostname = "";
  let domain = "";
  try {
    const urlObj = new URL(normalizedUrl);
    hostname = urlObj.hostname;
    domain = hostname;
  } catch {
    // Fallback parsing
    const parts = normalizedUrl.split("/")[0].split("?")[0];
    hostname = parts;
    domain = parts;
  }
  
  // 1. URL Length Indicator
  const urlLength = url.length;
  if (urlLength > 75) {
    indicators.push({
      parameter: "URL Length",
      status: "warning",
      icon: "alert",
      message: "URL is unusually long",
      explanation: `The URL is ${urlLength} characters long. Very long URLs are sometimes used to hide malicious paths or obfuscate the destination.`
    });
  } else {
    indicators.push({
      parameter: "URL Length",
      status: "safe",
      icon: "check",
      message: "URL length is within normal range",
      explanation: `The URL is ${urlLength} characters long, which is within a normal range for web addresses.`
    });
  }
  
  // 2. Dot Count Indicator
  const dotCount = hostname.split(".").length - 1;
  if (dotCount > 3) {
    indicators.push({
      parameter: "Dot Count",
      status: "warning",
      icon: "alert",
      message: "Multiple dots detected",
      explanation: `The domain has ${dotCount} dots. Excessive dots may indicate fake subdomains used to mimic legitimate websites.`
    });
  } else {
    indicators.push({
      parameter: "Dot Count",
      status: "safe",
      icon: "check",
      message: "Normal dot count",
      explanation: `The domain has ${dotCount} dots, which is typical for standard domain structures.`
    });
  }
  
  // 3. Subdomain Indicator
  const subdomainParts = hostname.split(".");
  const subdomainCount = Math.max(0, subdomainParts.length - 2);
  if (subdomainCount > 2) {
    indicators.push({
      parameter: "Subdomains",
      status: "warning",
      icon: "alert",
      message: "Deep or multiple subdomains detected",
      explanation: `The URL has ${subdomainCount} subdomain levels. Deep subdomains can be used to create misleading URLs that appear legitimate.`
    });
  } else if (subdomainCount > 0) {
    indicators.push({
      parameter: "Subdomains",
      status: "safe",
      icon: "check",
      message: "Minimal or standard subdomains",
      explanation: `The URL has ${subdomainCount} subdomain level(s), which is normal for many legitimate websites.`
    });
  } else {
    indicators.push({
      parameter: "Subdomains",
      status: "safe",
      icon: "check",
      message: "No subdomains detected",
      explanation: "The URL uses the main domain without subdomains, which is common for many websites."
    });
  }
  
  // 4. @ Symbol Indicator
  if (lowerUrl.includes("@")) {
    indicators.push({
      parameter: "@ Symbol",
      status: "danger",
      icon: "x",
      message: "@ symbol detected (browser redirection trick)",
      explanation: "The @ symbol in a URL can be used to trick browsers into redirecting to a different domain than what appears before the @ symbol."
    });
  } else {
    indicators.push({
      parameter: "@ Symbol",
      status: "safe",
      icon: "check",
      message: "No @ symbol detected",
      explanation: "No @ symbol found in the URL, which is normal for standard web addresses."
    });
  }
  
  // 5. Hyphen Indicator (for brand imitation)
  const hyphenCount = hostname.split("-").length - 1;
  const suspiciousBrandPatterns = [
    { pattern: /paypa[l1]-/i, brand: "PayPal" },
    { pattern: /amaz[o0]n-/i, brand: "Amazon" },
    { pattern: /g[o0]{2}gle-/i, brand: "Google" },
    { pattern: /micr[o0]soft-/i, brand: "Microsoft" },
    { pattern: /app[1l]e-/i, brand: "Apple" },
    { pattern: /faceb[o0]ok-/i, brand: "Facebook" },
    { pattern: /tw[i1]tter-/i, brand: "Twitter" },
  ];
  
  const hasBrandImitation = suspiciousBrandPatterns.some(p => p.pattern.test(lowerUrl));
  if (hasBrandImitation || (hyphenCount > 2 && hostname.length > 20)) {
    indicators.push({
      parameter: "Hyphen Usage",
      status: "warning",
      icon: "alert",
      message: "Brand imitation pattern detected",
      explanation: "Hyphens combined with character substitutions may indicate an attempt to mimic a well-known brand name."
    });
  } else if (hyphenCount > 0) {
    indicators.push({
      parameter: "Hyphen Usage",
      status: "safe",
      icon: "check",
      message: "Normal hyphen usage",
      explanation: `The domain contains ${hyphenCount} hyphen(s), which is common in legitimate domain names.`
    });
  } else {
    indicators.push({
      parameter: "Hyphen Usage",
      status: "safe",
      icon: "check",
      message: "No hyphens detected",
      explanation: "No hyphens found in the domain, which is normal for many websites."
    });
  }
  
  // 6. HTTPS Indicator
  const hasHttps = normalizedUrl.startsWith("https://");
  if (hasHttps) {
    indicators.push({
      parameter: "HTTPS Presence",
      status: "safe",
      icon: "check",
      message: "HTTPS protocol is enabled (encryption only)",
      explanation: "The URL uses HTTPS, which encrypts the connection between your browser and the server. However, HTTPS does not guarantee the website is legitimate."
    });
  } else {
    indicators.push({
      parameter: "HTTPS Presence",
      status: "warning",
      icon: "alert",
      message: "HTTPS protocol is missing",
      explanation: "The URL does not use HTTPS encryption. This means data transmitted between your browser and the server is not encrypted, which is a security concern."
    });
  }
  
  // 7. IP Address Indicator
  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const isIP = ipPattern.test(hostname);
  if (isIP) {
    indicators.push({
      parameter: "IP Address Usage",
      status: "warning",
      icon: "alert",
      message: "Raw IP address used instead of domain",
      explanation: "The URL uses a raw IP address instead of a domain name. Legitimate websites typically use domain names, not IP addresses."
    });
  } else {
    indicators.push({
      parameter: "IP Address Usage",
      status: "safe",
      icon: "check",
      message: "Domain name is used (not IP address)",
      explanation: "The URL uses a domain name, which is the standard way legitimate websites are accessed."
    });
  }
  
  // 8. Special Characters Indicator
  const specialCharPattern = /[?%&=_]/g;
  const specialCharMatches = lowerUrl.match(specialCharPattern);
  const specialCharCount = specialCharMatches ? specialCharMatches.length : 0;
  if (specialCharCount > 5) {
    indicators.push({
      parameter: "Special Characters",
      status: "warning",
      icon: "alert",
      message: "Excessive special characters detected",
      explanation: `The URL contains ${specialCharCount} special characters (?, %, =, _, etc.). Excessive use may indicate obfuscation attempts.`
    });
  } else if (specialCharCount > 0) {
    indicators.push({
      parameter: "Special Characters",
      status: "safe",
      icon: "check",
      message: "Normal special character usage",
      explanation: `The URL contains ${specialCharCount} special character(s), which is normal for URLs with query parameters.`
    });
  } else {
    indicators.push({
      parameter: "Special Characters",
      status: "safe",
      icon: "check",
      message: "No excessive special characters",
      explanation: "The URL does not contain excessive special characters, which is normal for standard web addresses."
    });
  }
  
  // 9. Suspicious Keywords Indicator
  const suspiciousKeywords = [
    "login", "signin", "verify", "secure", "update", "confirm",
    "account", "password", "credential", "payment", "billing"
  ];
  const foundKeywords = suspiciousKeywords.filter(keyword => 
    lowerUrl.includes(keyword)
  );
  if (foundKeywords.length > 0) {
    indicators.push({
      parameter: "Suspicious Keywords",
      status: "warning",
      icon: "alert",
      message: "Suspicious keywords detected",
      explanation: `The URL contains keywords like "${foundKeywords.slice(0, 2).join(", ")}" which are commonly used in phishing attempts to create urgency or request sensitive information.`
    });
  } else {
    indicators.push({
      parameter: "Suspicious Keywords",
      status: "safe",
      icon: "check",
      message: "No suspicious keywords detected",
      explanation: "The URL does not contain common phishing-related keywords that are typically used to create urgency or request sensitive information."
    });
  }
  
  return indicators;
}

/**
 * Converts indicators to checked items format for display
 */
export function indicatorsToCheckedItems(indicators: URLIndicator[]): string[] {
  return indicators.map(ind => ind.message);
}


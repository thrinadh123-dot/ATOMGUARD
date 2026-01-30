"""
Rule Engine
Applies rules and heuristics to explain URL analysis results

IMPORTANT:
- This engine DOES NOT make the final decision when ML is available
- ML verdict always overrides rule verdict
- Rules are used only for explanations, evidence, and fallback
"""

from typing import Dict
import re


class RuleEngine:
    """
    Rule-based analysis engine for phishing detection explanations

    Features are extracted in app.py and passed here to avoid
    duplicate feature extraction.
    """

    def analyze(self, url: str, features: Dict[str, float]) -> Dict:
        """
        Analyze URL using heuristic rules and generate explanations

        Args:
            url: URL string
            features: Feature dictionary from FeatureExtractor

        Returns:
            Dictionary with verdict, risk level, explanation, and evidence
        """

        verdict = "SAFE"
        risk_level = "Low"

        evidence = []
        checked_items = []
        identification_tips = []
        action_steps = []

        lower_url = url.lower().strip()

        # ---------------- RULE 1: HTTPS CHECK ----------------
        if features.get("has_https", 0.0) == 1.0:
            evidence.append({
                "label": "Protocol Security",
                "status": "safe",
                "icon": "check"
            })
            checked_items.append("HTTPS protocol is enabled (encryption present)")
        else:
            evidence.append({
                "label": "Protocol Security",
                "status": "warning",
                "icon": "alert"
            })
            checked_items.append("HTTPS protocol is missing (connection is not encrypted)")
            verdict = "SUSPICIOUS"
            risk_level = "Medium"

        # ---------------- RULE 2: SUSPICIOUS TLD ----------------
        if features.get("suspicious_tld", 0.0) == 1.0:
            evidence.append({
                "label": "Domain Extension",
                "status": "danger",
                "icon": "x"
            })
            checked_items.append(
                "Free or uncommon domain extension often associated with phishing"
            )
            verdict = "PHISHING"
            risk_level = "High"

        # ---------------- RULE 3: IP ADDRESS USAGE ----------------
        if features.get("is_ip_address", 0.0) == 1.0:
            evidence.append({
                "label": "IP Address Usage",
                "status": "danger",
                "icon": "x"
            })
            checked_items.append(
                "URL uses an IP address instead of a domain name"
            )
            verdict = "PHISHING"
            risk_level = "High"
            identification_tips.append(
                "Legitimate websites typically use domain names, not raw IP addresses"
            )

        # ---------------- RULE 4: BRAND IMITATION ----------------
        brand_patterns = [
            (re.compile(r"paypa[l1]|paypai", re.I), "PayPal"),
            (re.compile(r"amaz[o0]n|amazn", re.I), "Amazon"),
            (re.compile(r"g[o0]{2}gle|go0gle", re.I), "Google"),
            (re.compile(r"micr[o0]soft|micrsoft", re.I), "Microsoft"),
            (re.compile(r"app[1l]e|aple", re.I), "Apple"),
            (re.compile(r"faceb[o0]ok|facebok", re.I), "Facebook"),
            (re.compile(r"tw[i1]tter|twtter", re.I), "Twitter"),
        ]

        for pattern, brand in brand_patterns:
            if pattern.search(lower_url):
                evidence.append({
                    "label": "Brand Imitation",
                    "status": "danger",
                    "icon": "x"
                })
                checked_items.append(
                    f"Possible brand impersonation detected (resembles {brand})"
                )
                verdict = "PHISHING"
                risk_level = "High"
                identification_tips.append(
                    f"Be cautious of URLs that imitate {brand} using altered characters"
                )
                break

        # ---------------- RULE 5: URL LENGTH ----------------
        url_length = features.get("url_length", 0)
        if url_length > 75:
            evidence.append({
                "label": "URL Structure",
                "status": "warning",
                "icon": "alert"
            })
            checked_items.append(
                f"URL is unusually long ({url_length} characters)"
            )
            if verdict == "SAFE":
                verdict = "SUSPICIOUS"
                risk_level = "Medium"
        else:
            evidence.append({
                "label": "URL Structure",
                "status": "safe",
                "icon": "check"
            })
            checked_items.append(
                f"URL length is within normal range ({url_length} characters)"
            )

        # ---------------- RULE 6: SUSPICIOUS KEYWORDS ----------------
        keyword_count = features.get("suspicious_keyword_count", 0)
        if keyword_count > 0:
            evidence.append({
                "label": "Content Indicators",
                "status": "warning",
                "icon": "alert"
            })
            checked_items.append(
                "Suspicious keywords related to authentication or payment detected"
            )
            if verdict == "SAFE":
                verdict = "SUSPICIOUS"
                risk_level = "Medium"
        else:
            evidence.append({
                "label": "Content Indicators",
                "status": "safe",
                "icon": "check"
            })
            checked_items.append(
                "No suspicious keywords detected in the URL"
            )

        # ---------------- EXPLANATION (RULE FALLBACK ONLY) ----------------
        # NOTE: This explanation is used ONLY when ML model is unavailable.
        # When ML is available, app.py will override this with ML-based explanation.
        if verdict == "PHISHING":
            explanation = (
                "Preliminary analysis (ML unavailable): We evaluated multiple technical indicators "
                "and detected several strong phishing signals. This is a rule-based assessment. "
                "For the most accurate analysis, ML-based detection is recommended when available."
            )
        elif verdict == "SUSPICIOUS":
            explanation = (
                "Preliminary analysis (ML unavailable): We evaluated multiple technical indicators "
                "and detected some warning signs. This is a rule-based assessment. "
                "For the most accurate analysis, ML-based detection is recommended when available."
            )
        else:
            explanation = (
                "Preliminary analysis (ML unavailable): We evaluated multiple technical indicators "
                "and found no critical security issues. This is a rule-based assessment. "
                "For the most accurate analysis, ML-based detection is recommended when available."
            )

        # ---------------- DEFAULT IDENTIFICATION TIPS ----------------
        if not identification_tips:
            identification_tips.extend([
                "Check for misspelled or altered brand names",
                "Avoid links that demand urgent action",
                "Be cautious with unfamiliar domain extensions",
                "Verify the website before entering sensitive information"
            ])

        # ---------------- ACTION STEPS ----------------
        if verdict == "PHISHING":
            action_steps.extend([
                "Do not click the link",
                "Do not enter credentials or personal information",
                "Report the link if possible",
                "Visit the official website directly"
            ])
        elif verdict == "SUSPICIOUS":
            action_steps.extend([
                "Proceed with caution",
                "Verify the URL through official sources",
                "Avoid entering sensitive information"
            ])
        else:
            action_steps.extend([
                "You may proceed, but remain alert",
                "Verify authenticity if sensitive data is requested"
            ])

        return {
            "verdict": verdict,
            "riskLevel": risk_level,
            "explanation": explanation,
            "evidence": evidence,
            "checkedItems": checked_items,
            "identificationTips": identification_tips,
            "actionSteps": action_steps
        }

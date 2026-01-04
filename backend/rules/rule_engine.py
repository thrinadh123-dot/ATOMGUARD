"""
Rule Engine
Applies rules and heuristics to explain URL analysis results
"""

from typing import Dict, List
import re


class RuleEngine:
    """
    Rule-based analysis engine for phishing detection explanations
    
    Note: Features are extracted in app.py and passed as parameter
    to avoid duplicate FeatureExtractor instantiation
    """
    
    def __init__(self):
        # FeatureExtractor is instantiated in app.py
        # Features are passed as parameter to analyze() method
        pass
    
    def analyze(self, url: str, features: Dict[str, float]) -> Dict:
        """
        Analyze URL using rules and generate explanation
        
        Args:
            url: URL to analyze
            features: Extracted features from FeatureExtractor
            
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
        
        # Rule 1: HTTPS Check
        if features.get('has_https', 0) == 1.0:
            evidence.append({
                'label': 'Protocol Security',
                'status': 'safe',
                'icon': 'check'
            })
            checked_items.append('HTTPS protocol is enabled (secure connection)')
        else:
            evidence.append({
                'label': 'Protocol Security',
                'status': 'warning',
                'icon': 'alert'
            })
            checked_items.append('HTTPS protocol is missing (insecure connection)')
            if verdict == "SAFE":
                verdict = "SUSPICIOUS"
                risk_level = "Medium"
        
        # Rule 2: Suspicious TLD
        if features.get('suspicious_tld', 0) == 1.0:
            evidence.append({
                'label': 'Domain Pattern',
                'status': 'danger',
                'icon': 'x'
            })
            checked_items.append('URL uses a free domain extension often associated with scams')
            verdict = "PHISHING"
            risk_level = "High"
        
        # Rule 3: IP Address
        if features.get('is_ip_address', 0) == 1.0:
            evidence.append({
                'label': 'IP Address Usage',
                'status': 'danger',
                'icon': 'x'
            })
            checked_items.append('URL uses an IP address instead of a domain name (highly suspicious)')
            verdict = "PHISHING"
            risk_level = "High"
            identification_tips.append('Legitimate websites usually use domain names, not raw IP addresses')
        
        # Rule 4: Brand Imitation
        brand_patterns = [
            {'pattern': re.compile(r'paypa[l1]|paypai', re.I), 'brand': 'PayPal'},
            {'pattern': re.compile(r'amaz[o0]n|amazn', re.I), 'brand': 'Amazon'},
            {'pattern': re.compile(r'g[o0]{2}gle|go0gle', re.I), 'brand': 'Google'},
            {'pattern': re.compile(r'micr[o0]soft|micrsoft', re.I), 'brand': 'Microsoft'},
            {'pattern': re.compile(r'app[1l]e|aple', re.I), 'brand': 'Apple'},
            {'pattern': re.compile(r'faceb[o0]ok|facebok', re.I), 'brand': 'Facebook'},
            {'pattern': re.compile(r'tw[i1]tter|twtter', re.I), 'brand': 'Twitter'},
        ]
        
        for brand_pattern in brand_patterns:
            if brand_pattern['pattern'].search(lower_url):
                evidence.append({
                    'label': 'Brand Imitation',
                    'status': 'danger',
                    'icon': 'x'
                })
                checked_items.append(
                    f"URL appears to mimic {brand_pattern['brand']} using suspicious character substitutions"
                )
                verdict = "PHISHING"
                risk_level = "High" if risk_level == "High" else "Medium"
                identification_tips.append(
                    f"Be cautious of URLs that resemble {brand_pattern['brand']} but contain altered characters"
                )
                break
        
        # Rule 5: URL Length
        url_length = features.get('url_length', 0)
        if url_length > 75:
            evidence.append({
                'label': 'URL Structure',
                'status': 'warning',
                'icon': 'alert'
            })
            checked_items.append(f'URL is unusually long ({url_length} characters)')
            if verdict == "SAFE":
                verdict = "SUSPICIOUS"
                risk_level = "Medium"
        else:
            evidence.append({
                'label': 'URL Structure',
                'status': 'safe',
                'icon': 'check'
            })
            checked_items.append(f'URL length is normal ({url_length} characters)')
        
        # Rule 6: Suspicious Keywords
        keyword_count = features.get('suspicious_keyword_count', 0)
        if keyword_count > 0:
            evidence.append({
                'label': 'Content Indicators',
                'status': 'warning',
                'icon': 'alert'
            })
            checked_items.append('URL contains keywords commonly used in phishing attempts')
            if verdict == "SAFE":
                verdict = "SUSPICIOUS"
                risk_level = "Medium"
        else:
            evidence.append({
                'label': 'Content Indicators',
                'status': 'safe',
                'icon': 'check'
            })
            checked_items.append('No suspicious keywords detected')
        
        # Generate explanation
        if verdict == "PHISHING":
            explanation = "This URL shows multiple signs of being a phishing attempt. Do not visit or enter any information."
        elif verdict == "SUSPICIOUS":
            explanation = "This URL has some suspicious characteristics. Proceed with extreme caution."
        else:
            explanation = "This URL appears to be from a legitimate, well-known website."
        
        # Add default identification tips
        if not identification_tips:
            identification_tips.extend([
                "Check for misspelled or altered brand names",
                "Look for urgent action keywords like 'verify' or 'confirm'",
                "Be cautious of free domain extensions",
                "Avoid entering sensitive information unless the site is verified"
            ])
        
        # Add action steps
        if verdict == "PHISHING":
            action_steps.extend([
                "Do not click the link",
                "Do not enter any credentials or personal information",
                "Report the link if possible",
                "Visit the official website directly instead"
            ])
        elif verdict == "SUSPICIOUS":
            action_steps.extend([
                "Proceed with caution",
                "Verify the URL using official sources",
                "Avoid entering sensitive information"
            ])
        else:
            action_steps.extend([
                "You may proceed, but stay alert",
                "Verify authenticity if sensitive data is requested"
            ])
        
        return {
            'verdict': verdict,
            'riskLevel': risk_level,
            'explanation': explanation,
            'evidence': evidence,
            'checkedItems': checked_items,
            'identificationTips': identification_tips,
            'actionSteps': action_steps
        }


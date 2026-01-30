"""
Feature Extractor
Extracts numerical features from URLs for analysis and explanation
(Used by rule engine and UI, NOT for ML prediction)
"""

import re
from urllib.parse import urlparse
from typing import Dict, List


class FeatureExtractor:
    """Extract features from URLs for phishing detection"""

    def __init__(self):
        self.suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz']
        self.suspicious_keywords = [
            'login', 'signin', 'verify', 'secure', 'update', 'confirm',
            'account', 'password', 'credential', 'payment', 'billing'
        ]
        self.known_brands = [
            'paypal', 'amazon', 'google', 'microsoft', 'apple',
            'facebook', 'twitter', 'bank', 'ebay', 'netflix'
        ]

    def extract(self, url: str) -> Dict[str, float]:
        """
        Extract features from a URL

        Args:
            url: URL string to analyze

        Returns:
            Dictionary of feature names and numeric values
        """
        features: Dict[str, float] = {}

        # Safe URL parsing
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url

            parsed = urlparse(url)
            hostname = parsed.hostname or ''
            path = parsed.path or ''
            full_url = url.lower()
        except Exception:
            hostname = ''
            path = ''
            full_url = url.lower()

        # 1. URL Length
        features['url_length'] = float(len(url))

        # 2. Hostname Length
        features['hostname_length'] = float(len(hostname))

        # 3. Path Length
        features['path_length'] = float(len(path))

        # 4. HTTPS Usage
        features['has_https'] = 1.0 if url.startswith('https://') else 0.0

        # 5. Suspicious TLD
        features['suspicious_tld'] = 1.0 if any(
            hostname.endswith(tld) for tld in self.suspicious_tlds
        ) else 0.0

        # 6. IP Address in Hostname
        ip_pattern = re.compile(r'^\d{1,3}(\.\d{1,3}){3}$')
        features['is_ip_address'] = 1.0 if ip_pattern.match(hostname) else 0.0

        # 7. Dot Count in Hostname
        features['dot_count'] = float(hostname.count('.'))

        # 8. Hyphen Count in Hostname
        features['hyphen_count'] = float(hostname.count('-'))

        # 9. Suspicious Keyword Count
        features['suspicious_keyword_count'] = float(sum(
            1 for keyword in self.suspicious_keywords
            if keyword in full_url
        ))

        # 10. Brand Mention Count (possible brand impersonation)
        features['brand_mention_count'] = float(sum(
            1 for brand in self.known_brands
            if brand in full_url
        ))

        # 11. Subdomain Count
        parts = hostname.split('.') if hostname else []
        features['subdomain_count'] = float(max(0, len(parts) - 2))

        # 12. Path Depth
        features['path_depth'] = float(path.count('/'))

        # 13. Has Query Parameters
        features['has_query'] = 1.0 if '?' in url else 0.0

        # 14. Has Fragment
        features['has_fragment'] = 1.0 if '#' in url else 0.0

        # 15. Character Diversity
        if len(url) > 0:
            features['char_diversity'] = len(set(url)) / len(url)
        else:
            features['char_diversity'] = 0.0

        return features

    def get_feature_names(self) -> List[str]:
        """
        Get ordered list of feature names
        (useful for logging / debugging / consistency checks)
        """
        return [
            'url_length',
            'hostname_length',
            'path_length',
            'has_https',
            'suspicious_tld',
            'is_ip_address',
            'dot_count',
            'hyphen_count',
            'suspicious_keyword_count',
            'brand_mention_count',
            'subdomain_count',
            'path_depth',
            'has_query',
            'has_fragment',
            'char_diversity'
        ]

"""
Feature Extractor
Extracts numerical features from URLs for ML model input
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
            Dictionary of feature names and values
        """
        features = {}
        
        # Parse URL
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            parsed = urlparse(url)
            hostname = parsed.hostname or ''
            path = parsed.path or ''
            full_url = url.lower()
        except:
            parsed = None
            hostname = ''
            path = ''
            full_url = url.lower()
        
        # Feature 1: URL Length
        features['url_length'] = len(url)
        
        # Feature 2: Hostname Length
        features['hostname_length'] = len(hostname)
        
        # Feature 3: Path Length
        features['path_length'] = len(path)
        
        # Feature 4: Has HTTPS
        features['has_https'] = 1.0 if url.startswith('https://') else 0.0
        
        # Feature 5: Suspicious TLD
        features['suspicious_tld'] = 1.0 if any(
            hostname.endswith(tld) for tld in self.suspicious_tlds
        ) else 0.0
        
        # Feature 6: IP Address in Hostname
        ip_pattern = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
        features['is_ip_address'] = 1.0 if ip_pattern.match(hostname) else 0.0
        
        # Feature 7: Number of Dots in Hostname
        features['dot_count'] = hostname.count('.')
        
        # Feature 8: Number of Hyphens in Hostname
        features['hyphen_count'] = hostname.count('-')
        
        # Feature 9: Suspicious Keywords Count
        features['suspicious_keyword_count'] = sum(
            1 for keyword in self.suspicious_keywords
            if keyword in full_url
        )
        
        # Feature 10: Brand Name Mention (potential brand imitation)
        brand_mentions = sum(
            1 for brand in self.known_brands
            if brand in full_url
        )
        features['brand_mention_count'] = brand_mentions
        
        # Feature 11: Subdomain Count
        parts = hostname.split('.')
        features['subdomain_count'] = max(0, len(parts) - 2)
        
        # Feature 12: Path Depth
        features['path_depth'] = path.count('/')
        
        # Feature 13: Has Query Parameters
        features['has_query'] = 1.0 if '?' in url else 0.0
        
        # Feature 14: Has Fragment
        features['has_fragment'] = 1.0 if '#' in url else 0.0
        
        # Feature 15: Character Diversity (ratio of unique chars to total)
        if len(url) > 0:
            features['char_diversity'] = len(set(url)) / len(url)
        else:
            features['char_diversity'] = 0.0
        
        return features
    
    def get_feature_names(self) -> List[str]:
        """Get list of feature names in order"""
        return [
            'url_length', 'hostname_length', 'path_length', 'has_https',
            'suspicious_tld', 'is_ip_address', 'dot_count', 'hyphen_count',
            'suspicious_keyword_count', 'brand_mention_count', 'subdomain_count',
            'path_depth', 'has_query', 'has_fragment', 'char_diversity'
        ]


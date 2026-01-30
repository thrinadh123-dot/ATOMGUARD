"""
ML Feature Extractor
Extracts features as a LIST (not dictionary) for ML model prediction

CRITICAL REQUIREMENTS:
- Returns a LIST of numeric features
- Feature order MUST match training data exactly
- Used ONLY for ML model prediction
- Must NOT be used for rule engine or UI explanations
"""

import re
from urllib.parse import urlparse
from typing import List


def extract_features(url: str) -> List[float]:
    """
    Extract ML features from URL as a LIST of numeric values.
    
    This function returns features in a specific order that MUST match
    the training data. The order is critical for ML model accuracy.
    
    Args:
        url: URL string to analyze
        
    Returns:
        List of float features in training order
    """
    
    # Normalize URL for parsing
    normalized_url = url.strip()
    if not normalized_url.startswith(('http://', 'https://')):
        normalized_url = 'https://' + normalized_url
    
    # Parse URL safely
    try:
        parsed = urlparse(normalized_url)
        hostname = parsed.hostname or ''
        path = parsed.path or ''
        query = parsed.query or ''
        fragment = parsed.fragment or ''
    except Exception:
        hostname = ''
        path = ''
        query = ''
        fragment = ''
    
    # Convert to lowercase for analysis
    lower_url = normalized_url.lower()
    lower_hostname = hostname.lower()
    
    # Initialize feature list (order must match training)
    features: List[float] = []
    
    # ========== FEATURE 1: URL Length ==========
    features.append(float(len(url)))
    
    # ========== FEATURE 2: Hostname Length ==========
    features.append(float(len(hostname)))
    
    # ========== FEATURE 3: Path Length ==========
    features.append(float(len(path)))
    
    # ========== FEATURE 4: HTTPS Usage (1.0 = yes, 0.0 = no) ==========
    features.append(1.0 if normalized_url.startswith('https://') else 0.0)
    
    # ========== FEATURE 5: Suspicious TLD (1.0 = yes, 0.0 = no) ==========
    suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click']
    has_suspicious_tld = 1.0 if any(lower_hostname.endswith(tld) for tld in suspicious_tlds) else 0.0
    features.append(has_suspicious_tld)
    
    # ========== FEATURE 6: IP Address Usage (1.0 = yes, 0.0 = no) ==========
    ip_pattern = re.compile(r'^\d{1,3}(\.\d{1,3}){3}$')
    is_ip = 1.0 if ip_pattern.match(hostname) else 0.0
    features.append(is_ip)
    
    # ========== FEATURE 7: Dot Count in Hostname ==========
    features.append(float(hostname.count('.')))
    
    # CRITICAL: Model was trained with exactly 7 features
    # Return only the first 7 features to match training data
    # Features 8-20 are not used by the current model
    
    # Ensure all features are floats and handle edge cases
    try:
        feature_list = [float(f) for f in features]
        
        # Validate feature count (model expects exactly 7)
        expected_count = 7
        if len(feature_list) < expected_count:
            raise ValueError(
                f"Feature extraction error: expected at least {expected_count} features, "
                f"got {len(feature_list)}"
            )
        
        # Return only the first 7 features (matching model training)
        feature_list = feature_list[:expected_count]
        
        # Validate no NaN or Inf values
        for i, val in enumerate(feature_list):
            if not isinstance(val, (int, float)) or not (float('-inf') < val < float('inf')):
                raise ValueError(f"Invalid feature value at index {i}: {val}")
        
        return feature_list
        
    except Exception as e:
        # Return safe default features if extraction fails
        print(f"⚠️  Feature extraction error: {str(e)}")
        # Return zero-filled feature vector of correct length (7 features)
        return [0.0] * 7


def get_feature_count() -> int:
    """
    Returns the number of features extracted.
    Useful for validation and debugging.
    """
    # Model expects exactly 7 features
    return 7


def get_feature_names() -> List[str]:
    """
    Returns feature names in order (for debugging/logging only).
    This should match the training data feature order.
    Model was trained with exactly 7 features.
    """
    return [
        'url_length',
        'hostname_length',
        'path_length',
        'has_https',
        'suspicious_tld',
        'is_ip_address',
        'dot_count'
    ]


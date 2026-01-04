"""
Helper Utilities
Common utility functions for URL validation and processing
"""

import re
from urllib.parse import urlparse
from typing import Optional


def validate_url(url: str) -> bool:
    """
    Validate if a string is a valid URL format
    
    Args:
        url: String to validate
        
    Returns:
        True if valid URL format, False otherwise
    """
    if not url or not isinstance(url, str):
        return False
    
    url = url.strip()
    
    # Basic URL pattern check
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    # Also accept URLs without protocol (will add https:// in feature extractor)
    no_protocol_pattern = re.compile(
        r'^(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
        r'localhost|'
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
        r'(?::\d+)?'
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    if url_pattern.match(url) or no_protocol_pattern.match(url):
        try:
            # Try parsing with urlparse
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            result = urlparse(url)
            return bool(result.netloc)
        except:
            return False
    
    return False


def normalize_url(url: str) -> str:
    """
    Normalize URL by adding protocol if missing
    
    Args:
        url: URL string
        
    Returns:
        Normalized URL with protocol
    """
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        return 'https://' + url
    return url


def extract_domain(url: str) -> Optional[str]:
    """
    Extract domain from URL
    
    Args:
        url: URL string
        
    Returns:
        Domain name or None if invalid
    """
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        parsed = urlparse(url)
        return parsed.hostname
    except:
        return None


"""
Helper Utilities
Common utility functions for URL validation and processing

IMPORTANT DESIGN NOTE:
- Validation here is intentionally LOOSE
- Phishing-style URLs (e.g., containing '@', long paths, odd structures)
  must NOT be blocked
- ML + Rule Engine must analyze them instead of rejecting early
"""

from urllib.parse import urlparse
from typing import Optional


def validate_url(url: str) -> bool:
    """
    Loosely validate URL format.

    This function only checks for basic structural validity.
    It does NOT attempt to judge safety or legitimacy.
    
    IMPORTANT: This validation is intentionally LOOSE to allow:
    - URLs with @ symbols (phishing technique)
    - Long URLs (obfuscation technique)
    - Suspicious patterns (to be analyzed by ML)
    - IP addresses (to be analyzed by ML)
    - Unusual TLDs (to be analyzed by ML)

    Args:
        url: URL string to validate

    Returns:
        True if URL has minimal valid structure, False otherwise
    """
    if not isinstance(url, str):
        return False

    url = url.strip()
    if not url:
        return False

    # Allow very long URLs (phishing technique)
    if len(url) > 2000:  # Reasonable upper limit
        return False

    try:
        # Add scheme only for parsing (do NOT modify original URL)
        test_url = url
        if not test_url.startswith(("http://", "https://")):
            test_url = "http://" + test_url

        parsed = urlparse(test_url)

        # Minimal requirements
        if parsed.scheme not in ("http", "https"):
            return False

        # Must have netloc (domain or IP)
        # This is intentionally loose - allows @, IPs, etc.
        if not parsed.netloc:
            return False

        # Allow empty netloc only if it's a data URL or similar (rare case)
        # For our purposes, we require netloc
        return True

    except Exception:
        # If parsing fails completely, reject
        return False


def normalize_url(url: str) -> str:
    """
    Normalize URL by ensuring protocol exists.

    Args:
        url: URL string

    Returns:
        URL with protocol (http:// if missing)
    """
    if not isinstance(url, str):
        return ""

    url = url.strip()
    if not url:
        return ""

    if not url.startswith(("http://", "https://")):
        return "http://" + url

    return url


def extract_domain(url: str) -> Optional[str]:
    """
    Extract domain / hostname from URL.

    Args:
        url: URL string

    Returns:
        Hostname or None if extraction fails
    """
    try:
        if not url.startswith(("http://", "https://")):
            url = "http://" + url

        parsed = urlparse(url)
        return parsed.hostname

    except Exception:
        return None

import re
from urllib.parse import urlparse

def extract_features(url):
    features = []

    # Ensure URL is string
    if not isinstance(url, str):
        url = ""

    # 1. URL length
    features.append(len(url))

    # 2. Dot count
    features.append(url.count('.'))

    # 3. Has @ symbol
    features.append(1 if '@' in url else 0)

    # Safe domain extraction
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
    except:
        domain = ""

    # 4. Has hyphen in domain
    features.append(1 if '-' in domain else 0)

    # 5. HTTPS usage
    features.append(1 if url.startswith('https') else 0)

    # 6. IP address usage
    ip_pattern = re.compile(
        r'((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}'
        r'(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)'
    )
    features.append(1 if ip_pattern.search(url) else 0)

    # 7. Subdomain count
    dot_count = domain.count('.')
    features.append(dot_count - 1 if dot_count > 1 else 0)

    return features

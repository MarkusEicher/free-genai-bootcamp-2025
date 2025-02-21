"""Privacy test configuration and utilities."""
from typing import Dict, List, Pattern
import re
from datetime import datetime, timedelta

# Test data with sensitive information
TEST_DATA = {
    "user_data": {
        "id": 12345,
        "email": "test@example.com",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0",
        "session_id": "abc123def456",
        "created_at": datetime.now().isoformat(),
        "api_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "settings": {
            "theme": "dark",
            "language": "en"
        }
    },
    "activity_data": {
        "id": 67890,
        "type": "practice",
        "user_id": 12345,
        "score": 85,
        "timestamp": datetime.now().isoformat(),
        "device_info": {
            "ip": "192.168.1.1",
            "browser": "Chrome/98.0.4758.102"
        }
    },
    "session_data": {
        "id": "session_123",
        "user_id": 12345,
        "start_time": datetime.now().isoformat(),
        "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
        "client_info": {
            "ip": "192.168.1.1",
            "location": "Local"
        }
    }
}

# Patterns for sensitive data detection
SENSITIVE_PATTERNS: Dict[str, Pattern] = {
    "email": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
    "ip_address": re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
    "jwt_token": re.compile(r'eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'),
    "timestamp": re.compile(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}'),
    "numeric_id": re.compile(r'"id":\s*\d+'),
    "session_id": re.compile(r'"session_id":\s*"[^"]*"'),
    "user_agent": re.compile(r'"user_agent":\s*"[^"]*"'),
}

# Expected sanitized values
SANITIZED_VALUES = {
    "email": "[EMAIL]",
    "ip_address": "[IP]",
    "jwt_token": "[TOKEN]",
    "timestamp": "[TIMESTAMP]",
    "numeric_id": '"id": "[ID]"',
    "session_id": '"session_id": "[REDACTED]"',
    "user_agent": '"user_agent": "[REDACTED]"',
}

# Headers that should never be present in responses
FORBIDDEN_HEADERS = [
    "Set-Cookie",
    "Cookie",
    "X-Analytics",
    "X-Tracking",
    "X-Real-IP",
    "X-Forwarded-For",
    "X-Forwarded-Proto",
    "X-Forwarded-Host",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Methods",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Credentials",
    "Access-Control-Expose-Headers"
]

# Required security headers
REQUIRED_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": lambda x: all(feature in x for feature in [
        "camera=()",
        "geolocation=()",
        "microphone=()",
        "payment=()",
        "interest-cohort=()"
    ])
}

# Cache settings for different route types
ROUTE_CACHE_SETTINGS = {
    "dashboard": {
        "cache_control": "no-store, max-age=0",
        "allowed_params": {"limit", "offset"}
    },
    "vocabulary": {
        "cache_control": "private, max-age=300",
        "allowed_params": {"limit", "offset", "sort", "filter"}
    },
    "sessions": {
        "cache_control": "no-store, no-cache, must-revalidate",
        "allowed_params": {"limit"}
    },
    "activities": {
        "cache_control": "private, max-age=300",
        "allowed_params": {"limit", "offset", "type"}
    }
}

def contains_sensitive_data(text: str) -> List[str]:
    """Check if text contains any sensitive data patterns.
    
    Args:
        text: Text to check for sensitive data
        
    Returns:
        List of found sensitive data types
    """
    found = []
    for data_type, pattern in SENSITIVE_PATTERNS.items():
        if pattern.search(text):
            found.append(data_type)
    return found

def verify_cache_settings(route_type: str, headers: Dict[str, str]) -> bool:
    """Verify cache settings for a specific route type.
    
    Args:
        route_type: Type of route (dashboard, vocabulary, etc.)
        headers: Response headers
        
    Returns:
        True if cache settings are correct
    """
    if route_type not in ROUTE_CACHE_SETTINGS:
        return False
    
    expected = ROUTE_CACHE_SETTINGS[route_type]
    return headers.get("Cache-Control") == expected["cache_control"]

def verify_security_headers(headers: Dict[str, str]) -> List[str]:
    """Verify that all required security headers are present and correct.
    
    Args:
        headers: Response headers to verify
        
    Returns:
        List of missing or incorrect headers
    """
    missing_headers = []
    
    for header, expected_value in REQUIRED_HEADERS.items():
        if header not in headers:
            missing_headers.append(header)
            continue
            
        actual_value = headers[header]
        if callable(expected_value):
            if not expected_value(actual_value):
                missing_headers.append(f"{header} (invalid value)")
        elif actual_value != expected_value:
            missing_headers.append(f"{header} (wrong value)")
    
    return missing_headers

def get_test_data(data_type: str) -> Dict:
    """Get test data for a specific type.
    
    Args:
        data_type: Type of test data to get
        
    Returns:
        Dictionary containing test data
    """
    return TEST_DATA.get(data_type, {}) 
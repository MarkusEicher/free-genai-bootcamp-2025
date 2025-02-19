import pytest
import requests
import subprocess
import time
import os
from pathlib import Path

def is_nginx_running():
    """Check if Nginx is running."""
    try:
        subprocess.run(
            ["nginx", "-t"],
            check=True,
            capture_output=True
        )
        return True
    except subprocess.CalledProcessError:
        return False

@pytest.fixture(scope="module")
def nginx_server():
    """Start Nginx server for testing."""
    if not is_nginx_running():
        pytest.skip("Nginx is not installed or not running")
    
    # Get the absolute path to the nginx.conf
    nginx_conf = Path(__file__).parent.parent.parent / "scripts" / "nginx.conf"
    
    # Start Nginx
    subprocess.run(
        ["nginx", "-c", str(nginx_conf)],
        check=True
    )
    
    # Wait for Nginx to start
    time.sleep(2)
    
    yield
    
    # Stop Nginx
    subprocess.run(
        ["nginx", "-s", "stop"],
        check=True
    )

def test_local_only_access(nginx_server):
    """Test that only local connections are accepted."""
    # Test localhost access
    response = requests.get("http://localhost:8000/health")
    assert response.status_code == 200
    
    # Test non-local access (should fail)
    with pytest.raises(requests.exceptions.ConnectionError):
        requests.get("http://example.com:8000/health")

def test_security_headers(nginx_server):
    """Test that Nginx adds security headers."""
    response = requests.get("http://localhost:8000/health")
    headers = response.headers
    
    # Check security headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert headers["Referrer-Policy"] == "same-origin"
    assert "Content-Security-Policy" in headers

def test_no_cors_headers(nginx_server):
    """Test that CORS headers are not present."""
    response = requests.get("http://localhost:8000/health")
    headers = response.headers
    
    # Verify no CORS headers
    assert "Access-Control-Allow-Origin" not in headers
    assert "Access-Control-Allow-Methods" not in headers
    assert "Access-Control-Allow-Headers" not in headers

def test_static_file_headers(nginx_server):
    """Test headers for static file serving."""
    response = requests.get("http://localhost:8000/")
    headers = response.headers
    
    # Check cache headers
    assert "Cache-Control" in headers
    assert "public" in headers["Cache-Control"]
    assert "no-transform" in headers["Cache-Control"]

def test_font_file_headers(nginx_server):
    """Test headers for font file serving."""
    # Create test font file
    font_dir = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "fonts"
    font_dir.mkdir(parents=True, exist_ok=True)
    test_font = font_dir / "test-font.woff2"
    test_font.touch()
    
    try:
        response = requests.get("http://localhost:8000/fonts/test-font.woff2")
        headers = response.headers
        
        # Check cache headers
        assert "Cache-Control" in headers
        assert "public" in headers["Cache-Control"]
        assert "no-transform" in headers["Cache-Control"]
        assert "max-age=2592000" in headers["Cache-Control"]  # 30 days
    finally:
        # Cleanup
        test_font.unlink()
        if not any(font_dir.iterdir()):
            font_dir.rmdir()

def test_api_proxy(nginx_server):
    """Test API proxy configuration."""
    response = requests.get("http://localhost:8000/api/v1/health")
    
    # Check proxy headers
    assert "X-Real-IP" not in response.headers
    assert "X-Forwarded-For" not in response.headers
    assert "X-Forwarded-Proto" not in response.headers

def test_robots_txt(nginx_server):
    """Test robots.txt configuration."""
    response = requests.get("http://localhost:8000/robots.txt")
    assert response.status_code == 200
    assert "Disallow: /" in response.text

def test_hidden_files_blocked(nginx_server):
    """Test that hidden files are blocked."""
    # Try to access .env file
    response = requests.get("http://localhost:8000/.env")
    assert response.status_code == 403
    
    # Try to access .git directory
    response = requests.get("http://localhost:8000/.git/")
    assert response.status_code == 403

def test_no_server_tokens(nginx_server):
    """Test that server tokens are disabled."""
    response = requests.get("http://localhost:8000/health")
    assert "Server" not in response.headers
    assert "X-Powered-By" not in response.headers 
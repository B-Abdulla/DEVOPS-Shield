"""
HTTPS/SSL Configuration & Security Headers
Enforce HTTPS, configure SSL/TLS, and add security headers
"""

from fastapi import FastAPI
from starlette.middleware import Middleware
from typing import List
import ssl
try:
    from starlette.middleware.https import HTTPSRedirectMiddleware as HTTPSMiddleware
except ImportError:
    HTTPSMiddleware = None
from src.utils.logger import get_logger

logger = get_logger(__name__)

# ===== SECURITY HEADERS =====
class SecurityHeadersMiddleware:
    """Middleware to add security headers to all responses"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            async def send_with_headers(message):
                if message["type"] == "http.response.start":
                    headers = list(message["headers"])
                    
                    # Security headers
                    headers.append((b"Strict-Transport-Security", b"max-age=31536000; includeSubDomains"))
                    headers.append((b"X-Content-Type-Options", b"nosniff"))
                    headers.append((b"X-Frame-Options", b"SAMEORIGIN"))
                    headers.append((b"X-XSS-Protection", b"1; mode=block"))
                    headers.append((b"Referrer-Policy", b"strict-origin-when-cross-origin"))
                    headers.append((b"Permissions-Policy", b"geolocation=(), microphone=(), camera=()"))
                    headers.append((b"Content-Security-Policy", b"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'"))
                    
                    message["headers"] = headers
                
                await send(message)
            
            await self.app(scope, receive, send_with_headers)
        else:
            await self.app(scope, receive, send)

# ===== SSL CONFIGURATION =====
class SSLConfig:
    """SSL/TLS configuration"""
    
    @staticmethod
    def create_ssl_context(cert_path: str, key_path: str, ca_path: str = None) -> ssl.SSLContext:
        """
        Create SSL context for HTTPS
        """
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.load_cert_chain(cert_path, key_path)
        
        if ca_path:
            context.load_verify_locations(ca_path)
            context.verify_mode = ssl.CERT_REQUIRED
        else:
            context.verify_mode = ssl.CERT_NONE
        
        # Enable strong TLS versions only
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.maximum_version = ssl.TLSVersion.TLSv1_3
        
        # Disable weak ciphers
        context.set_ciphers('ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!eNULL:!MD5:!DSS')
        
        # Enable ECDH curves
        context.set_ecdh_curve('prime256v1')
        
        logger.info("SSL context configured successfully")
        return context

# ===== HTTPS CONFIGURATION FOR FASTAPI =====
def configure_https(app: FastAPI, cert_path: str = None, key_path: str = None, 
                   redirect_http: bool = True):
    """
    Configure HTTPS for FastAPI application
    """
    # Add security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)
    
    if redirect_http:
        # Redirect HTTP to HTTPS
        from starlette.middleware.base import BaseHTTPMiddleware
        from starlette.requests import Request
        from starlette.responses import RedirectResponse
        
        class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                if request.url.scheme == "http":
                    url = request.url.replace(scheme="https")
                    return RedirectResponse(url)
                return await call_next(request)
        
        app.add_middleware(HTTPSRedirectMiddleware)
    
    # Add HSTS middleware
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.requests import Request
    from starlette.responses import Response
    
    class HTTPSMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            if request.url.scheme == "http" and request.headers.get("X-Forwarded-Proto") != "https":
                url = request.url.replace(scheme="https")
                return Response(status_code=301, headers={"Location": str(url)})
            return await call_next(request)
    
    app.add_middleware(HTTPSMiddleware)
    
    logger.info("HTTPS configuration applied")

# ===== CERTIFICATE MANAGEMENT =====
class CertificateManager:
    """Manage SSL/TLS certificates"""
    
    @staticmethod
    def generate_self_signed_cert(cert_path: str, key_path: str, days: int = 365):
        """
        Generate self-signed certificate for development
        (Use Let's Encrypt or proper CA in production)
        """
        import subprocess
        
        try:
            # Generate self-signed certificate valid for specified days
            subprocess.run([
                "openssl", "req", "-x509", "-newkey", "rsa:4096",
                "-keyout", key_path, "-out", cert_path,
                "-days", str(days), "-nodes",
                "-subj", "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            ], check=True)
            
            logger.info(f"Self-signed certificate generated: {cert_path}")
            return True
        except Exception as e:
            logger.error(f"Error generating certificate: {e}")
            return False
    
    @staticmethod
    def verify_certificate(cert_path: str) -> bool:
        """
        Verify certificate validity
        """
        import subprocess
        
        try:
            subprocess.run([
                "openssl", "x509", "-in", cert_path, "-noout"
            ], check=True, capture_output=True)
            return True
        except Exception as e:
            logger.error(f"Certificate verification failed: {e}")
            return False

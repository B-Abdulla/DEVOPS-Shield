"""
Authentication & Authorization Manager
Handles JWT tokens, password hashing, MFA, and role-based access control (RBAC)
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer
try:
    from fastapi.security import HTTPAuthCredentials
except ImportError:
    # Fallback for newer FastAPI versions
    from pydantic import BaseModel
    class HTTPAuthCredentials(BaseModel):
        scheme: str
        credentials: str
from datetime import datetime, timedelta, timezone
import jwt
import secrets
import hashlib
import os
from enum import Enum
from typing import Optional, Dict, List
from pydantic import BaseModel
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# from pydantic import EmailStr  # Requires email-validator package
from src.utils.logger import get_logger
from src.utils.config import Config
import pyotp
import qrcode
from io import BytesIO
import base64

logger = get_logger(__name__)
security = HTTPBearer()

# ===== ROLE DEFINITIONS =====
class UserRole(str, Enum):
    """User roles for RBAC"""
    ADMIN = "admin"
    SECURITY_ANALYST = "security_analyst"
    DEVELOPER = "developer"
    VIEWER = "viewer"
    GUEST = "guest"

# ===== DATA MODELS =====
class User(BaseModel):
    """User model"""
    id: str
    username: str
    email: str  # Changed from EmailStr to str to avoid dependency
    role: UserRole
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    password_hash: str
    is_active: bool = True
    created_at: datetime = None
    last_login: Optional[datetime] = None
    login_attempts: int = 0
    locked_until: Optional[datetime] = None

class TokenData(BaseModel):
    """JWT token data"""
    user_id: str
    username: str
    email: str
    role: UserRole
    exp: datetime
    mfa_verified: bool = False

class LoginRequest(BaseModel):
    """Login request"""
    username: str
    password: str

class MFAVerifyRequest(BaseModel):
    """MFA verification request"""
    token: str
    mfa_code: str

class ChangePasswordRequest(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: str  # Changed from EmailStr to str

# ===== PASSWORD HASHING =====
class PasswordManager:
    """Secure password hashing and verification"""
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
        """
        Hash password with salt using PBKDF2
        Returns: (hash, salt)
        """
        if not salt:
            salt = secrets.token_hex(32)
        
        # Use PBKDF2 with SHA256
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        )
        password_hash = hash_obj.hex()
        return password_hash, salt
    
    @staticmethod
    def verify_password(password: str, password_hash: str, salt: str) -> bool:
        """Verify password against hash"""
        try:
            computed_hash, _ = PasswordManager.hash_password(password, salt)
            # Use constant-time comparison to prevent timing attacks
            return secrets.compare_digest(computed_hash, password_hash)
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

# ===== JWT TOKEN MANAGEMENT =====
class TokenManager:
    """JWT token creation and validation"""
    
    SECRET_KEY = Config.SECRET_KEY
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 15
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    @classmethod
    def create_access_token(cls, user_id: str, username: str, email: str, role: UserRole, mfa_verified: bool = False) -> str:
        """Create JWT access token"""
        try:
            now = datetime.now(timezone.utc)
            exp = now + timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES)
            payload = {
                "user_id": user_id,
                "username": username,
                "email": email,
                "role": role.value,
                "exp": int(exp.timestamp()),
                "mfa_verified": mfa_verified,
                "iat": int(now.timestamp()),
                "type": "access"
            }
            token = jwt.encode(payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)
            return token
        except Exception as e:
            logger.error(f"Token creation error: {e}")
            raise HTTPException(status_code=500, detail="Token generation failed")
    
    @classmethod
    def create_refresh_token(cls, user_id: str) -> str:
        """Create JWT refresh token"""
        try:
            now = datetime.now(timezone.utc)
            exp = now + timedelta(days=cls.REFRESH_TOKEN_EXPIRE_DAYS)
            payload = {
                "user_id": user_id,
                "exp": int(exp.timestamp()),
                "iat": int(now.timestamp()),
                "type": "refresh"
            }
            token = jwt.encode(payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)
            return token
        except Exception as e:
            logger.error(f"Refresh token creation error: {e}")
            raise HTTPException(status_code=500, detail="Refresh token generation failed")
    
    @classmethod
    def verify_token(cls, token: str) -> Dict:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(status_code=401, detail="Token verification failed")

# ===== MFA (Multi-Factor Authentication) =====
class MFAManager:
    """Multi-Factor Authentication using TOTP"""
    
    @staticmethod
    def generate_secret() -> str:
        """Generate TOTP secret"""
        secret = pyotp.random_base32()
        return secret
    
    @staticmethod
    def get_provisioning_uri(secret: str, username: str, issuer: str = "DevOps-Shield") -> str:
        """Get provisioning URI for QR code"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=username, issuer_name=issuer)
    
    @staticmethod
    def get_qr_code(secret: str, username: str, issuer: str = "DevOps-Shield") -> str:
        """Generate QR code for MFA setup"""
        uri = MFAManager.get_provisioning_uri(secret, username, issuer)
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return img_base64
    
    @staticmethod
    def verify_code(secret: str, code: str, window: int = 1) -> bool:
        """Verify TOTP code"""
        try:
            totp = pyotp.TOTP(secret)
            # Allow time window of ±1 for clock skew
            return totp.verify(code, valid_window=window)
        except Exception as e:
            logger.error(f"MFA verification error: {e}")
            return False

# ===== ROLE-BASED ACCESS CONTROL =====
class RBACManager:
    """Role-Based Access Control management"""
    
    # Define permissions for each role
    ROLE_PERMISSIONS = {
        UserRole.ADMIN: [
            "create_user",
            "delete_user",
            "modify_user",
            "view_logs",
            "view_alerts",
            "manage_settings",
            "manage_webhooks",
            "manage_ml_models",
            "export_data",
            "incident_response",
            "view_audit_logs"
        ],
        UserRole.SECURITY_ANALYST: [
            "view_logs",
            "view_alerts",
            "analyze_threats",
            "manage_rules",
            "export_data",
            "view_audit_logs"
        ],
        UserRole.DEVELOPER: [
            "view_logs",
            "view_alerts",
            "trigger_analysis",
            "view_audit_logs"
        ],
        UserRole.VIEWER: [
            "view_logs",
            "view_alerts"
        ],
        UserRole.GUEST: [
            "view_public_data"
        ]
    }
    
    @staticmethod
    def has_permission(role: UserRole, permission: str) -> bool:
        """Check if role has permission"""
        permissions = RBACManager.ROLE_PERMISSIONS.get(role, [])
        return permission in permissions
    
    @staticmethod
    def require_permission(permission: str):
        """Dependency for requiring specific permission"""
        async def verify_permission(credentials: HTTPAuthCredentials = Depends(security)):
            try:
                token_data = TokenManager.verify_token(credentials.credentials)
                role = UserRole(token_data.get("role"))
                
                if not RBACManager.has_permission(role, permission):
                    logger.warning(f"Unauthorized access attempt for permission: {permission}")
                    raise HTTPException(status_code=403, detail="Insufficient permissions")
                
                return token_data
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Permission verification error: {e}")
                raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return verify_permission

# ===== AUTHENTICATION MANAGER =====
class AuthenticationManager:
    """Main authentication manager"""
    
    def __init__(self):
        self.password_manager = PasswordManager()
        self.token_manager = TokenManager()
        self.mfa_manager = MFAManager()
        self.rbac_manager = RBACManager()
        self.failed_logins = {}  # Track failed login attempts
        self.max_failed_attempts = 5
        self.lockout_duration = 15  # minutes
    
    def register_user(self, username: str, email: str, password: str, role: UserRole = UserRole.VIEWER) -> User:
        """Register new user with password hashing"""
        try:
            # Validate password strength
            self._validate_password(password)
            
            # Hash password
            password_hash, salt = self.password_manager.hash_password(password)
            
            # Create user (in production, save to database)
            user = User(
                id=secrets.token_urlsafe(16),
                username=username,
                email=email,
                role=role,
                password_hash=f"{password_hash}:{salt}",  # Store as hash:salt
                created_at=datetime.now(timezone.utc)
            )
            
            logger.info(f"User registered: {username}")
            return user
        except ValueError as e:
            logger.warning(f"Registration error: {e}")
            raise HTTPException(status_code=400, detail=str(e))
    
    def login(self, username: str, password: str) -> Dict:
        """Authenticate user and return tokens"""
        try:
            # Check account lockout
            if self._is_locked_out(username):
                raise HTTPException(status_code=429, detail="Account temporarily locked. Try again later.")
            
            # In production, fetch user from database
            user = self._get_user(username)
            if not user:
                self._record_failed_login(username)
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            # Verify password
            password_hash, salt = user.password_hash.split(':')
            if not self.password_manager.verify_password(password, password_hash, salt):
                self._record_failed_login(username)
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            # Check if MFA is enabled
            if user.mfa_enabled:
                # Return temporary token for MFA verification
                temp_token = self.token_manager.create_access_token(
                    user.id, user.username, user.email, user.role, mfa_verified=False
                )
                logger.info(f"User {username} awaiting MFA verification")
                return {"access_token": temp_token, "mfa_required": True}
            
            # Create tokens
            access_token = self.token_manager.create_access_token(
                user.id, user.username, user.email, user.role, mfa_verified=True
            )
            refresh_token = self.token_manager.create_refresh_token(user.id)
            
            # Clear failed login attempts
            self.failed_logins.pop(username, None)
            
            # Update last login
            logger.info(f"User {username} logged in successfully")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role.value
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login error: {e}")
            raise HTTPException(status_code=500, detail="Login failed")
    
    def verify_mfa(self, token: str, mfa_code: str) -> Dict:
        """Verify MFA code and return full access"""
        try:
            # Verify token is valid but not fully authenticated yet
            token_data = self.token_manager.verify_token(token)
            
            if token_data.get("mfa_verified"):
                raise HTTPException(status_code=400, detail="Already authenticated")
            
            # Get user and verify MFA
            user = self._get_user_by_id(token_data["user_id"])
            if not user or not user.mfa_enabled:
                raise HTTPException(status_code=400, detail="MFA not enabled")
            
            if not self.mfa_manager.verify_code(user.mfa_secret, mfa_code):
                logger.warning(f"Invalid MFA code for user {user.username}")
                raise HTTPException(status_code=401, detail="Invalid MFA code")
            
            # Create full access token
            access_token = self.token_manager.create_access_token(
                user.id, user.username, user.email, user.role, mfa_verified=True
            )
            refresh_token = self.token_manager.create_refresh_token(user.id)
            
            logger.info(f"MFA verified for user {user.username}")
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"MFA verification error: {e}")
            raise HTTPException(status_code=500, detail="MFA verification failed")
    
    def setup_mfa(self, user_id: str) -> Dict:
        """Setup MFA for user"""
        try:
            user = self._get_user_by_id(user_id)
            secret = self.mfa_manager.generate_secret()
            qr_code = self.mfa_manager.get_qr_code(secret, user.username)
            
            logger.info(f"MFA setup initiated for user {user.username}")
            
            return {
                "secret": secret,
                "qr_code": qr_code,
                "message": "Scan QR code with authenticator app"
            }
        except Exception as e:
            logger.error(f"MFA setup error: {e}")
            raise HTTPException(status_code=500, detail="MFA setup failed")
    
    def enable_mfa(self, user_id: str, mfa_code: str, mfa_secret: str) -> bool:
        """Enable MFA for user"""
        try:
            if not self.mfa_manager.verify_code(mfa_secret, mfa_code):
                raise HTTPException(status_code=401, detail="Invalid MFA code")
            
            # In production, update user in database
            user = self._get_user_by_id(user_id)
            user.mfa_enabled = True
            user.mfa_secret = mfa_secret
            
            logger.info(f"MFA enabled for user {user.username}")
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"MFA enable error: {e}")
            raise HTTPException(status_code=500, detail="MFA setup failed")
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password"""
        try:
            user = self._get_user_by_id(user_id)
            
            # Verify current password
            password_hash, salt = user.password_hash.split(':')
            if not self.password_manager.verify_password(current_password, password_hash, salt):
                raise HTTPException(status_code=401, detail="Current password is incorrect")
            
            # Validate new password
            self._validate_password(new_password)
            
            # Hash new password
            new_hash, new_salt = self.password_manager.hash_password(new_password)
            user.password_hash = f"{new_hash}:{new_salt}"
            
            logger.info(f"Password changed for user {user.username}")
            return True
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Password change error: {e}")
            raise HTTPException(status_code=500, detail="Password change failed")
    
    def update_user_profile(self, user_id: str, username: Optional[str] = None, email: Optional[str] = None) -> Optional[User]:
        """Update user profile details"""
        try:
            from src.services.user_db_service import user_db
            
            if user_db.update_user(user_id, username, email):
                updated_user = user_db.get_user_by_id(user_id)
                if updated_user:
                    logger.info(f"User profile updated: {updated_user.username}")
                    return updated_user
            return None
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return None

    # ===== HELPER METHODS =====
    def _validate_password(self, password: str):
        """Validate password strength"""
        if len(password) < 12:
            raise ValueError("Password must be at least 12 characters")
        if not any(c.isupper() for c in password):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in password):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in password):
            raise ValueError("Password must contain digit")
        if not any(c in "!@#$%^&*()-_=+[]{}|;:,.<>?" for c in password):
            raise ValueError("Password must contain special character")
    
    def _get_user(self, username: str) -> Optional[User]:
        """Get user by username from database"""
        try:
            from src.services.user_db_service import user_db
            return user_db.get_user_by_username(username)
        except Exception as e:
            logger.error(f"Error fetching user from database: {e}")
            return None
    
    def _get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID from database"""
        try:
            from src.services.user_db_service import user_db
            return user_db.get_user_by_id(user_id)
        except Exception as e:
            logger.error(f"Error fetching user by ID: {e}")
            return None
    
    def _record_failed_login(self, username: str):
        """Record failed login attempt"""
        self.failed_logins[username] = self.failed_logins.get(username, 0) + 1
        if self.failed_logins[username] >= self.max_failed_attempts:
            # Lock account
            self.failed_logins[f"{username}_locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=self.lockout_duration)
            logger.warning(f"Account locked after {self.max_failed_attempts} failed attempts: {username}")
    
    def _is_locked_out(self, username: str) -> bool:
        """Check if account is locked"""
        locked_until = self.failed_logins.get(f"{username}_locked_until")
        if locked_until and locked_until > datetime.now(timezone.utc):
            return True
        elif locked_until:
            # Lockout expired
            self.failed_logins.pop(f"{username}_locked_until", None)
        return False

# ===== GLOBAL AUTH MANAGER =====
auth_manager = AuthenticationManager()

# ===== DEPENDENCY FOR PROTECTED ROUTES =====
async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> Dict:
    """Dependency to get current authenticated user"""
    try:
        token_data = TokenManager.verify_token(credentials.credentials)
        return token_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

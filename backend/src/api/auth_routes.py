"""
Authentication Routes
Login, registration, MFA, and token management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request

from datetime import datetime
from ..security.auth_manager import (
    auth_manager, TokenManager, UserRole, get_current_user,
    LoginRequest, MFAVerifyRequest, ChangePasswordRequest
)
from ..security.audit_logger import security_audit_logger, AuditEventType
from ..utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# ===== AUTHENTICATION ENDPOINTS =====

@router.post("/register")
async def register(username: str, email: str, password: str):
    """
    Register new user
    """
    try:
        user = auth_manager.register_user(username, email, password, UserRole.VIEWER)
        security_audit_logger.log_event(
            event_type=AuditEventType.LOGIN_SUCCESS,
            user_id=user.id,
            action=f"User registered: {username}",
            details={"email": email},
            status="success"
        )
        return {
            "status": "success",
            "message": "User registered successfully",
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login(credentials: LoginRequest, request: Request):
    """
    Login user and return tokens
    """
    try:
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        result = auth_manager.login(credentials.username, credentials.password)
        
        # Log successful login
        security_audit_logger.log_login_success(
            user_id=result.get("user_id", "unknown"),
            username=credentials.username,
            ip_address=client_ip
        )
        
        return result
    except HTTPException as e:
        # Log failed login
        security_audit_logger.log_login_failure(
            username=credentials.username,
            ip_address=request.client.host if request.client else "unknown",
            reason=e.detail
        )
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/mfa/setup")
async def setup_mfa(current_user: dict = Depends(get_current_user)):
    """
    Setup MFA for current user
    """
    try:
        return auth_manager.setup_mfa(current_user["user_id"])
    except Exception as e:
        logger.error(f"MFA setup error: {e}")
        raise HTTPException(status_code=500, detail="MFA setup failed")

@router.post("/mfa/verify")
async def verify_mfa(request: MFAVerifyRequest):
    """
    Verify MFA code and return full access token
    """
    try:
        return auth_manager.verify_mfa(request.token, request.mfa_code)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA verification error: {e}")
        raise HTTPException(status_code=500, detail="MFA verification failed")

@router.post("/mfa/enable")
async def enable_mfa(mfa_code: str, mfa_secret: str, 
                    current_user: dict = Depends(get_current_user)):
    """
    Enable MFA for current user
    """
    try:
        if auth_manager.enable_mfa(current_user["user_id"], mfa_code, mfa_secret):
            return {"status": "success", "message": "MFA enabled"}
        else:
            raise HTTPException(status_code=400, detail="Failed to enable MFA")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enable MFA error: {e}")
        raise HTTPException(status_code=500, detail="Failed to enable MFA")

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, 
                         current_user: dict = Depends(get_current_user)):
    """
    Change current user password
    """
    try:
        if auth_manager.change_password(
            current_user["user_id"],
            request.current_password,
            request.new_password
        ):
            security_audit_logger.log_event(
                event_type=AuditEventType.PASSWORD_CHANGED,
                user_id=current_user["user_id"],
                action=f"Password changed for user {current_user['username']}",
                status="success"
            )
            return {"status": "success", "message": "Password changed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Password change failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {e}")
        raise HTTPException(status_code=500, detail="Password change failed")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token
    """
    try:
        token_data = TokenManager.verify_token(refresh_token)
        if token_data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        user_id = token_data.get("user_id")
        # In production, fetch user from database
        user = auth_manager._get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = TokenManager.create_access_token(
            user.id, user.username, user.email, user.role
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user profile
    """
    return {
        "user_id": current_user.get("user_id"),
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "role": current_user.get("role"),
        "mfa_verified": current_user.get("mfa_verified")
    }

@router.put("/profile")
async def update_profile(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user profile
    """
    try:
        data = await request.json()
        username = data.get("username")
        email = data.get("email")
        
        if not username or not email:
            raise HTTPException(status_code=400, detail="Username and email are required")
            
        updated_user = auth_manager.update_user_profile(
            current_user["user_id"], 
            username=username, 
            email=email
        )
        
        if not updated_user:
            raise HTTPException(status_code=400, detail="Profile update failed")
        
        security_audit_logger.log_event(
            event_type=AuditEventType.USER_UPDATE,
            user_id=current_user["user_id"],
            action=f"User profile updated: {username}",
            details={"email": email},
            status="success"
        )
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "user": {
                "user_id": updated_user.id,
                "username": updated_user.username,
                "email": updated_user.email,
                "role": updated_user.role.value
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Profile update failed")

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user (log audit event)
    """
    try:
        security_audit_logger.log_event(
            event_type=AuditEventType.LOGOUT,
            user_id=current_user["user_id"],
            action=f"User logged out: {current_user['username']}",
            status="success"
        )
        return {"status": "success", "message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail="Logout failed")

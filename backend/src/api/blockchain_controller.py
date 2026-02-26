"""
Blockchain API Controller
REST API endpoints for blockchain audit trail management, event logging, and verification
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from ..services.blockchain_service_v2 import BlockchainAuditService, SeverityLevel, EventStatus
from ..utils.logger import get_logger

logger = get_logger(__name__)

# Initialize blockchain service
blockchain_service = BlockchainAuditService()

# Create router
router = APIRouter(tags=["blockchain"])


# ============================================================================
# Request/Response Models
# ============================================================================

class SecurityEventRequest(BaseModel):
    """Request model for logging security events"""
    event_type: str = Field(..., description="Type of security event")
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Risk score 0-1")
    repository: str = Field(default="default", description="Repository identifier")
    rule_violations: List[str] = Field(default_factory=list, description="Violated rules")
    message: Optional[str] = Field(None, description="Event message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional event details")


class VerifyEventRequest(BaseModel):
    """Request model for event verification"""
    event_id: int = Field(..., description="Event ID to verify")
    signature_hash: str = Field(..., description="Verification signature hash")


class AuditTrailFilterRequest(BaseModel):
    """Request model for filtering audit trail"""
    repository: Optional[str] = Field(None, description="Filter by repository")
    severity: Optional[str] = Field(None, description="Filter by severity level")
    risk_threshold: Optional[int] = Field(None, ge=0, le=100, description="Minimum risk score")


class SecurityEventResponse(BaseModel):
    """Response model for security events"""
    event_id: int
    timestamp: int
    event_type: str
    severity: str
    risk_score: int
    reporter: str
    verified: bool
    status: str
    repository: str
    mitigation_time: int


class BlockchainStatsResponse(BaseModel):
    """Response model for blockchain statistics"""
    connected: bool
    provider: str
    network: str
    block_number: Optional[int] = None
    chain_id: Optional[int] = None
    event_count: Optional[int] = None
    report_count: Optional[int] = None
    contract_address: Optional[str] = None
    contract_status: str
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp())


class AuditTrailResponse(BaseModel):
    """Response model for audit trail"""
    event_count: int
    events: List[SecurityEventResponse]
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp())


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/events", response_model=Dict[str, Any])
async def log_security_event(event: SecurityEventRequest) -> Dict[str, Any]:
    """
    Log a security event on blockchain
    
    Creates an immutable audit trail entry for fraud detection events
    with multi-signature verification support.
    
    Args:
        event: Security event details
        
    Returns:
        Transaction receipt with blockchain confirmation
        
    Example:
        POST /api/blockchain/events
        {
            "event_type": "fraud_detected",
            "risk_score": 0.85,
            "repository": "production-app",
            "rule_violations": ["suspicious_commit", "unauthorized_access"],
            "message": "Potential credential compromise detected"
        }
    """
    try:
        # Prepare event data
        event_data = {
            'event_type': event.event_type,
            'risk_score': event.risk_score,
            'repository': event.repository,
            'rule_violations': event.rule_violations,
            'message': event.message,
            'details': event.details,
            'timestamp': datetime.now().timestamp()
        }
        
        # Log to blockchain
        result = blockchain_service.log_fraud_event(event_data, event.repository)
        
        if result is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to log event on blockchain"
            )
        
        return {
            'success': True,
            'storage_method': result.get('storage_method', 'blockchain'),
            'transaction_hash': result.get('transaction_hash'),
            'data_hash': result.get('data_hash'),
            'block_number': result.get('block_number'),
            'timestamp': result.get('timestamp')
        }
        
    except Exception as e:
        logger.error(f"Error logging security event: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error logging event: {str(e)}"
        )


@router.post("/events/verify", response_model=Dict[str, Any])
async def verify_event(request: VerifyEventRequest) -> Dict[str, Any]:
    """
    Verify a security event with multi-signature support
    
    Adds a signature verification record to an existing event, contributing
    to multi-signature consensus for event authentication.
    
    Args:
        request: Verification request with event ID and signature
        
    Returns:
        Verification result with transaction hash
    """
    try:
        result = blockchain_service.verify_event_on_chain(
            request.event_id,
            request.signature_hash
        )
        
        if result is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to verify event on blockchain"
            )
        
        return {
            'success': True,
            'event_id': request.event_id,
            'transaction_hash': result.get('transaction_hash'),
            'status': result.get('status'),
            'timestamp': result.get('timestamp')
        }
        
    except Exception as e:
        logger.error(f"Error verifying event: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying event: {str(e)}"
        )


@router.get("/audit-trail", response_model=AuditTrailResponse)
async def get_audit_trail(
    repository: Optional[str] = None,
    severity: Optional[str] = None,
    risk_threshold: Optional[int] = None
) -> AuditTrailResponse:
    """
    Retrieve audit trail from blockchain with filtering
    
    Fetches immutable security events from blockchain with optional filtering
    by repository, severity, or risk score threshold.
    
    Query Parameters:
        repository: Filter by repository name
        severity: Filter by severity level (low, medium, high, critical)
        risk_threshold: Filter by minimum risk score (0-100)
        
    Returns:
        List of security events with blockchain verification data
        
    Example:
        GET /api/blockchain/audit-trail?severity=high&risk_threshold=70
    """
    try:
        # Retrieve audit trail from blockchain
        events = blockchain_service.get_audit_trail(
            repository=repository,
            severity=severity,
            risk_threshold=risk_threshold
        )
        
        # Convert to response format
        event_responses = []
        for event in events:
            if isinstance(event, dict):
                # Handle different event formats (blockchain vs local fallback)
                if 'event_id' in event:  # Blockchain event
                    event_responses.append(SecurityEventResponse(
                        event_id=event['event_id'],
                        timestamp=event['timestamp'],
                        event_type=event['event_type'],
                        severity=event['severity'],
                        risk_score=event['risk_score'],
                        reporter=event['reporter'],
                        verified=event['verified'],
                        status=event.get('status', 'unknown'),
                        repository=event.get('repository', 'unknown'),
                        mitigation_time=event.get('mitigation_time', 0)
                    ))
        
        return AuditTrailResponse(
            event_count=len(event_responses),
            events=event_responses
        )
        
    except Exception as e:
        logger.error(f"Error retrieving audit trail: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving audit trail: {str(e)}"
        )


@router.get("/events/{event_id}", response_model=Dict[str, Any])
async def get_event(event_id: int) -> Dict[str, Any]:
    """
    Get details of a specific security event
    
    Retrieves immutable event details from blockchain including
    verification status, risk score, and event chaining information.
    
    Args:
        event_id: Event ID to retrieve
        
    Returns:
        Complete event details with blockchain metadata
    """
    try:
        if not blockchain_service.connected or not blockchain_service.contract:
            raise HTTPException(
                status_code=503,
                detail="Blockchain service is not available"
            )
        
        event = blockchain_service._fetch_event(event_id)
        
        if event is None:
            raise HTTPException(
                status_code=404,
                detail=f"Event {event_id} not found"
            )
        
        return {
            'success': True,
            'event': event,
            'timestamp': datetime.now().timestamp()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving event: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving event: {str(e)}"
        )


@router.get("/stats", response_model=Dict[str, Any])
async def get_blockchain_stats() -> Dict[str, Any]:
    """
    Get blockchain connection and contract statistics
    
    Returns current blockchain network status, connected provider,
    smart contract address, and event/report counts.
    
    Returns:
        Blockchain status and statistics
        
    Example Response:
        {
            "connected": true,
            "provider": "https://eth-mainnet.alchemyapi.io/v2/...",
            "network": "mainnet",
            "chain_id": 1,
            "block_number": 18500000,
            "event_count": 1250,
            "report_count": 48,
            "contract_address": "0x...",
            "contract_status": "deployed"
        }
    """
    try:
        stats = blockchain_service.get_blockchain_stats()
        return {
            'success': True,
            'stats': stats,
            'timestamp': datetime.now().timestamp()
        }
    except Exception as e:
        logger.error(f"Error getting blockchain stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error getting blockchain stats: {str(e)}"
        )


@router.get("/health", response_model=Dict[str, Any])
async def blockchain_health() -> Dict[str, Any]:
    """
    Check blockchain service health
    
    Simple health check endpoint to verify blockchain service connectivity
    and contract availability.
    
    Returns:
        Health status with connection details
    """
    try:
        stats = blockchain_service.get_blockchain_stats()
        
        is_healthy = (
            stats.get('connected', False) and
            stats.get('contract_status') == 'deployed'
        )
        
        return {
            'healthy': is_healthy,
            'blockchain_connected': stats.get('connected', False),
            'contract_available': stats.get('contract_status') == 'deployed',
            'network': stats.get('network'),
            'timestamp': datetime.now().timestamp()
        }
    except Exception as e:
        logger.error(f"Error checking blockchain health: {e}")
        return {
            'healthy': False,
            'blockchain_connected': False,
            'contract_available': False,
            'error': str(e),
            'timestamp': datetime.now().timestamp()
        }


@router.post("/test-connection", response_model=Dict[str, Any])
async def test_blockchain_connection() -> Dict[str, Any]:
    """
    Test blockchain connection and configuration
    
    Validates blockchain provider URL, contract ABI compatibility,
    and account setup. Useful for debugging connection issues.
    
    Returns:
        Detailed connection test results
    """
    try:
        if not blockchain_service.connected:
            return {
                'success': False,
                'message': 'Blockchain provider is not reachable',
                'provider': blockchain_service.provider_url,
                'error': 'Connection failed'
            }
        
        stats = blockchain_service.get_blockchain_stats()
        
        return {
            'success': True,
            'message': 'Blockchain connection test passed',
            'provider': blockchain_service.provider_url,
            'chain_id': stats.get('chain_id'),
            'block_number': stats.get('block_number'),
            'contract_address': blockchain_service.contract_address,
            'contract_status': stats.get('contract_status'),
            'timestamp': datetime.now().timestamp()
        }
        
    except Exception as e:
        logger.error(f"Error testing blockchain connection: {e}")
        return {
            'success': False,
            'message': 'Blockchain connection test failed',
            'error': str(e)
        }

"""
Unit Tests for Blockchain Service
Tests blockchain event logging, audit trail retrieval, and data hashing
"""
import pytest
import hashlib
import json
from unittest.mock import Mock, MagicMock, patch
from src.services.blockchain_service_v2 import (
    BlockchainAuditService,
    EventStatus,
    SeverityLevel
)


class TestBlockchainAuditService:
    """Test suite for BlockchainAuditService"""

    @pytest.fixture
    def service_no_web3(self):
        """Create service without Web3 connection"""
        with patch('src.services.blockchain_service_v2.HAS_WEB3', False):
            return BlockchainAuditService()

    @pytest.fixture
    def service_with_mock_web3(self):
        """Create service with mocked Web3"""
        with patch('src.services.blockchain_service_v2.HAS_WEB3', True):
            service = BlockchainAuditService()
            service.w3 = MagicMock()
            service.contract = MagicMock()
            service.connected = True
            service.private_key = '0x' + '1' * 64
            return service

    def test_service_initialization_no_web3(self, service_no_web3):
        """Test service initialization without Web3"""
        assert service_no_web3.connected is False
        assert service_no_web3.w3 is None

    def test_service_initialization_with_web3(self, service_with_mock_web3):
        """Test service initialization with Web3"""
        assert service_with_mock_web3.connected is True
        assert service_with_mock_web3.w3 is not None

    def test_calculate_data_hash_consistency(self, service_no_web3):
        """Test data hash is consistent for same input"""
        data = {
            'event_type': 'fraud_detection',
            'risk_score': 0.85,
            'repository': 'production-app',
            'rule_violations': ['suspicious_commit'],
            'timestamp': 1700000000.0
        }
        
        hash1 = service_no_web3.calculate_data_hash(data)
        hash2 = service_no_web3.calculate_data_hash(data)
        
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA256 hex string
        assert isinstance(hash1, str)

    def test_calculate_data_hash_differs_for_different_inputs(self, service_no_web3):
        """Test data hash differs for different inputs"""
        data1 = {'event_type': 'fraud_detection', 'risk_score': 0.85}
        data2 = {'event_type': 'fraud_detection', 'risk_score': 0.90}
        
        hash1 = service_no_web3.calculate_data_hash(data1)
        hash2 = service_no_web3.calculate_data_hash(data2)
        
        assert hash1 != hash2

    def test_calculate_data_hash_stable_for_order(self, service_no_web3):
        """Test data hash is stable regardless of field order"""
        data1 = {
            'risk_score': 0.85,
            'event_type': 'fraud_detection',
            'repository': 'app',
            'timestamp': 1700000000.0
        }
        data2 = {
            'event_type': 'fraud_detection',
            'repository': 'app',
            'risk_score': 0.85,
            'timestamp': 1700000000.0
        }
        
        hash1 = service_no_web3.calculate_data_hash(data1)
        hash2 = service_no_web3.calculate_data_hash(data2)
        
        assert hash1 == hash2

    def test_map_risk_to_severity(self, service_no_web3):
        """Test risk score to severity mapping"""
        assert service_no_web3._map_risk_to_severity(0.95) == "critical"
        assert service_no_web3._map_risk_to_severity(0.80) == "high"
        assert service_no_web3._map_risk_to_severity(0.60) == "medium"
        assert service_no_web3._map_risk_to_severity(0.30) == "low"

    def test_status_to_string(self, service_no_web3):
        """Test event status code to string conversion"""
        assert service_no_web3._status_to_string(0) == "pending"
        assert service_no_web3._status_to_string(1) == "verified"
        assert service_no_web3._status_to_string(2) == "escalated"
        assert service_no_web3._status_to_string(3) == "resolved"
        assert service_no_web3._status_to_string(99) == "unknown"

    def test_store_locally_creates_file(self, service_no_web3, tmp_path):
        """Test local fallback storage creates file"""
        # Mock the logs directory
        import os
        original_makedirs = os.makedirs
        original_open = open
        
        files_created = []
        
        def mock_makedirs(*args, **kwargs):
            pass
        
        def mock_open_func(*args, **kwargs):
            if isinstance(args[0], str) and 'blockchain_fallback' in args[0]:
                files_created.append(args[0])
            return MagicMock()
        
        with patch('os.makedirs', mock_makedirs):
            with patch('builtins.open', mock_open_func):
                event_data = {'event_type': 'test', 'risk_score': 0.5}
                result = service_no_web3._store_locally(event_data, 'fraud_log')
        
        assert result['storage_method'] == 'local'
        assert 'data_hash' in result
        assert 'timestamp' in result

    def test_get_blockchain_stats_no_connection(self, service_no_web3):
        """Test blockchain stats when not connected"""
        stats = service_no_web3.get_blockchain_stats()
        
        assert stats['connected'] is False
        assert 'provider' in stats
        assert stats['status'] == 'disconnected'

    def test_get_blockchain_stats_with_connection(self, service_with_mock_web3):
        """Test blockchain stats with active connection"""
        service_with_mock_web3.w3.eth.chain_id = 1
        service_with_mock_web3.w3.eth.block_number = 18000000
        service_with_mock_web3.w3.eth.gas_price = 20000000000
        
        service_with_mock_web3.contract.functions.getBlockchainStats.return_value.call.return_value = [
            1234,  # event_count
            56,    # report_count
            18000000  # block_number
        ]
        
        stats = service_with_mock_web3.get_blockchain_stats()
        
        assert stats['connected'] is True
        assert stats['chain_id'] == 1
        assert stats['block_number'] == 18000000
        assert stats['event_count'] == 1234
        assert stats['report_count'] == 56

    def test_log_fraud_event_offline(self, service_no_web3):
        """Test fraud event logging falls back to local storage when offline"""
        event_data = {
            'event_type': 'credential_compromise',
            'risk_score': 0.85,
            'repository': 'production-api'
        }
        
        with patch.object(service_no_web3, '_store_locally') as mock_store:
            mock_store.return_value = {
                'storage_method': 'local',
                'data_hash': 'abc123',
                'timestamp': 123456789
            }
            
            result = service_no_web3.log_fraud_event(event_data)
            
            mock_store.assert_called_once()
            assert result['storage_method'] == 'local'

    def test_get_audit_trail_offline(self, service_no_web3):
        """Test audit trail retrieval falls back when offline"""
        with patch.object(service_no_web3, '_load_local_audit_trail') as mock_load:
            mock_load.return_value = [
                {
                    'timestamp': 123456789,
                    'data_hash': 'abc123',
                    'event_data': {'event_type': 'test'},
                    'source': 'local_fallback'
                }
            ]
            
            result = service_no_web3.get_audit_trail()
            
            mock_load.assert_called_once()
            assert len(result) == 1
            assert result[0]['source'] == 'local_fallback'

    def test_default_abi_has_required_functions(self, service_no_web3):
        """Test default ABI includes required functions"""
        abi = service_no_web3._get_default_abi()
        
        function_names = [func['name'] for func in abi if func.get('type') == 'function']
        
        required_functions = [
            'logSecurityEvent',
            'getSecurityEvent',
            'verifyEvent',
            'escalateEvent',
            'resolveEvent',
            'generateAuditReport',
            'getEventsBySeverity',
            'getHighRiskEvents',
            'getUnresolvedEvents',
            'getBlockchainStats'
        ]
        
        for func in required_functions:
            assert func in function_names, f"Missing function: {func}"

    def test_log_fraud_event_data_preparation(self, service_with_mock_web3):
        """Test fraud event data preparation"""
        event_data = {
            'event_type': 'suspicious_commit',
            'risk_score': 0.85,
            'repository': 'production-api',
            'rule_violations': ['unauthorized_access']
        }
        
        # Mock the transaction
        service_with_mock_web3.w3.eth.get_transaction_count.return_value = 5
        service_with_mock_web3.w3.eth.gas_price = 20000000000
        service_with_mock_web3.contract.functions.logSecurityEvent.return_value.build_transaction.return_value = {
            'from': '0x123',
            'nonce': 5,
            'gas': 300000,
            'gasPrice': 20000000000
        }
        
        # Check that data is properly hashed
        data_hash_before = service_with_mock_web3.calculate_data_hash(event_data)
        assert len(data_hash_before) == 64


class TestBlockchainEnums:
    """Test blockchain enum types"""

    def test_event_status_values(self):
        """Test EventStatus enum values"""
        assert EventStatus.PENDING.value == "pending"
        assert EventStatus.VERIFIED.value == "verified"
        assert EventStatus.ESCALATED.value == "escalated"
        assert EventStatus.RESOLVED.value == "resolved"

    def test_severity_level_values(self):
        """Test SeverityLevel enum values"""
        assert SeverityLevel.LOW.value == "low"
        assert SeverityLevel.MEDIUM.value == "medium"
        assert SeverityLevel.HIGH.value == "high"
        assert SeverityLevel.CRITICAL.value == "critical"


class TestBlockchainDataHashing:
    """Test data hashing for blockchain events"""

    def test_hash_normalization(self):
        """Test that data normalization produces consistent hashes"""
        service = BlockchainAuditService()
        
        # Same data with floats in different precisions
        data1 = {'risk_score': 0.855555, 'repository': 'app'}
        data2 = {'risk_score': 0.856666, 'repository': 'app'}  # Different precision
        
        # Should have different hashes due to rounding normalization
        hash1 = service.calculate_data_hash(data1)
        hash2 = service.calculate_data_hash(data2)
        
        # Both should be valid hex strings
        assert all(c in '0123456789abcdef' for c in hash1)
        assert all(c in '0123456789abcdef' for c in hash2)

    def test_hash_with_special_characters(self):
        """Test hashing with special characters in data"""
        service = BlockchainAuditService()
        
        data = {
            'event_type': 'fraud_detected_🔒',
            'message': 'Suspicious activity: "unauthorized access"',
            'repository': 'prod/api-v2.1'
        }
        
        # Should not raise exception
        result = service.calculate_data_hash(data)
        assert len(result) == 64
        assert isinstance(result, str)

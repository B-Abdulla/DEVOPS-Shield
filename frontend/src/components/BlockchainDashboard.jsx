import React, { useState, useEffect, useCallback } from 'react';
import './BlockchainDashboard.css';

const BlockchainDashboard = () => {
  const [blockchainStats, setBlockchainStats] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [filterRepository, setFilterRepository] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

  // Fetch blockchain statistics
  const fetchBlockchainStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain/stats`);
      if (!response.ok) throw new Error('Failed to fetch blockchain stats');

      const data = await response.json();
      setBlockchainStats(data.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching blockchain stats:', err);
      setError(`Blockchain error: ${err.message}`);
    }
  }, [API_BASE_URL]);

  // Fetch health status
  const fetchHealthStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blockchain/health`);
      if (!response.ok) throw new Error('Failed to fetch health status');

      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      console.error('Error fetching health status:', err);
      setError(`Health status error: ${err.message}`);
    }
  }, [API_BASE_URL]);

  // Fetch audit trail
  const fetchAuditTrail = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterRepository) params.append('repository', filterRepository);

      const response = await fetch(`${API_BASE_URL}/api/blockchain/audit-trail?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit trail');

      const data = await response.json();
      setAuditTrail(data.audit_trail || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit trail:', err);
      setError(`Audit trail error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, filterSeverity, filterRepository]);

  // Initial load
  useEffect(() => {
    fetchBlockchainStats();
    fetchHealthStatus();
    fetchAuditTrail();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchBlockchainStats();
      fetchHealthStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAuditTrail, fetchBlockchainStats, fetchHealthStatus]);

  // Fetch audit trail when filters change
  useEffect(() => {
    fetchAuditTrail();
  }, [filterSeverity, filterRepository, fetchAuditTrail]);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return 'severity-unknown';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="blockchain-dashboard">
      <div className="blockchain-header">
        <h1>🔗 Blockchain Audit Trail</h1>
        <p>Immutable security event logging on distributed ledger</p>
      </div>

      {error && (
        <div className="blockchain-error-banner">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Blockchain Connection Status */}
      {healthStatus && (
        <div className={`blockchain-status-card ${healthStatus.healthy ? 'healthy' : 'unhealthy'}`}>
          <div className="status-indicator">
            <span className={`status-dot ${healthStatus.healthy ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {healthStatus.healthy ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          <div className="status-details">
            {healthStatus.blockchain_connected && (
              <span className="status-item">Blockchain: Online</span>
            )}
            {healthStatus.contract_available && (
              <span className="status-item">Contract: Deployed</span>
            )}
          </div>
        </div>
      )}

      {/* Blockchain Statistics */}
      {blockchainStats && (
        <div className="blockchain-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Provider</div>
            <div className="stat-value">{blockchainStats.provider?.split('/').pop() || 'Local'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Network</div>
            <div className="stat-value">{blockchainStats.network || 'Unknown'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Chain ID</div>
            <div className="stat-value">{blockchainStats.chain_id || 'N/A'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Block Number</div>
            <div className="stat-value">{blockchainStats.block_number?.toLocaleString() || 'N/A'}</div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-label">Logged Events</div>
            <div className="stat-value">{blockchainStats.event_count || 0}</div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-label">Audit Reports</div>
            <div className="stat-value">{blockchainStats.report_count || 0}</div>
          </div>
        </div>
      )}

      {/* Contract Information */}
      {blockchainStats?.contract_address && (
        <div className="contract-info">
          <h3>Smart Contract</h3>
          <div className="contract-details">
            <div className="detail-item">
              <span className="detail-label">Address:</span>
              <span className="detail-value monospace">{blockchainStats.contract_address}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${blockchainStats.contract_status}`}>
                {blockchainStats.contract_status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Filters */}
      <div className="audit-trail-filters">
        <h3>Audit Trail Filters</h3>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="severity-filter">Severity:</label>
            <select
              id="severity-filter"
              value={filterSeverity || ''}
              onChange={(e) => setFilterSeverity(e.target.value || null)}
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="repository-filter">Repository:</label>
            <input
              id="repository-filter"
              type="text"
              placeholder="Filter by repository..."
              value={filterRepository || ''}
              onChange={(e) => setFilterRepository(e.target.value || null)}
            />
          </div>

          <button className="refresh-btn" onClick={fetchAuditTrail} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="audit-trail-section">
        <h3>Immutable Event Log</h3>
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading audit trail...</p>
          </div>
        ) : auditTrail.length > 0 ? (
          <div className="audit-trail-table-container">
            <table className="audit-trail-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Event Type</th>
                  <th>Risk Score</th>
                  <th>Repository</th>
                  <th>Status</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((event) => (
                  <tr key={event.event_id} className="audit-event-row">
                    <td className="time-cell">
                      <span className="timestamp">{formatTimestamp(event.timestamp)}</span>
                    </td>
                    <td className="severity-cell">
                      <span className={`severity-badge ${getSeverityBadgeClass(event.severity)}`}>
                        {event.severity?.toUpperCase()}
                      </span>
                    </td>
                    <td className="event-type-cell">
                      <code>{event.event_type}</code>
                    </td>
                    <td className="risk-score-cell">
                      <div className="risk-score-bar">
                        <div
                          className="risk-score-fill"
                          style={{
                            width: `${Math.min(event.risk_score, 100)}%`,
                            backgroundColor: getSeverityColor(event.severity),
                          }}
                        ></div>
                      </div>
                      <span className="risk-value">{event.risk_score}</span>
                    </td>
                    <td className="repository-cell">
                      {event.repository}
                    </td>
                    <td className="status-cell">
                      <span className={`status-badge status-${event.status}`}>
                        {event.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="verified-cell">
                      {event.verified ? (
                        <span className="verified-badge">✓ Verified</span>
                      ) : (
                        <span className="unverified-badge">✗ Unverified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-events">
            <p>No security events found in audit trail</p>
          </div>
        )}
      </div>

      {/* Blockchain Information */}
      <div className="blockchain-info">
        <h3>Blockchain Information</h3>
        <div className="info-content">
          <div className="info-item">
            <strong>Audit Trail Type:</strong> Immutable Ledger with Multi-Signature Verification
          </div>
          <div className="info-item">
            <strong>Features:</strong>
            <ul>
              <li>Event chaining for tamper-proof logs</li>
              <li>Multi-signature verification support</li>
              <li>Audit report generation</li>
              <li>Cryptographic event hashing</li>
            </ul>
          </div>
          <div className="info-item">
            <strong>Data Hash Algorithm:</strong> SHA-256
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDashboard;

import React from 'react';
import './UserProfile.css';

const UserProfile = ({ authSession }) => {
  const securityScore = authSession?.mfa_verified ? 100 : 75;

  return (
    <div className="page user-profile">
      <div className="page-header">
        <div>
          <h1>User Profile</h1>
          <p className="page-subtitle">Manage your account identity, security posture, and access levels.</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column: Avatar & Summary */}
        <div className="profile-sidebar">
          <section className="card">
            <div className="profile-avatar">👤</div>
            <h3>{authSession?.account || 'Unknown User'}</h3>
            <p className="muted">{authSession?.role || 'Guest'}</p>
            <div className={`badge ${authSession?.status === 'Connected' ? 'badge-success' : 'badge-idle'}`}>
              {authSession?.status || 'Active'}
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="label">Access Level</span>
                <strong>{authSession?.role === 'admin' ? 'Full' : 'Scoped'}</strong>
              </div>
              <div className="stat-item">
                <span className="label">Security Score</span>
                <strong style={{ color: securityScore > 80 ? 'var(--status-success, #2ea44f)' : 'var(--status-error, #f85149)' }}>
                  {securityScore}%
                </strong>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Details & Security */}
        <div className="profile-main">
          <section className="card">
            <header className="card-header">
              <h2>Account Details</h2>
            </header>
            <div className="profile-details-list">
              <span className="label">Account Name</span>
              <span>{authSession?.account}</span>
              <span className="label">Email Address</span>
              <span>{authSession?.email || 'Not verified'}</span>
              <span className="label">Organization</span>
              <span>{authSession?.organization || 'Global Tech'}</span>
              <span className="label">Session ID</span>
              <code style={{ fontSize: '0.8rem' }}>{authSession?.id || 'sess_abc123'}</code>
            </div>
          </section>

          <section className="card">
            <header className="card-header">
              <h2>Security Posture</h2>
            </header>
            <div className="security-posture-items">
              <div className="posture-item">
                <div>
                  <strong>Multi-Factor Authentication</strong>
                  <p className="muted">Protects your account from unauthorized access.</p>
                </div>
                <span className={`status-chip ${authSession?.mfa_verified ? 'status-online' : 'status-offline'}`}>
                  {authSession?.mfa_verified ? 'Enforced' : 'Pending'}
                </span>
              </div>
              <div className="posture-item">
                <div>
                  <strong>Session Integrity</strong>
                  <p className="muted">Last verification recorded on blockchain ledger.</p>
                </div>
                <span className="status-chip status-online">
                  Verified
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

import React, { useEffect, useMemo, useState } from 'react';
import { formatDateTime } from '../utils/dateHelpers';

const defaultFormState = (session) => ({
  username: session?.account || '',
  token: '',
  scopes: session?.scopes?.join(', ') || 'repo, admin:repo_hook',
  org: ''
});

const GitHubConnect = ({ authSession, onConnect, onDisconnect }) => {
  const [form, setForm] = useState(() => defaultFormState(authSession));
  const [saving, setSaving] = useState(false);
  const connectionStatus = useMemo(() => authSession?.status || 'Disconnected', [authSession]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      username: authSession?.account || prev.username,
      scopes: authSession?.scopes?.join(', ') || prev.scopes
    }));
  }, [authSession?.account, authSession?.scopes]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const scopes = form.scopes
      .split(',')
      .map((scope) => scope.trim())
      .filter(Boolean);

    onConnect?.({
      username: form.username,
      token: form.token,
      scopes,
      org: form.org
    });
    setSaving(false);
    setForm((prev) => ({ ...prev, token: '' }));
  };

  const handleDisconnect = () => {
    onDisconnect?.();
  };

  return (
    <div className="github-connect grid">
      <div className="page-header">
        <div>
          <h1>GitHub Connect</h1>
          <p className="page-subtitle">Authorize DevOps Shield, enforce PKCE, and monitor OAuth posture from one place.</p>
        </div>
      </div>

      <section className="card span-2">
        <header className="card-header">
          <div>
            <h2>GitHub integration</h2>
            <p className="muted">Authorize DevOps Shield to observe pipelines, runners, and security posture directly from your GitHub organization.</p>
          </div>
          <span className={`badge ${connectionStatus === 'Connected' ? 'badge-success' : 'badge-idle'}`}>
            {connectionStatus}
          </span>
        </header>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>GitHub username</span>
            <input
              type="text"
              name="username"
              placeholder="octocat"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Organization (optional)</span>
            <input
              type="text"
              name="org"
              placeholder="civil-infra"
              value={form.org}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>Personal access token</span>
            <input
              type="password"
              name="token"
              placeholder="ghp_****************"
              value={form.token}
              onChange={handleChange}
              required
            />
            <p className="muted">Token stored server-side via Vault. We never persist it in the browser.</p>
          </label>

          <label>
            <span>Scopes</span>
            <input
              type="text"
              name="scopes"
              value={form.scopes}
              onChange={handleChange}
            />
            <p className="muted">Comma-separated GitHub scopes. We recommend repo, admin:repo_hook, workflow.</p>
          </label>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Connecting…' : 'Connect GitHub'}
            </button>
            <button type="button" className="btn-outline" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <header className="card-header">
          <h3>Connection health</h3>
          <p className="muted">Monitor OAuth posture and sync cadence.</p>
        </header>
        <dl className="status-grid">
          <div>
            <dt>Account</dt>
            <dd>{authSession?.account || 'Not connected'}</dd>
          </div>
          <div>
            <dt>Scopes</dt>
            <dd>{authSession?.scopes?.join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>Last verification</dt>
            <dd>{authSession?.lastVerification ? formatDateTime(authSession.lastVerification) : 'Never'}</dd>
          </div>
          <div>
            <dt>PKCE enforced</dt>
            <dd>{authSession?.pkce ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Least privilege</dt>
            <dd>{authSession?.leastPrivilege ? 'Yes' : 'Review'}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <header className="card-header">
          <h3>How the OAuth flow works</h3>
        </header>
        <ol className="instructions">
          <li>Create a GitHub OAuth app or fine-grained PAT with the scopes above.</li>
          <li>Paste the token and click <strong>Connect GitHub</strong>.</li>
          <li>DevOps Shield stores the credential in Vault and exchanges it for short-lived runner tokens.</li>
          <li>On success we start ingesting repository, runner, and audit telemetry within 60 seconds.</li>
        </ol>
        <p className="muted">Need SSO or GitHub Enterprise Cloud? Reach out to the platform team for service account provisioning.</p>
      </section>
    </div>
  );
};

export default GitHubConnect;

import React from 'react';
import { formatDateTime } from '../utils/dateHelpers';
import AuthBanner from '../components/AuthBanner.jsx';
import SecurityHighlights from '../components/SecurityHighlights.jsx';

const SettingsPage = ({ integrations = [], policies = [], authSession, securityHighlights = [] }) => (
  <div className="settings-page">
    <div className="page-header">
      <div>
        <h1>Settings & Controls</h1>
        <p className="page-subtitle">Manage integrations, enforce policies, and keep guardrails aligned to standards.</p>
      </div>
    </div>

    <AuthBanner session={authSession} />
    <SecurityHighlights items={securityHighlights} />
    <section className="card">
      <header className="card-header">
        <div>
          <h2>Integrations</h2>
          <p className="muted">Connect code hosts, CI engines, and ticketing systems.</p>
        </div>
        <button type="button" className="btn-outline">Add integration</button>
      </header>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Status</th>
            <th scope="col">Critical</th>
            <th scope="col">Last sync</th>
            <th scope="col">Scopes</th>
          </tr>
        </thead>
        <tbody>
          {integrations.map((integration) => (
            <tr key={integration.id}>
              <td>{integration.name}</td>
              <td>{integration.status}</td>
              <td>{integration.critical ? 'Yes' : 'No'}</td>
              <td>{integration.lastSync ? formatDateTime(integration.lastSync) : 'Never'}</td>
              <td>{integration.scopes.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>

    <section className="card">
      <header className="card-header">
        <h2>Policies & controls</h2>
        <p className="muted">Enforce least privilege, MFA, and artifact quarantine across the platform.</p>
      </header>
      <ul className="policies">
        {policies.map((policy) => (
          <li key={policy.id}>
            <div>
              <h3>{policy.name}</h3>
              <p className="muted">{policy.description}</p>
            </div>
            <span className="policy-status">{policy.status}</span>
          </li>
        ))}
      </ul>
    </section>
  </div>
);

export default SettingsPage;

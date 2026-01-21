import React from 'react';
import AlertsTable from '../components/AlertsTable';

const AlertsPage = ({ alerts, onAction }) => (
  <div className="alerts-page">
    <div className="page-header">
      <div>
        <h1>Alerts & Playbooks</h1>
        <p className="page-subtitle">Prioritize threats, route work, and apply the right response steps every time.</p>
      </div>
    </div>

    <AlertsTable alerts={alerts} onAction={onAction} />
    <section className="card playbook">
      <header className="card-header">
        <h2>Incident playbook</h2>
        <p className="muted">Every triage step is mapped to rollback, quarantine, and regulator notification flows.</p>
      </header>
      <ol>
        <li>Confirm incident scope via immutable logs.</li>
        <li>Quarantine affected pipeline runners and revoke secrets.</li>
        <li>Trigger automated rollback and notify stakeholders.</li>
        <li>Generate signed audit report and share with regulators if applicable.</li>
      </ol>
    </section>
  </div>
);

export default AlertsPage;

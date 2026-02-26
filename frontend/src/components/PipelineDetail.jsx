import React from 'react';
import RunCard from './RunCard';
import Timeline from './Timeline';
import RiskBadge from './RiskBadge';
import { formatDateTime } from '../utils/dateHelpers';
import { verifySignature } from '../utils/verifySignature';

const PipelineDetail = ({ pipeline, runs = [], activeRunId, onSelectRun, onAction }) => {
  if (!pipeline) {
    return (
      <section className="card pipeline-detail">
        <header className="card-header"><h2>Select a pipeline</h2></header>
        <p className="muted">Choose a pipeline to review detailed run history and risk posture.</p>
      </section>
    );
  }

  const selectedRun = runs.find((run) => run.runId === activeRunId) || runs[0];
  const proofCheck = verifySignature(selectedRun?.immutableProof || {});

  return (
    <section className="pipeline-detail-premium">
      <header className="detail-hero-card">
        <div className="hero-info">
          <span className="badge-premium" style={{ marginBottom: '12px', display: 'inline-block' }}>
            {pipeline.lastStatus}
          </span>
          <h2>{pipeline.name}</h2>
          <p className="muted" style={{ maxWidth: '400px' }}>{pipeline.description}</p>
          <div className="tags" style={{ marginTop: '16px' }}>
            {pipeline.tags?.map((tag) => <span key={tag} className="tag">{tag}</span>)}
          </div>
        </div>
        <div className="hero-viz">
          <div className="viz-score">{pipeline.lastRiskScore}%</div>
          <div className="viz-label">Security Posture</div>
          <RiskBadge score={pipeline.lastRiskScore} level={pipeline.lastRiskLevel} size="md" />
        </div>
      </header>

      <div className="detail-content">
        <aside className="run-history card">
          <h3>Run history</h3>
          <p className="muted">Select a run to inspect every control gate and evidence trail.</p>
          <ul className="run-list">
            {runs.map((run) => (
              <li key={run.runId} className={run.runId === selectedRun?.runId ? 'active' : ''}>
                <button type="button" onClick={() => onSelectRun?.(run.runId)}>
                  <div className="run-list-top">
                    <span>{run.runId}</span>
                    <RiskBadge score={run.risk?.score} level={run.risk?.level} size="sm" />
                  </div>
                  <span className="muted">{formatDateTime(run.completedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="run-detail">
          <RunCard run={selectedRun} onAction={onAction} />

          <section className="card evidence-panel">
            <header className="card-header">
              <h3>Immutable evidence</h3>
              <span className={`proof-status ${proofCheck.valid ? 'proof-valid' : 'proof-invalid'}`}>
                {proofCheck.valid ? 'Valid' : 'Invalid'}
              </span>
            </header>
            {selectedRun?.immutableProof ? (
              <dl className="proof-grid">
                <div><dt>Ledger Hash</dt><dd>{selectedRun.immutableProof.chainHash}</dd></div>
                <div><dt>Transaction Id</dt><dd>{selectedRun.immutableProof.txId}</dd></div>
                <div><dt>Signature</dt><dd>{selectedRun.immutableProof.signature}</dd></div>
                <div><dt>Verification</dt><dd>{proofCheck.reason}</dd></div>
              </dl>
            ) : (
              <p className="muted">No immutable proof attached.</p>
            )}

            <div className="evidence-links">
              <a href={selectedRun?.evidence?.logsUrl} target="_blank" rel="noreferrer" className="btn-outline-sm">📄 View Logs</a>
              <a href={selectedRun?.evidence?.diffUrl} target="_blank" rel="noreferrer" className="btn-outline-sm">🔀 Inspect Diff</a>
              {selectedRun?.evidence?.scaUrl && (
                <a href={selectedRun.evidence.scaUrl} target="_blank" rel="noreferrer" className="btn-outline-sm">🛡️ SCA Report</a>
              )}
            </div>
          </section>

          <section className="card timeline-wrapper">
            <header className="card-header">
              <h3>Stage timeline</h3>
              <p className="muted">Each checkpoint must pass for deployment to proceed.</p>
            </header>
            <Timeline stages={selectedRun?.stages || []} />
          </section>
        </div>
      </div>
    </section>
  );
};

export default PipelineDetail;

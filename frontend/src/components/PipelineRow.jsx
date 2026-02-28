import React from 'react';
import RiskBadge from './RiskBadge';
import PipelineDetail from './PipelineDetail';

const PipelineRow = ({ pipeline, runs, isExpanded, activeRunId, onSelect, onSelectRun, onAction }) => {
  const trendValues = pipeline.trend || [];
  const lastTrend = trendValues[trendValues.length - 1];
  const trendDirection = trendValues.length >= 2 && trendValues[trendValues.length - 1] > trendValues[trendValues.length - 2]
    ? 'up'
    : 'down';

  const isHealthy = pipeline.lastStatus === 'Success' || pipeline.lastStatus === 'Passed';

  return (
    <div
      className={`pipeline-row-accordion ${isExpanded ? 'expanded-row' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(pipeline)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSelect?.(pipeline);
      }}
    >
      <div className="accordion-header">
        <div className="pipeline-row-main">
          <h3>{pipeline.name}</h3>
          <p className="muted" style={{ fontSize: '0.85rem', margin: '4px 0', opacity: 0.8 }}>{pipeline.description}</p>
        </div>

        <div className="accordion-meta-cluster">
          <div className="row-tags">
            {pipeline.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="row-tag">{tag}</span>
            ))}
            {pipeline.tags?.length > 2 && <span className="row-tag">+{pipeline.tags.length - 2}</span>}
          </div>

          <div className={`mini-trend ${trendDirection}`}>
            {trendDirection === 'up' ? '📈' : '📉'}
            <span>{Math.abs(lastTrend ?? 0)}%</span>
          </div>

          <RiskBadge score={pipeline.lastRiskScore} level={pipeline.lastRiskLevel} size="sm" />

          <div className="expand-indicator">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="accordion-body glass-panel" style={{ background: 'transparent', padding: '0 1.5rem 1.5rem', border: 'none', boxShadow: 'none' }}>
          <PipelineDetail
            inlineMode={true}
            pipeline={pipeline}
            runs={runs}
            activeRunId={activeRunId}
            onSelectRun={onSelectRun}
            onAction={onAction}
          />
        </div>
      )}
    </div>
  );
};

const runsById = {};

export const registerPipelineRuns = (runs) => {
  if (Array.isArray(runs)) {
    runs.forEach((run) => {
      runsById[run.runId] = run;
    });
  }
};

export default PipelineRow;

import React from 'react';
import RiskBadge from './RiskBadge';

const PipelineRow = ({ pipeline, onSelect }) => {
  const trendValues = pipeline.trend || [];
  const lastTrend = trendValues[trendValues.length - 1];
  const trendDirection = trendValues.length >= 2 && trendValues[trendValues.length - 1] > trendValues[trendValues.length - 2]
    ? 'up'
    : 'down';

  const isHealthy = pipeline.lastStatus === 'Success' || pipeline.lastStatus === 'Passed';

  return (
    <div
      className={`pipeline-row ${onSelect && pipeline.id === undefined ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(pipeline)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onSelect?.(pipeline);
      }}
    >
      <div className="row-header">
        <div className="pipeline-row-main">
          <h3>{pipeline.name}</h3>
          <p className="muted" style={{ fontSize: '0.8rem', margin: '4px 0' }}>{pipeline.description}</p>
        </div>
        <span className="status-icon" title={`Status: ${pipeline.lastStatus}`}>
          {isHealthy ? '✅' : '❌'}
        </span>
      </div>

      <div className="row-meta">
        <div className="row-tags">
          {pipeline.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="row-tag">{tag}</span>
          ))}
          {pipeline.tags?.length > 2 && <span className="row-tag">+{pipeline.tags.length - 2}</span>}
        </div>

        <div className="pipeline-metrics">
          <div className={`mini-trend ${trendDirection}`}>
            {trendDirection === 'up' ? '📈' : '📉'}
            <span>{Math.abs(lastTrend ?? 0)}%</span>
          </div>
        </div>

        <RiskBadge score={pipeline.lastRiskScore} level={pipeline.lastRiskLevel} size="sm" />
      </div>
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

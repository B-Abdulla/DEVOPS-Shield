import React, { useMemo } from 'react';
import PipelineRow, { registerPipelineRuns } from './PipelineRow';

const PipelineList = ({ pipelines = [], runs = {}, onSelectPipeline }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('risk');

  const flattenedRuns = useMemo(() => Object.values(runs).flat(), [runs]);
  registerPipelineRuns(flattenedRuns);

  const filteredPipelines = useMemo(() => {
    let result = pipelines.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'risk') {
      result.sort((a, b) => b.lastRiskScore - a.lastRiskScore);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [pipelines, searchTerm, sortBy]);

  return (
    <section className="card pipeline-list">
      <header className="card-header">
        <div>
          <h2>Pipelines</h2>
          <p className="muted" style={{ fontSize: '0.8rem' }}>Monitor the risk posture of every CI/CD workflow.</p>
        </div>
      </header>

      <div className="list-controls">
        <input
          type="text"
          placeholder="Search pipelines..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="risk">Sort by Risk</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="pipeline-list-body">
        {filteredPipelines.map((pipeline) => (
          <PipelineRow key={pipeline.id} pipeline={pipeline} onSelect={onSelectPipeline} />
        ))}
        {filteredPipelines.length === 0 && (
          <div className="empty-state" style={{ padding: '40px' }}>
            <span>🔍</span>
            <p>No pipelines found matching your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PipelineList;

import React, { useState, useEffect, useCallback } from 'react';
import RiskGraph from '../components/RiskGraph'; // Check path!
import fraudController from '../api/fraudController';
import alertsController from '../api/alertsController';
import simulateController from '../api/simulateController';
import './Dashboard.css';

const Dashboard = () => {
  // --- STATE ---
  const [stats, setStats] = useState({
    total_analyses: 1240, // Default non-zero for better UI
    average_risk_score: 0.12,
    high_risk_analyses: 0,
    active_alerts: 0
  });

  // eslint-disable-next-line no-unused-vars
  const [graphData, setGraphData] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [simulationLog, setSimulationLog] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notification, setNotification] = useState(null);

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const statsData = await fraudController.getFraudStats();
      console.log('[Dashboard] Stats received:', statsData);
      
      // Extract stats from response
      const statsToUse = statsData?.data || statsData;
      if(statsToUse && (statsToUse.total_analyses !== undefined || statsToUse.average_risk_score !== undefined)) {
         setStats(statsToUse);
      }
      
      const alertsRes = await alertsController.getRecentAlerts(5);
      setRecentAlerts(alertsRes?.alerts || []);
    } catch (error) {
      console.warn("API Error (Using Fallback):", error);
      // Keep using default stats from state
    } finally {
      setLastUpdated(new Date());
      setLoading(false);
    }
  }, []);

  // --- SIMULATION HANDLER (DEMO MODE) ---
  const handleSimulation = async () => {
    try {
      setNotification({ type: 'info', message: 'Triggering Simulation...' });

      // 1. Call API
      const res = await simulateController.simulateFraud();
      console.log('[Simulation] Full response:', res);
      
      // Handle different response structures
      const fraudEvent = res?.fraud_event || res?.data?.fraud_event || res;
      console.log('[Simulation] Extracted fraud event:', fraudEvent);

      if (!fraudEvent || !fraudEvent.event_id) {
        throw new Error("Invalid fraud event data: " + JSON.stringify(fraudEvent));
      }

      // 2. Update UI Log with actual event data
      setSimulationLog({
        event_id: fraudEvent.event_id,
        timestamp: fraudEvent.timestamp || new Date().toISOString(),
        risk_score: fraudEvent.risk_score || 0.85,
        message: fraudEvent.message || "Simulated fraudulent activity detected",
        activity: fraudEvent.activity || {
          commit_id: "unknown",
          author: "unknown_user",
          changes_detected: [],
          flags: []
        }
      });

      // 3. Update Stats based on risk score
      const riskScore = fraudEvent.risk_score || 0.85;
      setStats(prev => ({
        ...prev,
        active_alerts: prev.active_alerts + 1,
        high_risk_analyses: riskScore >= 0.7 ? prev.high_risk_analyses + 1 : prev.high_risk_analyses,
        total_analyses: prev.total_analyses + 1,
        average_risk_score: ((prev.average_risk_score * (prev.total_analyses - 1)) + riskScore) / prev.total_analyses
      }));

      // 4. Create alert from fraud event data
      const newAlert = {
        id: `alert-${fraudEvent.event_id}`,
        type: "fraud_detected",
        severity: riskScore >= 0.8 ? "critical" : riskScore >= 0.5 ? "high" : "medium",
        message: fraudEvent.message || "Simulated Fraud Event Detected",
        repository: fraudEvent.activity?.commit_id || "demo-repo",
        risk_score: riskScore,
        event_id: fraudEvent.event_id,
        created_at: Date.now() / 1000,
        resolved: false,
        details: fraudEvent.activity
      };

      // 5. Save to localStorage
      const existingSims = JSON.parse(localStorage.getItem('simulatedAlerts') || '[]');
      localStorage.setItem('simulatedAlerts', JSON.stringify([newAlert, ...existingSims].slice(0, 50)));
    
      // 6. Update alerts list
      setRecentAlerts(prev => [newAlert, ...prev].slice(0, 5));

      setNotification({ 
        type: 'success', 
        message: `🚨 Event #${fraudEvent.event_id} - Risk: ${(riskScore * 100).toFixed(0)}%` 
      });

    } catch (err) {
      console.error("Simulation failed:", err);
      setNotification({ type: 'error', message: 'Simulation Error: ' + err.message });
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [fetchDashboardData, notification]);


  const getRiskColor = (score) => {
    if (score >= 0.7) return '#ef4444';
    if (score >= 0.4) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div className="dashboard-container">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`dashboard-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h2>🛡️ Security Command Center</h2>
          <p className="dashboard-status">
            <span className="status-indicator"></span>
            System Operational • Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--'}
          </p>
        </div>
        <div className="dashboard-actions">
          <button onClick={handleSimulation} className="btn-simulate">⚡ Simulate Attack</button>
          <button onClick={fetchDashboardData} className="btn-refresh">🔄 Refresh</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <StatCard icon="📊" title="Total Scans" value={stats.total_analyses.toLocaleString()} color="#3b82f6" />
        <StatCard icon="🛡️" title="Avg Risk Score" value={`${(stats.average_risk_score * 100).toFixed(1)}%`} color={getRiskColor(stats.average_risk_score)} />
        <StatCard icon="🚨" title="High Risk Events" value={stats.high_risk_analyses} color="#ef4444" isAlert={stats.high_risk_analyses > 0} />
        <StatCard icon="🔔" title="Active Alerts" value={stats.active_alerts} color="#f59e0b" />
      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* Risk Graph Container */}
        <div className="glass-card risk-graph-container">
          <RiskGraph data={graphData} />
        </div>

        {/* Right Sidebar: Logs & Alerts */}
        <div className="sidebar">
          
          {/* Simulation Output Box */}
          {simulationLog && (
            <div className="glass-card simulation-output">
              <h4>⚠️ Attack Detected</h4>
              <div className="simulation-details">
                <div>ID: {simulationLog.event_id}</div>
                <div>Risk: <span style={{color:'#ef4444', fontWeight:'bold'}}>{simulationLog.risk_score}</span></div>
                <div>Files: {simulationLog.activity?.changes_detected?.join(', ')}</div>
              </div>
            </div>
          )}

          {/* Recent Alerts List */}
          <div className="glass-card">
            <h3>Recent Threats</h3>
            <div className="threats-list">
              {recentAlerts.length === 0 ? (
                <div className="no-threats">No active threats.</div>
              ) : (
                recentAlerts.map((alert, idx) => (
                  <div key={idx} className={`threat-item ${alert.severity}`}>
                    <div className="threat-type">{alert.type}</div>
                    <div className="threat-message">{alert.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, isAlert }) => (
  <div className={`stat-card ${isAlert ? 'alert' : ''}`}>
    <div className="stat-icon" style={{ background: `${color}20` }}>{icon}</div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
);

export default Dashboard;
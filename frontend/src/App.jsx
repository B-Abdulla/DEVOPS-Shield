import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './App.css';
import './components/EnhancedDataViz.css';
import './utils/svgFix'; // Import SVG viewBox fix
import Navbar from './components/Navbar';
import { VIEWS, NAVIGATION_ITEMS } from './constants/views';
import BlockchainDashboard from './components/BlockchainDashboard.jsx';
import AuthBanner from './components/AuthBanner.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import NotificationSystem from './components/NotificationSystem.jsx';
import ChatAssistant from './components/ChatAssistant.jsx';
import Dashboard from './pages/Dashboard.jsx';
import UserProfile from './pages/UserProfile.jsx';
import ThreatIntel from './pages/ThreatIntel.jsx';
import Reports from './pages/Reports.jsx';
import IntegrationsPage from './pages/Integrations.jsx';
import HelpPage from './pages/Help.jsx';
import Pipelines from './pages/Pipelines.jsx';
import AlertsPage from './pages/Alerts.jsx';
import AuditPage from './pages/Audit.jsx';
import SettingsPage from './pages/Settings.jsx';
import ImpactPage from './pages/Impact.jsx';
import SimulationPage from './pages/Simulation.jsx';
import GitHubConnect from './pages/GitHubConnect.jsx';
import LandingPage from './pages/LandingPage.jsx';
import {
  pipelines as pipelineData,
  runsByPipeline as runsData,
  alerts as alertData,
  auditRecords,
  impactMetrics,
  integrations,
  policyControls,
  authSession,
  securityHighlights,
  attackScenarios,
  simulationRiskHistory,
} from './utils/sampleData.js';

// Navigation logic refactored to constants/views.js and components/Navbar.jsx

const App = () => {
  // State management
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [activePipelineId, setActivePipelineId] = useState(pipelineData[0]?.id);
  const [activeRunId, setActiveRunId] = useState(runsData[pipelineData[0]?.id]?.[0]?.runId);
  const [alertsState, setAlertsState] = useState(alertData);
  const [authState, setAuthState] = useState(authSession);
  const [integrationsState, setIntegrationsState] = useState(integrations);
  const [latestIncident, setLatestIncident] = useState(null);
  const [simulationRisk, setSimulationRisk] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  // Refs
  const mainContentRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Memoized values
  // Navigation items filtering moved to Navbar.jsx

  const criticalAlertsCount = useMemo(() => {
    return alertsState.filter(alert =>
      alert.severity === 'Critical' && alert.status === 'Open'
    ).length;
  }, [alertsState]);

  // Effects
  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('devops-shield-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Initialize sidebar state
    const savedSidebarState = localStorage.getItem('devops-shield-sidebar-collapsed');
    if (savedSidebarState !== null) {
      setSidebarCollapsed(JSON.parse(savedSidebarState));
    }

    // Initialize keyboard shortcuts
    const handleKeyboardShortcuts = (e) => {
      if (!keyboardShortcutsEnabled || !e.key) return;

      const ctrlKey = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (ctrlKey) {
        switch (key) {
          case 'd':
            e.preventDefault();
            setView(VIEWS.DASHBOARD);
            break;
          case 'p':
            e.preventDefault();
            setView(VIEWS.PIPELINES);
            break;
          case 'a':
            e.preventDefault();
            setView(VIEWS.ALERTS);
            break;
          case 's':
            e.preventDefault();
            setView(VIEWS.SIMULATION);
            break;
          case 'u':
            e.preventDefault();
            setView(VIEWS.USER_PROFILE);
            break;
          case 't':
            e.preventDefault();
            setView(VIEWS.THREAT_INTEL);
            break;
          case 'r':
            e.preventDefault();
            setView(VIEWS.REPORTS);
            break;
          case 'n':
            e.preventDefault();
            setView(VIEWS.INTEGRATIONS);
            break;
          case 'h':
            e.preventDefault();
            setView(VIEWS.HELP);
            break;
          case 'l':
            e.preventDefault();
            setView(VIEWS.AUDIT);
            break;
          case 'i':
            e.preventDefault();
            setView(VIEWS.IMPACT);
            break;
          case 'g':
            e.preventDefault();
            setView(VIEWS.GITHUB);
            break;
          case 'b':
            e.preventDefault();
            setView(VIEWS.BLOCKCHAIN);
            break;
          default:
            setSearchQuery('');
            document.getElementById('nav-search')?.focus();
            break;
        }
      }

      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [keyboardShortcutsEnabled, searchQuery]);

  useEffect(() => {
    // Auto-save preferences
    localStorage.setItem('devops-shield-theme', theme);
    localStorage.setItem('devops-shield-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [theme, sidebarCollapsed]);

  useEffect(() => {
    // Focus management for accessibility
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, [view]);

  // Callback functions
  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    const notification = { id, message, type, timestamp: new Date() };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const onSelectPipeline = useCallback((pipelineId) => {
    setActivePipelineId(pipelineId);
    const nextRunId = runsData[pipelineId]?.[0]?.runId;
    setActiveRunId(nextRunId);
    setView(VIEWS.PIPELINES);
    addNotification(`Switched to pipeline: ${pipelineId}`, 'success');
  }, [addNotification]);

  const onSelectRun = useCallback((runId) => {
    setActiveRunId(runId);
    addNotification(`Selected run: ${runId}`, 'info');
  }, [addNotification]);

  const onRunAction = useCallback((action, payload) => {
    setIsLoading(true);
    console.info('Run action', action, payload?.runId);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      addNotification(`Action "${action}" executed for run ${payload?.runId}`, 'success');
    }, 1000);
  }, [addNotification]);

  const onAlertAction = useCallback((action, payload) => {
    if (!payload?.id) return;

    const alertId = payload.id;
    const updateStatus = (status) => {
      setAlertsState(prev => prev.map((alert) =>
        alert.id === alertId ? { ...alert, status } : alert
      ));
    };

    switch (action) {
      case 'ack':
        updateStatus('Acknowledged');
        addNotification(`Alert ${alertId} acknowledged`, 'success');
        break;
      case 'resolve':
        updateStatus('Resolved');
        addNotification(`Alert ${alertId} resolved`, 'success');
        if (latestIncident?.id?.toLowerCase() === alertId.toLowerCase()) {
          setLatestIncident(null);
          setSimulationRisk(0);
        }
        break;
      case 'rollback':
        updateStatus('Mitigating');
        addNotification(`Rollback initiated for alert ${alertId}`, 'warning');
        break;
      case 'ticket':
        updateStatus('Escalated');
        addNotification(`Alert ${alertId} escalated to support team`, 'info');
        break;
      default:
        break;
    }

    console.info('Alert action', action, alertId);
  }, [latestIncident, addNotification]);

  const onExport = useCallback((format, record) => {
    setIsLoading(true);
    console.info('Export', format, record?.id);

    // Simulate export process
    setTimeout(() => {
      setIsLoading(false);
      addNotification(`Exported ${record?.id} in ${format} format`, 'success');
    }, 1500);
  }, [addNotification]);

  const onReconnect = useCallback((provider) => {
    setIsLoading(true);
    console.info('Re-authenticate provider', provider);

    const now = new Date().toISOString();
    setAuthState(prev => ({
      ...prev,
      status: 'Connected',
      lastVerification: now
    }));
    setIntegrationsState(prev => prev.map((integration) =>
      integration.id === 'github'
        ? { ...integration, status: 'Connected', lastSync: now }
        : integration
    ));

    setTimeout(() => {
      setIsLoading(false);
      addNotification(`Successfully reconnected to ${provider}`, 'success');
    }, 1000);
  }, [addNotification]);

  const handleGitHubDisconnect = useCallback(() => {
    const now = new Date().toISOString();
    setAuthState(prev => ({
      ...prev,
      status: 'Disconnected',
      lastVerification: now,
      scopes: prev.scopes || []
    }));
    setIntegrationsState(prev => prev.map((integration) =>
      integration.id === 'github'
        ? { ...integration, status: 'Disconnected', lastSync: now }
        : integration
    ));
    addNotification('GitHub disconnected', 'info');
  }, [addNotification]);

  const handleGitHubConnect = useCallback(({ username, scopes, org }) => {
    const now = new Date().toISOString();
    setAuthState(prev => ({
      ...prev,
      status: 'Connected',
      account: username || prev.account,
      scopes: scopes?.length ? scopes : prev.scopes,
      organization: org || prev.organization,
      lastVerification: now
    }));
    setIntegrationsState(prev => prev.map((integration) =>
      integration.id === 'github'
        ? {
          ...integration,
          status: 'Connected',
          lastSync: now,
          scopes: scopes?.length ? scopes : integration.scopes
        }
        : integration
    ));
    addNotification(`Connected to GitHub as ${username}`, 'success');
  }, [addNotification]);

  const onDisconnect = useCallback((provider) => {
    console.info('Disconnect provider', provider);
    handleGitHubDisconnect();
  }, [handleGitHubDisconnect]);

  const handleSimulationIncident = useCallback((incident) => {
    const normalizedRisk = Number.isFinite(incident.riskScore)
      ? Math.max(0, Math.round(incident.riskScore))
      : 0;
    const severity = normalizedRisk >= 90 ? 'Critical' : normalizedRisk >= 75 ? 'High' : normalizedRisk >= 50 ? 'Medium' : 'Low';

    const newAlert = {
      id: incident.id.toLowerCase(),
      pipelineId: incident.pipelineId,
      title: `Simulated ${incident.scenarioName}`,
      severity,
      createdAt: incident.timestamp,
      status: 'Open',
      riskScore: normalizedRisk,
      impact: incident.message || 'Automated drill impact pending review'
    };

    setAlertsState(prev => [newAlert, ...prev.filter(alert => alert.id !== newAlert.id)]);
    setLatestIncident({ ...incident, riskScore: normalizedRisk, severity });
    setSimulationRisk(normalizedRisk);

    addNotification(`Simulation incident: ${incident.scenarioName}`, 'warning', 8000);
  }, [addNotification]);

  const handleSimulationReset = useCallback(() => {
    setSimulationRisk(0);
    setLatestIncident(null);
    addNotification('Simulation reset completed', 'info');
  }, [addNotification]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    addNotification(`Switched to ${newTheme} theme`, 'info');
  }, [theme, addNotification]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleNavigation = useCallback((viewId) => {
    setView(viewId);
    setSearchQuery(''); // Clear search when navigating
  }, []);

  // Render content based on current view
  const renderContent = () => {
    const commonProps = {
      isLoading,
      notifications,
      addNotification
    };

    switch (view) {
      case VIEWS.DASHBOARD:
        return (
          <Dashboard
            pipelines={pipelineData}
            runsByPipeline={runsData}
            alerts={alertsState}
            impactMetrics={impactMetrics}
            authSession={authState}
            securityHighlights={securityHighlights}
            integrations={integrationsState}
            latestIncident={latestIncident}
            onSelectPipeline={onSelectPipeline}
            onRunAction={onRunAction}
            onAlertAction={onAlertAction}
            onViewAlerts={() => handleNavigation(VIEWS.ALERTS)}
            onManageIntegrations={() => handleNavigation(VIEWS.GITHUB)}
            {...commonProps}
          />
        );
      case VIEWS.USER_PROFILE:
        return <UserProfile {...commonProps} />;
      case VIEWS.THREAT_INTEL:
        return <ThreatIntel {...commonProps} />;
      case VIEWS.REPORTS:
        return <Reports {...commonProps} />;
      case VIEWS.INTEGRATIONS:
        return <IntegrationsPage {...commonProps} />;
      case VIEWS.HELP:
        return <HelpPage {...commonProps} />;
      case VIEWS.PIPELINES:
        return (
          <Pipelines
            pipelines={pipelineData}
            runsByPipeline={runsData}
            activePipelineId={activePipelineId}
            activeRunId={activeRunId}
            onSelectPipeline={onSelectPipeline}
            onSelectRun={onSelectRun}
            onRunAction={onRunAction}
            {...commonProps}
          />
        );
      case VIEWS.ALERTS:
        return (
          <AlertsPage
            alerts={alertsState}
            onAction={onAlertAction}
            criticalCount={criticalAlertsCount}
            {...commonProps}
          />
        );
      case VIEWS.AUDIT:
        return (
          <AuditPage
            records={auditRecords}
            onExport={onExport}
            {...commonProps}
          />
        );
      case VIEWS.SETTINGS:
        return (
          <SettingsPage
            integrations={integrationsState}
            policies={policyControls}
            authSession={authState}
            securityHighlights={securityHighlights}
            theme={theme}
            onToggleTheme={toggleTheme}
            keyboardShortcutsEnabled={keyboardShortcutsEnabled}
            onToggleKeyboardShortcuts={() => setKeyboardShortcutsEnabled(prev => !prev)}
            onUpdateProfile={(updatedUser) => {
              setAuthState(prev => ({ ...prev, ...updatedUser, account: updatedUser.username }));
              addNotification('Profile updated', 'success');
            }}
            {...commonProps}
          />
        );
      case VIEWS.IMPACT:
        return (
          <ImpactPage
            impactMetrics={impactMetrics}
            {...commonProps}
          />
        );
      case VIEWS.SIMULATION:
        return (
          <SimulationPage
            scenarios={attackScenarios}
            history={simulationRiskHistory}
            onIncident={handleSimulationIncident}
            onReset={handleSimulationReset}
            currentRisk={simulationRisk}
            {...commonProps}
          />
        );
      case VIEWS.GITHUB:
        return (
          <GitHubConnect
            authSession={authState}
            onConnect={handleGitHubConnect}
            onDisconnect={handleGitHubDisconnect}
            {...commonProps}
          />
        );
      case VIEWS.BLOCKCHAIN:
        return (
          <BlockchainDashboard
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      {showLanding ? (
        <LandingPage onEnter={() => setShowLanding(false)} />
      ) : (
        <div className={`shell ${theme} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          {/* Loading Overlay */}
          {isLoading && <LoadingSpinner />}

          {/* Notification System */}
          <NotificationSystem
            notifications={notifications}
            onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
          />

          {/* Sidebar Navigation */}
          <Navbar
            currentView={view}
            onNavigate={handleNavigation}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            theme={theme}
            onToggleTheme={toggleTheme}
            criticalAlertsCount={criticalAlertsCount}
          />

          {/* Main Content */}
          <main className="shell-content" ref={mainContentRef} tabIndex="-1">
            <div className="content-container">
              <AuthBanner
                session={authState}
                onReconnect={onReconnect}
                onDisconnect={onDisconnect}
              />

              {/* Header */}
              <header className="content-header">
                <div className="header-title-container">
                  <button
                    type="button"
                    className="header-toggle-btn"
                    onClick={toggleSidebar}
                    title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    aria-label={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                  >
                    {sidebarCollapsed ? '☰' : '«'}
                  </button>
                  <div className="header-title">
                    <h1>{NAVIGATION_ITEMS.find(item => item.id === view)?.label}</h1>
                    <p className="muted">Production-ready CI/CD risk observability</p>
                  </div>
                </div>
                <div className="header-actions">
                  <button
                    type="button"
                    className={`btn-outline simulate-cta ${simulationRisk > 0 ? 'armed' : ''}`}
                    onClick={() => handleNavigation(VIEWS.SIMULATION)}
                    aria-label={`Simulate attack - Current risk: ${Math.max(0, Math.round(simulationRisk))}%`}
                  >
                    <span className="btn-icon">🧪</span>
                    <span className="btn-text">Simulate attack</span>
                    <span className="risk-chip" aria-label={`Risk level: ${Math.max(0, Math.round(simulationRisk))}%`}>
                      {Math.max(0, Math.round(simulationRisk))}% risk
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleNavigation(VIEWS.GITHUB)}
                    aria-label="Connect GitHub repository"
                  >
                    <span className="btn-icon">🔗</span>
                    <span className="btn-text">Connect GitHub</span>
                  </button>
                </div>
              </header>

              {/* Incident Banner */}
              {latestIncident && (
                <section
                  className={`card incident-banner ${latestIncident.severity?.toLowerCase()}`}
                  role="alert"
                  aria-live="polite"
                >
                  <div className="incident-content">
                    <div className="incident-header">
                      <strong>{latestIncident.severity} alert · {latestIncident.id}</strong>
                      <p className="muted">
                        Risk {latestIncident.riskScore}% on {latestIncident.pipelineId}. {latestIncident.message}
                      </p>
                    </div>
                    <div className="incident-banner-actions">
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => handleNavigation(VIEWS.ALERTS)}
                        aria-label="View all alerts"
                      >
                        Open alerts
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={handleSimulationReset}
                        aria-label="Reset simulation"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Page Content */}
              <div className="content-body">
                <ErrorBoundary>
                  {renderContent()}
                </ErrorBoundary>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Project Assistant Chatbot - Global Viewport Relative */}
      <ChatAssistant />
    </ErrorBoundary>
  );
};

export default App;

export const VIEWS = {
    DASHBOARD: 'dashboard',
    PIPELINES: 'pipelines',
    ALERTS: 'alerts',
    AUDIT: 'audit',
    SETTINGS: 'settings',
    IMPACT: 'impact',
    SIMULATION: 'simulation',
    GITHUB: 'github',
    BLOCKCHAIN: 'blockchain',
    USER_PROFILE: 'user_profile',
    THREAT_INTEL: 'threat_intel',
    REPORTS: 'reports',
    INTEGRATIONS: 'integrations',
    HELP: 'help',
};

export const NAVIGATION_ITEMS = [
    {
        id: VIEWS.DASHBOARD,
        label: 'Dashboard',
        icon: '📊',
        description: 'Overview and metrics',
        shortcut: 'Ctrl+D'
    },
    {
        id: VIEWS.USER_PROFILE,
        label: 'User Profile',
        icon: '👤',
        description: 'Manage your profile',
        shortcut: 'Ctrl+U'
    },
    {
        id: VIEWS.THREAT_INTEL,
        label: 'Threat Intel',
        icon: '🛡️',
        description: 'Threat intelligence feeds',
        shortcut: 'Ctrl+T'
    },
    {
        id: VIEWS.REPORTS,
        label: 'Reports',
        icon: '📑',
        description: 'Reports & exports',
        shortcut: 'Ctrl+R'
    },
    {
        id: VIEWS.INTEGRATIONS,
        label: 'Integrations',
        icon: '🔌',
        description: 'Third-party integrations',
        shortcut: 'Ctrl+N'
    },
    {
        id: VIEWS.HELP,
        label: 'Help',
        icon: '❓',
        description: 'Help & support',
        shortcut: 'Ctrl+H'
    },
    {
        id: VIEWS.PIPELINES,
        label: 'Pipelines',
        icon: '🔄',
        description: 'CI/CD pipeline status',
        shortcut: 'Ctrl+P'
    },
    {
        id: VIEWS.ALERTS,
        label: 'Alerts',
        icon: '🚨',
        description: 'Security alerts',
        shortcut: 'Ctrl+A'
    },
    {
        id: VIEWS.SIMULATION,
        label: 'Attack Simulation',
        icon: '🧪',
        description: 'Security simulations',
        shortcut: 'Ctrl+S'
    },
    {
        id: VIEWS.BLOCKCHAIN,
        label: 'Blockchain Audit',
        icon: '⛓️',
        description: 'Immutable audit trail',
        shortcut: 'Ctrl+B'
    },
    {
        id: VIEWS.AUDIT,
        label: 'Audit',
        icon: '📋',
        description: 'Audit logs',
        shortcut: 'Ctrl+L'
    },
    {
        id: VIEWS.SETTINGS,
        label: 'Settings',
        icon: '⚙️',
        description: 'Configuration',
        shortcut: 'Ctrl+,'
    },
    {
        id: VIEWS.GITHUB,
        label: 'GitHub Connect',
        icon: '🔗',
        description: 'GitHub integration',
        shortcut: 'Ctrl+G'
    },
    {
        id: VIEWS.IMPACT,
        label: 'Societal Impact',
        icon: '🌍',
        description: 'Impact metrics',
        shortcut: 'Ctrl+I'
    }
];

import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onEnter }) => {
    const features = [
        {
            title: "Zero-Trust Architecture",
            desc: "Continuous verification of identity and integrity across the entire CI/CD pipeline.",
            icon: "🔒"
        },
        {
            title: "AI Threat Detection",
            desc: "ML-powered anomaly detection that identifies fraud and leaks in real-time.",
            icon: "🤖"
        },
        {
            title: "Blockchain Auditing",
            desc: "Immutable Ethereum-backed ledger for every security event and pipeline transaction.",
            icon: "⛓️"
        },
        {
            title: "Attack Simulation Lab",
            desc: "Advanced environment to stress-test your defenses against supply-chain drills.",
            icon: "🧪"
        }
    ];

    return (
        <div className="landing-page">
            <div className="landing-content">
                <header className="landing-hero">
                    <div className="badge-premium">🛡️ Version 2.1 Standard</div>
                    <h1 className="hero-title">
                        Secure Your Pipeline with <span className="gradient-text">DevOps Shield</span>
                    </h1>
                    <p className="hero-subtitle">
                        The world's first AI-powered security layer for CI/CD, backed by blockchain immutability.
                        Zero trust, zero compromises.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary-large" onClick={onEnter}>
                            Enter Dashboard ➔
                        </button>
                        <button className="btn-outline-large" onClick={() => window.open('https://github.com/Abdul9010150809/DEVOPS-Shield', '_blank')}>
                            View Documentation
                        </button>
                    </div>
                </header>

                <section className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card glass-panel">
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p className="muted">{f.desc}</p>
                        </div>
                    ))}
                </section>

                <footer className="landing-footer">
                    <div className="system-status">
                        <span className="dot online"></span>
                        <span className="status-text">Core Engine: <strong>Active</strong></span>
                        <span className="divider">|</span>
                        <span className="status-text">AI Accuracy: <strong>99.4%</strong></span>
                        <span className="divider">|</span>
                        <span className="status-text">Blockchain: <strong>Synced</strong></span>
                    </div>
                    <p className="copyright">© 2026 MindSprint 2K25 Hackathon · Team DevOps Security Experts</p>
                </footer>
            </div>

            {/* Background Decorations */}
            <div className="bg-glow bg-glow-1"></div>
            <div className="bg-glow bg-glow-2"></div>
        </div>
    );
};

export default LandingPage;

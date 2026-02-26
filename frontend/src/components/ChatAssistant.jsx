import React, { useState, useEffect, useRef } from 'react';
import './ChatAssistant.css';

const KNOWLEDGE_BASE = {
    overview: "DevOps Shield is an AI-powered security platform for CI/CD pipelines. It combines zero-trust architecture, AI threat detection, and blockchain auditing to protect the supply chain from commit to release.",
    features: "Core features include: \n- 🤖 AI-Powered Threat Intelligence\n- 🔒 Zero-Trust Security Controls\n- ⛓️ Blockchain-Backed Audit Logs\n- 🧪 Attack Simulation Lab\n- 📊 Real-time Risk Scoring",
    stack: "I'm built with a modern stack:\n- **Frontend**: React 18 with high-performance Glassmorphism CSS\n- **Backend**: FastAPI (Python) for ultra-fast security processing\n- **Database**: SQLite/PostgreSQL with SQLAlchemy\n- **Blockchain**: Ethereum for immutable security logging",
    team: "DevOps Shield was developed for the MindSprint 2K25 Hackathon by:\n- Shaik. Muzkeer (Backend & Security)\n- Shaik. Abdul Sammed (Frontend & UI/UX)\n- Suhail. B. K (Blockchain)",
    simulations: "Our Simulation Lab lets you test your defenses with scenarios like:\n- 🧪 Supply-chain corruption\n- 🧪 Secret-leak drills\n- 🧪 Rogue runner attacks",
    blockchain: "We use Blockchain (Ethereum) to create an immutable ledger of every security event. This ensures that audit trails can't be tampered with, even by insiders.",
    ai: "Our AI engine uses Machine Learning to detect anomalies in pipeline behavior, assigning real-time risk scores to identify fraud before it impacts production.",
    scenarios: "Our Attack Lab supports 3 advanced scenarios:\n1. **Supply Chain**: Simulates dependency poisoning and hash-mismatch attacks.\n2. **Secret Leak**: Drills for credential exposure in logs and source code.\n3. **Rogue Runner**: Detects unauthorized nodes attempting to join the build cluster."
};

const ChatAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm the DevOps Shield Assistant. 🛡️ How can I help you understand the project today?", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = (text) => {
        const userMessage = text || inputText;
        if (!userMessage.trim()) return;

        // Add user message
        const newMessages = [...messages, { id: Date.now(), text: userMessage, sender: 'user' }];
        setMessages(newMessages);
        setInputText('');

        // Generate AI response
        setTimeout(() => {
            const response = generateResponse(userMessage);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'ai' }]);
        }, 600);
    };

    const generateResponse = (input) => {
        const query = input.toLowerCase();

        if (query.includes('overview') || query.includes('what is') || query.includes('project')) return KNOWLEDGE_BASE.overview;
        if (query.includes('feature') || query.includes('capabilities')) return KNOWLEDGE_BASE.features;
        if (query.includes('stack') || query.includes('built with') || query.includes('technology')) return KNOWLEDGE_BASE.stack;
        if (query.includes('team') || query.includes('who made') || query.includes('author')) return KNOWLEDGE_BASE.team;
        if (query.includes('simul') || query.includes('attack') || query.includes('drill')) return KNOWLEDGE_BASE.simulations;
        if (query.includes('blockchain') || query.includes('audit') || query.includes('contract')) return KNOWLEDGE_BASE.blockchain;
        if (query.includes('ai') || query.includes('machine learning') || query.includes('risk')) return KNOWLEDGE_BASE.ai;
        if (query.includes('scenerio') || query.includes('attack') || query.includes('drill') || query.includes('simul')) return KNOWLEDGE_BASE.scenarios;

        return "I'm not sure about that. You can ask me about the project overview, features, tech stack, the team, or our blockchain and AI capabilities! 🤖";
    };

    const quickActions = [
        { label: "Overview", query: "Tell me about the project overview" },
        { label: "Features", query: "What are the key features?" },
        { label: "Tech Stack", query: "What technology is used?" },
        { label: "Blockchain", query: "How is blockchain used?" },
        { label: "Attacks", query: "Tell me about the simulation attacks" }
    ];

    return (
        <div className={`chat-assistant-container ${isOpen ? 'active' : ''}`}>
            {/* FAB */}
            <button
                className="chat-fab"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Chat Assistant"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Panel */}
            <div className="chat-panel glass-panel">
                <div className="chat-header">
                    <div className="chat-title">
                        <span className="dot online"></span>
                        DevOps Shield AI
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                            <div className="message-bubble">
                                {msg.text.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i < msg.text.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {messages.length < 5 && (
                    <div className="chat-quick-actions">
                        {quickActions.map((action, i) => (
                            <button key={i} onClick={() => handleSend(action.query)}>
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    <input
                        type="text"
                        placeholder="Ask me anything..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <button type="submit" disabled={!inputText.trim()}>
                        ➔
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatAssistant;

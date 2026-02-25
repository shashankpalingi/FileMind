import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, Loader2 } from 'lucide-react';
import api from '../../api';
import './ChatAssistant.css';

const ChatAssistant = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!input.trim() || loading) return;

        const userMessage = {
            type: 'user',
            content: input.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await api.post('/ask', { query: userMessage.content });

            const aiMessage = {
                type: 'assistant',
                content: data.answer || 'No answer available',
                sources: data.sources || [],
                confidence: data.confidence,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                type: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                error: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-assistant">
            <div className="chat-header">
                <div className="header-content">
                    <div className="chat-title-row">
                        <div className="chat-avatar">
                            <Bot size={18} />
                        </div>
                        <div>
                            <h2 className="chat-title">Knowledge Assistant</h2>
                            <span className="chat-subtitle">Live RAG</span>
                        </div>
                    </div>
                </div>
                <div className="status-indicator active">
                    <span className="status-dot"></span>
                    Online
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-welcome">
                        <div className="welcome-icon-wrapper">
                            <Sparkles size={24} />
                        </div>
                        <h3>Ask me anything about your indexed files</h3>
                        <p>I'll search through your knowledge base and provide contextual answers</p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.type}`}>
                        <div className="message-content">
                            <p className="message-text">{message.content}</p>

                            {message.sources && message.sources.length > 0 && (
                                <div className="message-sources">
                                    <span className="sources-label">Sources</span>
                                    <ul className="sources-list">
                                        {message.sources.map((source, idx) => (
                                            <li key={idx} className="source-item">
                                                {source.split('/').pop()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {message.confidence !== undefined && (
                                <div className="confidence-score">
                                    Confidence: {(message.confidence * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>
                        <span className="message-time">{message.timestamp}</span>
                    </div>
                ))}

                {loading && (
                    <div className="message assistant loading">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask about indexed files..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="send-btn"
                    disabled={loading || !input.trim()}
                >
                    {loading ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
                </button>
            </form>
        </div>
    );
};

export default ChatAssistant;

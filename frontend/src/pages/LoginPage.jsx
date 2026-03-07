import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

/* ── Decorative SVGs (reused from landing page patterns) ── */

const DotField = ({ className = '' }) => (
    <svg viewBox="0 0 200 120" fill="none" className={className} aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none' }}>
        {[
            [20, 20], [55, 10], [90, 35], [130, 15], [170, 25],
            [10, 60], [40, 75], [80, 55], [115, 70], [150, 50], [185, 65],
            [25, 100], [65, 90], [105, 105], [145, 95], [180, 100],
        ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={1.5 + (i % 3)} fill="currentColor" opacity={0.08 + (i % 4) * 0.04} />
        ))}
        <path d="M20 20 Q38 8 55 10" stroke="currentColor" strokeWidth="0.8" opacity="0.1" fill="none" strokeLinecap="round" />
        <path d="M55 10 Q72 22 90 35" stroke="currentColor" strokeWidth="0.8" opacity="0.1" fill="none" strokeLinecap="round" />
        <path d="M115 70 Q132 62 150 50" stroke="currentColor" strokeWidth="0.8" opacity="0.1" fill="none" strokeLinecap="round" />
    </svg>
);

const LooseCircle = ({ className = '', style }) => (
    <svg viewBox="0 0 100 100" fill="none" className={className} style={{ position: 'absolute', pointerEvents: 'none', ...style }} aria-hidden="true">
        <path d="M50 5 C80 3 97 25 96 50 C95 78 75 97 48 96 C22 95 3 75 4 48 C5 22 24 3 50 5 Z"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.1" />
        <path d="M48 8 C76 6 94 28 93 52"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.06" strokeDasharray="4 6" />
    </svg>
);

const NodeGraph = ({ className = '' }) => (
    <svg viewBox="0 0 120 80" fill="none" className={className} style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
        <circle cx="20" cy="40" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="60" cy="15" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="60" cy="65" r="6" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="100" cy="40" r="4.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M25 40 Q42 28 56 17" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
        <path d="M25 42 Q42 54 56 63" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
        <path d="M64 17 Q82 28 96 38" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
        <path d="M64 63 Q82 52 96 42" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.35" fill="none" strokeLinecap="round" />
    </svg>
);

const GoogleIcon = () => (
    <svg className="auth-google-icon" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || 'Failed to sign in with Google');
        }
    };

    return (
        <div className="auth-page">
            <Link to="/" className="auth-logo-corner">
                <svg viewBox="0 0 24 24" fill="none" width="32" height="32" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h6l2 2h6v12H4V4z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="13" r="2.5" />
                    <path d="M9.5 16 L6 20M14.5 16 L18 20" strokeLinecap="round" opacity="0.4" />
                </svg>
                <span className="auth-logo-text" style={{ fontFamily: "'Cedarville Cursive', cursive" }}>FileMind</span>
            </Link>

            {/* Decorative background */}
            <DotField className="float-anim-slow" style={{ top: 20, right: 0, width: 280, height: 170, opacity: 0.7 }} />
            <LooseCircle className="float-anim" style={{ width: 200, height: 200, top: -40, left: -60, color: 'hsl(42 80% 55%)' }} />
            <NodeGraph className="float-anim" style={{ width: 150, height: 100, bottom: 40, right: 20, opacity: 0.4 }} />
            <LooseCircle className="float-anim-slow" style={{ width: 160, height: 160, bottom: -30, left: 30, opacity: 0.3 }} />

            {/* Floating annotation badges */}
            <span className="annotation-badge" style={{ top: '12%', left: '8%', display: 'none' }} aria-hidden="true">semantic login ✨</span>
            <span className="annotation-badge" style={{ bottom: '15%', right: '10%' }} aria-hidden="true">secure auth 🔑</span>

            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your FileMind account</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Google Sign In */}
                <button type="button" className="auth-google-button" onClick={handleGoogleSignIn}>
                    <GoogleIcon />
                    Continue with Google
                </button>

                <div className="auth-divider">
                    <div className="auth-divider-line" />
                    <span className="auth-divider-text">or sign in with email</span>
                    <div className="auth-divider-line" />
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-input-group">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="auth-input"
                        />
                    </div>

                    <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="auth-input"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-button"
                    >
                        {loading ? 'Signing in...' : 'Sign In →'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}

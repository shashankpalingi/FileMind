import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#0a0a0f',
                color: '#a78bfa',
                fontSize: '1.2rem',
                fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid rgba(167, 139, 250, 0.2)',
                        borderTopColor: '#a78bfa',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    Loading...
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

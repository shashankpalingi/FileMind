import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './ui/Loader';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loader message="Authenticating..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        return data;
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const signInWithGoogle = async () => {
        const isProd = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

        // In production, we MUST use the proxied callback URL to keep the same domain
        const callbackUrl = isProd
            ? `${window.location.origin}/supabase/auth/v1/callback`
            : `${window.location.origin}/dashboard`;

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: callbackUrl,
                skipBrowserRedirect: isProd,
            },
        });

        if (error) throw error;

        if (isProd && data?.url) {
            // Rewrite the Supabase URL to use our Netlify proxy
            const proxiedUrl = data.url.replace(
                'https://usxsjzobzjlfkpgymswm.supabase.co',
                window.location.origin + '/supabase'
            );
            window.location.href = proxiedUrl;
        }

        return data;
    };

    const value = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

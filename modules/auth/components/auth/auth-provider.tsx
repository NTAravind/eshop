'use client';

import React, { createContext, useContext } from 'react';
import { AuthContextValue, AuthScope } from '@/types/auth-types';

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    value: AuthContextValue | null;
    children: React.ReactNode;
}

export function AuthProvider({ value, children }: AuthProviderProps) {
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

// --- Permission Helpers ---

export function hasScope(context: AuthContextValue | null, scope: AuthScope): boolean {
    if (!context) return false;
    if (context.isSuperAdmin) return true; // Super Admin bypass
    return context.scopes.includes(scope);
}

export function hasAnyScope(context: AuthContextValue | null, scopes: AuthScope[]): boolean {
    if (!context) return false;
    if (context.isSuperAdmin) return true;
    return scopes.some(s => context.scopes.includes(s));
}

export function hasAllScopes(context: AuthContextValue | null, scopes: AuthScope[]): boolean {
    if (!context) return false;
    if (context.isSuperAdmin) return true;
    return scopes.every(s => context.scopes.includes(s));
}

// Hook wrapper
export function useHasScope(scope: AuthScope): boolean {
    const context = useAuthContext();
    return hasScope(context, scope);
}

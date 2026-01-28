'use client';

import React from 'react';
import { AuthScope } from '@/types/auth-types';
import { useAuthContext, hasAnyScope, hasAllScopes } from './auth-provider';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredScopes?: AuthScope[]; // Requires ANY of these (OR logic) by default, or specific logic?
    // Let's be explicit: 'scopes' usually implies ALL or ANY. 
    // Standard convention: require ALL if named 'requiredScopes', or ANY if named 'allowedScopes'.
    // Let's use 'scopes' and 'mode'.
    scopes?: AuthScope[];
    mode?: 'AND' | 'OR';
    fallback?: React.ReactNode;
}

export function AuthGuard({ children, scopes = [], mode = 'OR', fallback = null }: AuthGuardProps) {
    const context = useAuthContext();

    if (!context) {
        // Not authenticated
        return <>{fallback}</>;
    }

    if (scopes.length === 0) {
        return <>{children}</>;
    }

    const hasAccess = mode === 'OR'
        ? hasAnyScope(context, scopes)
        : hasAllScopes(context, scopes);

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

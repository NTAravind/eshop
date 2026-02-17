'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import type { BaseComponentProps } from '../';

interface OAuthButtonsProps extends BaseComponentProps {
    callbackUrl?: string;
    providers?: ('google' | 'instagram')[];
}

export function OAuthButtons({
    callbackUrl = '/',
    providers = ['google', 'instagram'],
    style,
    className,
}: OAuthButtonsProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSignIn = async (provider: string) => {
        setIsLoading(provider);
        try {
            await signIn(provider, { callbackUrl });
        } catch (error) {
            console.error('Sign in error:', error);
            setIsLoading(null);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                width: '100%',
                ...style,
            }}
            className={className}
        >
            {providers.includes('google') && (
                <button
                    onClick={() => handleSignIn('google')}
                    disabled={isLoading !== null}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'white',
                        color: 'var(--foreground)',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    {isLoading === 'google' ? (
                        <span>Signing in...</span>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>
            )}

            {providers.includes('instagram') && (
                <button
                    onClick={() => handleSignIn('instagram')}
                    disabled={isLoading !== null}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1,
                        transition: 'all 0.2s',
                    }}
                >
                    {isLoading === 'instagram' ? (
                        <span>Signing in...</span>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                            <span>Continue with Instagram</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

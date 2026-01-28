import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const response = NextResponse.redirect(new URL('/login', request.url));

    // Explicitly prohibit caching
    response.headers.set('Cache-Control', 'no-store, max-age=0');

    // 1. Iterate over ALL cookies in the request and delete them if they match patterns
    request.cookies.getAll().forEach((cookie) => {
        if (
            cookie.name.includes('next-auth') ||
            cookie.name.includes('csrf') ||
            cookie.name.includes('session')
        ) {
            response.cookies.delete({
                name: cookie.name,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            });
            // Try deleting without secure flag too just in case
            response.cookies.delete({
                name: cookie.name,
                path: '/',
                secure: false,
            });
        }
    });

    // 2. Explicitly force delete known standard names (fallback)
    const knownCookies = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.callback-url',
        'next-auth.state',
        '__Secure-next-auth.state',
        'next-auth.pkce.code_verifier',
    ];

    knownCookies.forEach(name => {
        response.cookies.delete(name);
    });

    return response;
}

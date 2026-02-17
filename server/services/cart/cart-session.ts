import { cookies } from 'next/headers';
import { auth } from '@/server/auth';

const SESSION_COOKIE_NAME = 'cart_session';

export async function getCartIdentity() {
    const session = await auth();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    let sessionId = sessionCookie?.value;

    if (!sessionId && !session?.user?.id) {
        sessionId = crypto.randomUUID();
        cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
            sameSite: 'lax',
        });
    }

    return {
        userId: session?.user?.id,
        sessionId,
    };
}

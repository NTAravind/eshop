'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSession, signIn } from 'next-auth/react';

export default function InvitePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    // Params might be undefined initially or need unwrapping depending on Next.js version
    // In strict mode, params is typically available immediately in client components via hook
    const token = params?.token as string;
    const type = params?.type as 'store' | 'account';

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [inviteDetails, setInviteDetails] = useState<{ valid: boolean; email?: string; role?: string; name?: string; error?: string } | null>(null);

    useEffect(() => {
        if (!token || !type) return;

        // Validate token on load
        fetch(`/api/invitations/accept?token=${token}&type=${type}`, { method: 'GET' }) // Wait, GET route is /api/invitations/validate
            // Oh, I named the GET route in /api/invitations/accept/route.ts as GET. 
            // So the path is /api/invitations/accept?token=...
            .then(res => res.json())
            .then(data => {
                if (data.valid) {
                    setInviteDetails(data);
                } else {
                    setInviteDetails({ valid: false, error: data.error || 'Invalid or expired invitation' });
                }
            })
            .catch(() => {
                setInviteDetails({ valid: false, error: 'Failed to validate invitation' });
            })
            .finally(() => setLoading(false));
    }, [token, type]);

    const handleAccept = async () => {
        if (!session?.user?.id) return;

        setAccepting(true);
        try {
            const res = await fetch('/api/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    type,
                    userId: session.user.id
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to accept');
            }

            toast.success('Invitation accepted!');

            // Redirect based on type
            if (type === 'store') {
                router.push(`/admin/stores/${data.storeId}/overview`);
            } else {
                // If account invite (Tenant Admin), where do they go?
                // Maybe a dashboard selection page or the first store?
                // Use a generic "onboarding" or accounts page.
                router.push('/superadmin/accounts'); // Or wherever tenant admins manage accounts
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setAccepting(false);
        }
    };

    if (loading || sessionStatus === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!inviteDetails?.valid) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            Invalid Invitation
                        </CardTitle>
                        <CardDescription>
                            {inviteDetails?.error || 'This invitation is invalid or has expired.'}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                            Go Home
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Check if logged in user matches invite email (optional security check, but good UX)
    const emailMismatch = session?.user?.email && inviteDetails.email && session.user.email.toLowerCase() !== inviteDetails.email.toLowerCase();

    return (
        <div className="flex h-screen items-center justify-center p-4 bg-muted/20">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>You've been invited!</CardTitle>
                    <CardDescription>
                        Join <strong>{inviteDetails.name}</strong> as a <strong>{inviteDetails.role}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {session ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                {/* Avatar if available */}
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-sm font-medium">{session.user?.name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate text-sm font-medium">{session.user?.name}</p>
                                    <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
                                </div>
                            </div>

                            {emailMismatch && (
                                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                    <p className="font-medium">Email Mismatch</p>
                                    <p>The invitation was sent to <strong>{inviteDetails.email}</strong>, but you are signed in as <strong>{session.user?.email}</strong>. You can still accept, but ensure this is intended.</p>
                                </div>
                            )}

                            <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                                {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Accept Invitation
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-center text-sm text-muted-foreground">
                                Please sign in to accept this invitation.
                            </p>
                            <Button className="w-full" onClick={() => signIn('google', { callbackUrl: window.location.href })}>
                                Sign in with Google
                            </Button>
                            {/* Add other providers if needed */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

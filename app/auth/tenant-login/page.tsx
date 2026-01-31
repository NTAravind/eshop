import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function TenantLoginPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
    // Force redirect to Tenant Dashboard
    const forcedCallbackUrl = '/admin';

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-30 dark:opacity-10" 
                style={{
                    backgroundImage: 'radial-gradient(#0f172a 0.5px, transparent 0.5px), radial-gradient(#0f172a 0.5px, #f8fafc 0.5px)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px'
                }}
            />

            <Card className="w-full max-w-md z-10 border-t-4 border-t-slate-800 shadow-xl">
                <CardHeader className="space-y-1 text-center pb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <Building2 className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Tenant Admin Portal</CardTitle>
                    <CardDescription className="text-base">
                        Manage your billing, stores, and organization settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <SignInForm callbackUrl={forcedCallbackUrl} searchParams={searchParams} />
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Secured by E-Com Platform
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function SignInForm({
    searchParams,
    callbackUrl
}: {
    searchParams: Promise<{ error?: string }>;
    callbackUrl: string;
}) {
    const params = await searchParams;
    const error = params.error;

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                    <span className="font-semibold">Error:</span>
                    {error === 'OAuthSignin' && 'Sign-in failed. Please try again.'}
                    {error === 'OAuthCallback' && 'Connection failed. Please try again.'}
                    {error === 'OAuthAccountNotLinked' && 'Email already used with another provider.'}
                    {!error.match(/^(OAuth)/) && 'An authentication error occurred.'}
                </div>
            )}

            <form
                action={async () => {
                    'use server';
                    await signIn('google', { redirectTo: callbackUrl });
                }}
                className="space-y-3"
            >
                <Button type="submit" className="w-full h-12 text-base bg-slate-800 hover:bg-slate-900 text-white transition-colors" size="lg">
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </Button>
            </form>
        </div>
    );
}

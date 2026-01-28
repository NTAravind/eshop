import { SuperAdminSidebar } from '@/components/superadmin/sidebar';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/auth/signin?callbackUrl=/superadmin');
    }

    // Check if user is superadmin
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isSuperAdmin: true }
    });

    if (!user?.isSuperAdmin) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/10">
                <div className="text-center space-y-4 p-8 max-w-md">
                    <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You do not have permission to access the superadmin dashboard.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        If you believe this is an error, please contact your system administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/10 lg:flex-row">
            <SuperAdminSidebar />
            <div className="flex-1 overflow-y-auto">
                <div className="flex-1 space-y-4 p-8 pt-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

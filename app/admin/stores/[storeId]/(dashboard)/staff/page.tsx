import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant/resolveTenant';
import { getRbacContext } from '@/lib/rbac';
import * as staffService from '@/services/storestaff.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteStaffDialog } from '@/components/admin/invite-staff-dialog';
import { Separator } from '@/components/ui/separator';
import { AuthGuard } from '@/components/auth/auth-guard';
import { RemoveStaffButton } from '@/components/admin/remove-staff-button';

export const dynamic = 'force-dynamic';

export default async function StaffPage(
    props: { params: Promise<{ storeId: string }> }
) {
    const params = await props.params;
    const storeId = params.storeId;

    // Auth context - pass storeId to avoid X-Store-Id header requirement
    const tenant = await resolveTenant(storeId);

    // RBAC Check: Only OWNER and MANAGER can view staff
    const authContext = await getRbacContext({ storeId });
    if (!authContext?.isSuperAdmin && !authContext?.scopes.some(s => ['store_owner', 'store_manager'].includes(s as any))) {
        redirect(`/admin/stores/${storeId}/overview`);
    }

    // Fetch data
    const [staffList, invitations] = await Promise.all([
        staffService.listStaff(tenant.userId!, storeId),
        staffService.listInvitations(tenant.userId!, storeId)
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Staff & Permissions</h2>
                    <p className="text-muted-foreground">
                        Manage who has access to this store's dashboard.
                    </p>
                </div>
                <AuthGuard scopes={['store_owner']}>
                    <InviteStaffDialog storeId={storeId} />
                </AuthGuard>
            </div>

            <Separator />

            {/* ALLOWLIST / INVITATIONS */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Pending Access (Allowlist)</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {invitations.map((invite: any) => (
                        <Card key={invite.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary">Pending</Badge>
                                    <Badge variant="outline">{invite.role}</Badge>
                                </div>
                                <CardTitle className="text-base break-all mt-2">{invite.email}</CardTitle>
                                <CardDescription>Added on {new Date(invite.createdAt).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                    {invitations.length === 0 && (
                        <div className="col-span-full py-6 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                            No pending invitations. Add an email to allow access.
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* ACTIVE STAFF */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Active Staff Members</h3>
                <div className="grid gap-4">
                    {staffList.map((member: any) => (
                        <Card key={member.id}>
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={member.user.image || ''} />
                                        <AvatarFallback>{member.user.name?.[0] || member.user.email?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium leading-none">{member.user.name || 'Unknown'}</p>
                                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge>{member.role}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                        Joined {new Date(member.createdAt).toLocaleDateString()}
                                    </span>
                                    {/* Remove Button - Only for Owners */}
                                    <AuthGuard scopes={['store_owner']}>
                                        <RemoveStaffButton
                                            storeId={storeId}
                                            userId={member.user.id}
                                            userName={member.user.name || member.user.email}
                                            // Prevent removing yourself (though backend blocks it too)
                                            disabled={member.user.id === tenant.userId}
                                        />
                                    </AuthGuard>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

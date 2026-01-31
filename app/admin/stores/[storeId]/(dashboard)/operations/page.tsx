import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { redirect } from "next/navigation";
import { NotificationHistoryTable } from "./notification-history";
import { getNotificationStats, listNotifications } from "@/services/notification/notification.service";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

export default async function OperationsPage({
    params,
}: {
    params: { storeId: string };
}) {
    const { storeId } = await params;

    // Auth & Access Control
    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) {
        redirect("/login");
    }

    // Parallel Data Fetching
    const [
        notificationStats,
        notificationLogs
    ] = await Promise.all([
        getNotificationStats(storeId),
        listNotifications(storeId, 20) // Fetch last 20 logs
    ]);

    // Calculate Notification Summary
    const notificationSummary = {
        sent: 0,
        queued: 0,
        failed: 0,
        delivered: 0
    };

    notificationStats.forEach(stat => {
        const k = stat.status.toLowerCase() as keyof typeof notificationSummary;
        if (notificationSummary[k] !== undefined) {
            notificationSummary[k] += stat._count.id;
        }
    });

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Notification History</h2>
                </div>
                <Separator />

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">{notificationSummary.sent}</span>
                            <span className="text-xs text-muted-foreground">Sent</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold">{notificationSummary.delivered}</span>
                            <span className="text-xs text-muted-foreground">Delivered</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-yellow-600">{notificationSummary.queued}</span>
                            <span className="text-xs text-muted-foreground">Queued</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-red-600">{notificationSummary.failed}</span>
                            <span className="text-xs text-muted-foreground">Failed</span>
                        </CardContent>
                    </Card>
                </div>

                <div className="pt-4">
                    <NotificationHistoryTable logs={notificationLogs} />
                </div>
            </div>
        </div>
    );
}

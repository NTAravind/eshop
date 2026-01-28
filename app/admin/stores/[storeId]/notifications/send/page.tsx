import { NotificationSenderClient } from "./client";
import { Separator } from "@/components/ui/separator";

export default async function NotificationSenderPage({ params }: { params: { storeId: string } }) {
    const { storeId } = await params;

    return (
        <div className="space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Send Notification</h2>
                <p className="text-muted-foreground">Manually send notifications to customers</p>
            </div>
            <Separator />
            <div className="max-w-2xl">
                <NotificationSenderClient storeId={storeId} />
            </div>
        </div>
    );
}

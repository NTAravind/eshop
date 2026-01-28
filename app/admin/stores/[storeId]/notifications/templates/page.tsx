import { TemplatesClient } from "./client";
import { Separator } from "@/components/ui/separator";

export default async function TemplatesPage({
    params
}: {
    params: { storeId: string }
}) {
    const { storeId } = await params;

    return (
        <div className="space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Notification Templates</h2>
                <p className="text-muted-foreground">Configure automated message templates</p>
            </div>
            <Separator />
            <TemplatesClient storeId={storeId} />
        </div>
    );
}

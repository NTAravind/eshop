import { Separator } from "@/components/ui/separator";
import { ConfigForm } from "./config-form";
import { getNotificationConfigs } from "../actions";

export default async function ConfigurationPage({
    params
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const configs = await getNotificationConfigs(storeId);

    return (
        <div className="space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Channel Configuration</h2>
                <p className="text-muted-foreground">Configure your notification providers</p>
            </div>
            <Separator />
            <ConfigForm storeId={storeId} initialConfigs={configs} />
        </div>
    );
}

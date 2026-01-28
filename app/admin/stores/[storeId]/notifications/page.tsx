import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, Settings, LayoutTemplate } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getWorkflowSettings } from "./actions";
import { WorkflowSettings } from "./workflow-client";

export default async function NotificationsPage({
    params
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const initialMatrix = await getWorkflowSettings(storeId);

    return (
        <div className="space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-muted-foreground">Manage your store notification workflow</p>
                </div>
            </div>
            <Separator />

            <div className="grid gap-6 md:grid-cols-3">
                {/* Workflow Matrix (Takes up 2 columns) */}
                <div className="md:col-span-2">
                    <WorkflowSettings storeId={storeId} initialMatrix={initialMatrix} />
                </div>

                {/* Sidebar / Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LayoutTemplate className="h-5 w-5" />
                                Templates
                            </CardTitle>
                            <CardDescription>
                                Edit the content of your notifications (Subject, Body, etc.)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/admin/stores/${storeId}/notifications/templates`}>
                                <Button className="w-full" variant="outline">
                                    Manage Templates
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure channel providers (SMTP, WhatsApp Keys)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={`/admin/stores/${storeId}/notifications/configuration`}>
                                <Button className="w-full" variant="outline">
                                    Channel Settings
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

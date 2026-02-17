'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationChannel } from '@/app/generated/prisma';
import { saveNotificationConfig } from '../actions';
import { toast } from 'sonner';

interface ConfigFormProps {
    storeId: string;
    initialConfigs: any[];
}

export function ConfigForm({ storeId, initialConfigs }: ConfigFormProps) {
    const [saving, setSaving] = useState(false);

    const getConfig = (channel: NotificationChannel) => {
        const record = initialConfigs.find(c => c.channel === channel);
        return {
            config: record?.config || {},
            isActive: record?.isActive ?? false, // Default to inactive if not found
        };
    };

    // EMAIL STATE
    const emailData = getConfig(NotificationChannel.EMAIL);
    const [emailConfig, setEmailConfig] = useState(emailData.config);
    const [emailActive, setEmailActive] = useState(emailData.isActive);

    // WHATSAPP STATE
    const waData = getConfig(NotificationChannel.WHATSAPP);
    const [waConfig, setWaConfig] = useState(waData.config);
    const [waActive, setWaActive] = useState(waData.isActive);

    // WEB PUSH STATE
    const webPushData = getConfig(NotificationChannel.WEB_PUSH);
    const [webPushConfig, setWebPushConfig] = useState(webPushData.config);
    const [webPushActive, setWebPushActive] = useState(webPushData.isActive);

    // MOBILE PUSH STATE
    const mobilePushData = getConfig(NotificationChannel.MOBILE_PUSH);
    const [mobilePushConfig, setMobilePushConfig] = useState(mobilePushData.config);
    const [mobilePushActive, setMobilePushActive] = useState(mobilePushData.isActive);

    const handleSave = async (channel: NotificationChannel, config: any, isActive: boolean) => {
        setSaving(true);
        try {
            const res = await saveNotificationConfig(storeId, channel, config, isActive);
            if (res.success) {
                toast.success(`${channel} settings saved`);
            } else {
                toast.error(`Failed: ${res.error}`);
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Tabs defaultValue="email" className="space-y-4">
            <TabsList>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                <TabsTrigger value="webpush">Web Push</TabsTrigger>
                <TabsTrigger value="mobilepush">Mobile Push</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Email Configuration</CardTitle>
                        <CardDescription>Configure SMTP settings for sending emails.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="email-active" checked={emailActive} onCheckedChange={setEmailActive} />
                            <Label htmlFor="email-active">Enable Email Notifications</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Host</Label>
                                <Input
                                    placeholder="smtp.gmail.com"
                                    value={emailConfig.host || ''}
                                    onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Port</Label>
                                <Input
                                    placeholder="587"
                                    value={emailConfig.port || ''}
                                    onChange={(e) => setEmailConfig({ ...emailConfig, port: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>User</Label>
                                <Input
                                    placeholder="user@example.com"
                                    value={emailConfig.user || ''}
                                    onChange={(e) => setEmailConfig({ ...emailConfig, user: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password / App Key</Label>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={emailConfig.pass || ''}
                                    onChange={(e) => setEmailConfig({ ...emailConfig, pass: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>From Email</Label>
                                <Input
                                    placeholder="noreply@example.com"
                                    value={emailConfig.from || ''}
                                    onChange={(e) => setEmailConfig({ ...emailConfig, from: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button disabled={saving} onClick={() => handleSave(NotificationChannel.EMAIL, emailConfig, emailActive)}>
                            Save Email Settings
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>WhatsApp Configuration</CardTitle>
                        <CardDescription>Configure Meta WhatsApp Cloud API credentials.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="wa-active" checked={waActive} onCheckedChange={setWaActive} />
                            <Label htmlFor="wa-active">Enable WhatsApp Notifications</Label>
                        </div>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Phone Number ID</Label>
                                <Input
                                    placeholder="100000000000000"
                                    value={waConfig.phoneNumberId || ''}
                                    onChange={(e) => setWaConfig({ ...waConfig, phoneNumberId: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>System User ID (WABA ID)</Label>
                                <Input
                                    placeholder="Optional"
                                    value={waConfig.wabaId || ''}
                                    onChange={(e) => setWaConfig({ ...waConfig, wabaId: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Access Token (Permanent)</Label>
                                <Input
                                    type="password"
                                    placeholder="EA..."
                                    value={waConfig.accessToken || ''}
                                    onChange={(e) => setWaConfig({ ...waConfig, accessToken: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button disabled={saving} onClick={() => handleSave(NotificationChannel.WHATSAPP, waConfig, waActive)}>
                            Save WhatsApp Settings
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="webpush" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Web Push Configuration</CardTitle>
                        <CardDescription>Configure VAPID keys for Web Push Notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="web-active" checked={webPushActive} onCheckedChange={setWebPushActive} />
                            <Label htmlFor="web-active">Enable Web Push</Label>
                        </div>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>VAPID Subject (mailto:)</Label>
                                <Input
                                    placeholder="mailto:admin@example.com"
                                    value={webPushConfig.subject || ''}
                                    onChange={(e) => setWebPushConfig({ ...webPushConfig, subject: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>VAPID Public Key</Label>
                                <Input
                                    placeholder="BEl..."
                                    value={webPushConfig.publicKey || ''}
                                    onChange={(e) => setWebPushConfig({ ...webPushConfig, publicKey: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>VAPID Private Key</Label>
                                <Input
                                    type="password"
                                    placeholder="Private Key"
                                    value={webPushConfig.privateKey || ''}
                                    onChange={(e) => setWebPushConfig({ ...webPushConfig, privateKey: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button disabled={saving} onClick={() => handleSave(NotificationChannel.WEB_PUSH, webPushConfig, webPushActive)}>
                            Save Web Push Settings
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="mobilepush" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Mobile Push Configuration</CardTitle>
                        <CardDescription>Configure FCM or APNs credentials.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="mobile-active" checked={mobilePushActive} onCheckedChange={setMobilePushActive} />
                            <Label htmlFor="mobile-active">Enable Mobile Push</Label>
                        </div>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>FCM Server Key / API Key</Label>
                                <Input
                                    type="password"
                                    placeholder="Server Key"
                                    value={mobilePushConfig.apiKey || ''}
                                    onChange={(e) => setMobilePushConfig({ ...mobilePushConfig, apiKey: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>FCM Service Account JSON (Optional)</Label>
                                <textarea
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="{ ... }"
                                    value={mobilePushConfig.serviceAccountJson || ''}
                                    onChange={(e) => setMobilePushConfig({ ...mobilePushConfig, serviceAccountJson: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button disabled={saving} onClick={() => handleSave(NotificationChannel.MOBILE_PUSH, mobilePushConfig, mobilePushActive)}>
                            Save Mobile Push Settings
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

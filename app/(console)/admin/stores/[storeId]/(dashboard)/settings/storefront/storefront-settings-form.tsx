'use client';

import { useState } from 'react';
import { updateStorefrontSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface StorefrontSettingsFormProps {
    storeId: string;
    initialData: {
        deliveryModes: ('DELIVERY' | 'PICKUP')[];
    };
}

export function StorefrontSettingsForm({ storeId, initialData }: StorefrontSettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [deliveryEnabled, setDeliveryEnabled] = useState(
        initialData.deliveryModes.includes('DELIVERY')
    );
    const [pickupEnabled, setPickupEnabled] = useState(
        initialData.deliveryModes.includes('PICKUP')
    );

    const handleSave = async () => {
        if (!deliveryEnabled && !pickupEnabled) {
            toast.error("Validation Error", {
                description: "At least one delivery mode must be enabled.",
            });
            return;
        }

        setLoading(true);

        const modes: ('DELIVERY' | 'PICKUP')[] = [];
        if (deliveryEnabled) modes.push('DELIVERY');
        if (pickupEnabled) modes.push('PICKUP');

        try {
            const result = await updateStorefrontSettings(storeId, {
                deliveryModes: modes,
            });

            if (result.success) {
                toast.success("Settings Saved", {
                    description: "Storefront settings have been updated.",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error("Error", {
                description: "Failed to save settings. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Methods</CardTitle>
                    <CardDescription>
                        Configure which delivery methods are available to your customers at checkout.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="delivery-mode" className="text-base font-medium">
                                Delivery / Shipping
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                Allow customers to have items shipped to their address.
                            </span>
                        </div>
                        <Switch
                            id="delivery-mode"
                            checked={deliveryEnabled}
                            onCheckedChange={setDeliveryEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="pickup-mode" className="text-base font-medium">
                                Store Pickup
                            </Label>
                            <span className="text-sm text-muted-foreground">
                                Allow customers to pick up their orders from your store location.
                            </span>
                        </div>
                        <Switch
                            id="pickup-mode"
                            checked={pickupEnabled}
                            onCheckedChange={setPickupEnabled}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}

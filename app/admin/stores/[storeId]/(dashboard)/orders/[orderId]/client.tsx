'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
// import { completeOrderAction } from '../actions/complete-order.action';
import { toast } from 'sonner';
import { CheckCircle, Package, User, MapPin } from 'lucide-react';

export function OrderDetailsClient({ order, storeId }: any) {
    const router = useRouter();
    const [isCompleting, setIsCompleting] = useState(false);

    const handleComplete = async () => {
        setIsCompleting(true);
        try {
            const response = await fetch(`/api/admin/stores/${storeId}/orders/${order.id}/complete`, {
                method: 'POST',
            });
            const result = await response.json();

            if (response.ok && result.success) {
                toast.success('Order marked as complete and customer notified');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to complete order');
            }
        } catch (error) {
            toast.error('An error occurred while marking order as complete');
        }

        setIsCompleting(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Order #{order.id}</h2>
                    <p className="text-muted-foreground">
                        Placed on {format(new Date(order.createdAt), 'PPP')}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {order.status}
                    </Badge>
                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                        <Button
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className="gap-2"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Mark as Complete
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{order.user?.name || 'Guest'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{order.user?.email || 'N/A'}</p>
                        </div>
                        {order.user?.phone && (
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{order.user.phone}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Billing Address */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Billing Address
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {order.billingAddress ? (
                            <div className="space-y-1">
                                <p>{order.billingAddress.address1}</p>
                                {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                                <p>
                                    {order.billingAddress.city}, {order.billingAddress.state}{' '}
                                    {order.billingAddress.postalCode}
                                </p>
                                <p>{order.billingAddress.country}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No billing address provided</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Order Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order Items
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {order.lines.map((line: any) => (
                            <div key={line.variantId} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {line.variant.images?.[0] && (
                                        <img
                                            src={line.variant.images[0].url}
                                            alt={line.variant.product.name}
                                            className="h-16 w-16 rounded object-cover"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{line.variant.product.name}</p>
                                        <p className="text-sm text-muted-foreground">SKU: {line.variant.sku}</p>
                                        <p className="text-sm text-muted-foreground">Quantity: {line.quantity}</p>
                                    </div>
                                </div>
                                <p className="font-medium">{formatCurrency(line.price * line.quantity)}</p>
                            </div>
                        ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Subtotal</p>
                            <p>{formatCurrency(order.subtotal)}</p>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <p>Discount</p>
                                <p>-{formatCurrency(order.discountAmount)}</p>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                            <p>Total</p>
                            <p>{formatCurrency(order.total)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

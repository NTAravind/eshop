'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NotificationChannel } from '@/app/generated/prisma'; // Ensure this matches user's generated path
import { toggleEventChannel } from './actions';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface WorkflowSettingsProps {
    storeId: string;
    initialMatrix: Record<string, Record<NotificationChannel, boolean>>;
}

const EVENTS = [
    { id: 'ORDER_CREATED', label: 'Order Confirmation' },
    { id: 'ORDER_COMPLETE', label: 'Order Completed' },
];

const CHANNELS = [
    { id: 'EMAIL', label: 'Email' },
    { id: 'WHATSAPP', label: 'WhatsApp' },
    { id: 'WEB_PUSH', label: 'Web Push' },
    // Add others if needed
];

export function WorkflowSettings({ storeId, initialMatrix }: WorkflowSettingsProps) {
    const { data: session } = useSession();
    // Optimistic state could be implemented, but simple state is faster for now
    const [matrix, setMatrix] = useState(initialMatrix);

    const handleToggle = async (eventType: string, channel: string, checked: boolean) => {
        // Optimistic update
        setMatrix(prev => ({
            ...prev,
            [eventType]: {
                ...prev[eventType],
                [channel]: checked
            }
        }));

        try {
            if (!session?.user?.id) return;

            const result = await toggleEventChannel(
                storeId,
                session.user.id,
                eventType,
                channel as NotificationChannel,
                checked
            );

            if (!result.success) {
                // Revert
                setMatrix(prev => ({
                    ...prev,
                    [eventType]: {
                        ...prev[eventType],
                        [channel]: !checked
                    }
                }));
                toast.error(`Failed to update: ${result.error}`);
            } else {
                toast.success('Updated notification preferences');
            }
        } catch (error) {
            setMatrix(prev => ({
                ...prev,
                [eventType]: {
                    ...prev[eventType],
                    [channel]: !checked
                }
            }));
            toast.error('Something went wrong');
        }
    };

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Event Routing</CardTitle>
                <CardDescription>
                    Choose which channels to use for each event.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            {CHANNELS.map(c => (
                                <TableHead key={c.id}>{c.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {EVENTS.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell className="font-medium">{event.label}</TableCell>
                                {CHANNELS.map((channel) => {
                                    const isChecked = matrix[event.id]?.[channel.id as NotificationChannel] || false;
                                    return (
                                        <TableCell key={`${event.id}-${channel.id}`}>
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={(checked) => handleToggle(event.id, channel.id, checked as boolean)}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

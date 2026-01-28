"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface NotificationLog {
    id: string;
    channel: string;
    recipient: string;
    status: string;
    createdAt: Date;
    error: string | null;
}

interface NotificationHistoryProps {
    logs: NotificationLog[];
}

const COST_MAP: Record<string, number> = {
    WHATSAPP: 0.05,
    EMAIL: 0.001,
    WEB_PUSH: 0.00,
    MOBILE_PUSH: 0.00,
};

export function NotificationHistoryTable({ logs }: NotificationHistoryProps) {
    const totalEstimatedCost = logs.reduce((acc, log) => {
        // Only count sent/delivered for cost? Or all attempts? 
        // Usually providers charge for attempts or delivered. Let's assume all non-failed for now, or just all attempts.
        // Let's stick to simple estimate per row.
        return acc + (COST_MAP[log.channel] || 0);
    }, 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Notification History</CardTitle>
                        <CardDescription>Recent 20 notifications sent from this store.</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">Est. Cost (Page)</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalEstimatedCost)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Est. Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No notifications found.
                                </TableCell>
                            </TableRow>
                        )}
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{log.channel}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {log.recipient}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        log.status === 'DELIVERED' ? 'default' :
                                            log.status === 'SENT' ? 'secondary' :
                                                log.status === 'FAILED' ? 'destructive' : 'outline'
                                    }>
                                        {log.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(COST_MAP[log.channel] || 0)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

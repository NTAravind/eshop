"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { PaymentConfigList } from "./payment-config-list";

interface PaymentsClientProps {
    data: any[]; // Payment transactions
    configs: any[]; // Payment configurations
    stats: {
        totalRevenue: number;
        avgOrderValue: number; // Placeholder for now
        successRate: number; // Placeholder
    };
}

export function PaymentsClient({ data, configs, stats }: PaymentsClientProps) {

    // Process data for chart - Group by Date (last 7-10 days)
    const chartData = data.reduce((acc: any[], payment: any) => {
        const date = new Date(payment.createdAt).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
            existing.total += payment.amount;
        } else {
            acc.push({ date, total: payment.amount });
        }
        return acc;
    }, []).reverse(); // Assuming input is sorted desc

    return (
        <div className="space-y-4">
            {/* Charts & Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '8px' }}
                                />
                                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <div className="col-span-3 space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">Based on displayed transactions</p>
                        </CardContent>
                    </Card>
                    {/* Placeholder Stats */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.length}</div>
                            <p className="text-xs text-muted-foreground">Total payments processed</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Tabs for Table & Configs */}
            <Tabs defaultValue="transactions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.length === 0 && (
                                    <div className="text-sm text-muted-foreground">No bookings found.</div>
                                )}
                                {data.map((payment: any) => (
                                    <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm text-foreground">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(payment.createdAt).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                ID: {payment.id}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge variant={
                                                payment.status === 'COMPLETED' ? 'default' :
                                                    payment.status === 'PENDING' ? 'secondary' : 'destructive'
                                            }>
                                                {payment.status}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">{payment.provider}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="configuration" className="space-y-4">
                    <PaymentConfigList configs={configs} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

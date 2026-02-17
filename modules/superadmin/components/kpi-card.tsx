'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    isLoading?: boolean;
}

export function KPICard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    isLoading,
}: KPICardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    {Icon && <Skeleton className="h-4 w-4 rounded" />}
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card className="cursor-help hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {title}
                            </CardTitle>
                            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{value}</div>
                            {description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {description}
                                </p>
                            )}
                            {trend && (
                                <div className="flex items-center mt-2">
                                    <span
                                        className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-1">
                                        vs last period
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                {description && (
                    <TooltipContent>
                        <p className="max-w-xs">{description}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}

export function KPICardSkeleton() {
    return <KPICard title="" value="" isLoading />;
}

'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/superadmin/kpi-card';
import { OrdersChart, APIUsageChart, RevenueChart } from '@/components/superadmin/dashboard-charts';
import { AccountsTable } from '@/components/superadmin/accounts-table';
import { QuickActions, AssignSubscriptionDialog, CreateStoreDialog } from '@/components/superadmin/quick-actions';
import {
    Users,
    CreditCard,
    Store,
    ShoppingCart,
    DollarSign,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardKPIs {
    totalBillingAccounts: number;
    activeSubscriptionsByPlan: {
        FREE: number;
        BASIC: number;
        PRO: number;
        ENTERPRISE: number;
    };
    totalStores: number;
    ordersLast30Days: number;
    revenueLast30Days: number;
    subscriptionRevenueLast30Days: number;
    failedPaymentsLast30Days: number;
}

interface TimeSeriesDataPoint {
    date: string;
    value: number;
}

interface OverviewData {
    kpis: DashboardKPIs;
    ordersChart: TimeSeriesDataPoint[];
    apiUsageChart: TimeSeriesDataPoint[];
    subscriptionRevenueChart: TimeSeriesDataPoint[];
}

export default function SuperAdminDashboard() {
    const [data, setData] = useState<OverviewData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'subscription' | 'store' | null>(null);

    useEffect(() => {
        async function fetchOverview() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/superadmin/overview');
                if (!response.ok) {
                    throw new Error('Failed to fetch overview data');
                }
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
                toast.error('Failed to load dashboard data');
                console.error('Fetch overview error:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOverview();
    }, []);

    const handleAssignSubscription = (accountId: string) => {
        setSelectedAccountId(accountId);
        setActionType('subscription');
    };

    const handleCreateStore = (accountId: string) => {
        setSelectedAccountId(accountId);
        setActionType('store');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount / 100); // Convert from paise to rupees
    };

    const totalActiveSubscriptions = data
        ? Object.values(data.kpis.activeSubscriptionsByPlan).reduce((a, b) => a + b, 0)
        : 0;

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Platform overview and metrics
                    </p>
                </div>
                <QuickActions />
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Failed to load dashboard</p>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <KPICard
                    title="Total Accounts"
                    value={data?.kpis.totalBillingAccounts || 0}
                    description="All billing accounts in the system"
                    icon={Users}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Active Subscriptions"
                    value={totalActiveSubscriptions}
                    description={`FREE: ${data?.kpis.activeSubscriptionsByPlan.FREE || 0} | BASIC: ${data?.kpis.activeSubscriptionsByPlan.BASIC || 0} | PRO: ${data?.kpis.activeSubscriptionsByPlan.PRO || 0} | ENT: ${data?.kpis.activeSubscriptionsByPlan.ENTERPRISE || 0}`}
                    icon={CreditCard}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Total Stores"
                    value={data?.kpis.totalStores || 0}
                    description="Stores across all accounts"
                    icon={Store}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Orders (30d)"
                    value={data?.kpis.ordersLast30Days || 0}
                    description="Orders in the last 30 days"
                    icon={ShoppingCart}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Subscription Revenue (30d)"
                    value={data ? formatCurrency(data.kpis.subscriptionRevenueLast30Days) : '₹0'}
                    description="Revenue from subscriptions"
                    icon={DollarSign}
                    isLoading={isLoading}
                />
                <KPICard
                    title="Failed Payments (30d)"
                    value={data?.kpis.failedPaymentsLast30Days || 0}
                    description="Failed payment attempts"
                    icon={AlertCircle}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <RevenueChart
                    data={data?.subscriptionRevenueChart || []}
                    isLoading={isLoading}
                />
                <APIUsageChart
                    data={data?.apiUsageChart || []}
                    isLoading={isLoading}
                />
            </div>

            {/* Accounts Table */}
            <AccountsTable
                onAssignSubscription={handleAssignSubscription}
                onCreateStore={handleCreateStore}
            />

            {/* Hidden dialogs for row actions */}
            {actionType === 'subscription' && selectedAccountId && (
                <AssignSubscriptionDialog defaultAccountId={selectedAccountId} />
            )}
            {actionType === 'store' && selectedAccountId && (
                <CreateStoreDialog defaultAccountId={selectedAccountId} />
            )}
        </div>
    );
}

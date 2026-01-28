import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { redirect } from "next/navigation";
import * as paymentDal from "@/dal/payment.dal";
import * as paymentConfigDal from "@/dal/paymentConfig.dal";
import { PaymentsClient } from "./client";
import { Separator } from "@/components/ui/separator";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
    params,
}: {
    params: { storeId: string };
}) {
    const { storeId } = await params;

    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) {
        redirect("/login");
    }

    const [paymentStats, configsResult] = await Promise.all([
        paymentDal.listPayments(storeId, { take: 50 }), // detailed list
        paymentConfigDal.listPaymentConfigs(storeId),
    ]);

    const stats = {
        totalRevenue: paymentStats.payments.reduce((acc, p) => p.status === 'COMPLETED' ? acc + p.amount : acc, 0),
        avgOrderValue: 0, // Calculate if needed
        successRate: 0, // Calculate if needed
    };

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Payments & Transactions</h2>
                </div>
                <Separator />

                <PaymentsClient
                    data={paymentStats.payments}
                    configs={configsResult}
                    stats={stats}
                />
            </div>
        </div>
    );
}

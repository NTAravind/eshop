"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import StoreSwitcher from "@/components/admin/store-switcher";
import { AuthButton } from "@/components/auth/auth-button";
import Link from "next/link";

interface AdminShellProps {
    children: React.ReactNode;
    storeId?: string;
    stores: any[];
}

export function AdminShell({ children, storeId, stores }: AdminShellProps) {
    return (
        <div className="flex min-h-screen flex-col space-y-6">
            <div className="grid flex-1 md:grid-cols-[220px_1fr]">
                <aside className="hidden border-r bg-muted/40 md:block min-h-screen">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/admin" className="flex items-center gap-2 font-semibold">
                            <span>E-Com Admin</span>
                        </Link>
                    </div>
                    <div className="flex-1">
                        <div className="py-4">
                            <AdminSidebar storeId={storeId} />
                        </div>
                    </div>
                </aside>
                <main className="flex flex-col">
                    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                        <div className="flex items-center gap-4">
                            {!storeId && <StoreSwitcher items={stores} />}
                        </div>
                        <div className="ml-auto">
                            <AuthButton />
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

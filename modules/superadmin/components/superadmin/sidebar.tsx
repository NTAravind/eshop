'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Building2,
    Activity,
    Settings
} from 'lucide-react';

const sidebarItems = [
    {
        title: 'Overview',
        href: '/superadmin',
        icon: LayoutDashboard,
    },
    {
        title: 'Accounts',
        href: '/superadmin/accounts',
        icon: Building2,
    },
    {
        title: 'Subscriptions',
        href: '/superadmin/subscriptions',
        icon: CreditCard,
    },
    {
        title: 'Users',
        href: '/superadmin/users',
        icon: Users,
    },
    {
        title: 'Plans',
        href: '/superadmin/plans',
        icon: CreditCard,
    },
    {
        title: 'API Usage',
        href: '/superadmin/api-usage',
        icon: Activity,
    },
];

export function SuperAdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-muted/10">
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/superadmin" className="flex items-center gap-2 font-semibold">
                    <span className="">Super Admin</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {sidebarItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = item.href === '/superadmin'
                            ? pathname === '/superadmin'
                            : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto border-t p-4">
                <Link
                    href="/superadmin/settings"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        pathname.startsWith("/superadmin/settings") && "bg-muted text-primary"
                    )}
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            </div>
        </div>
    );
}

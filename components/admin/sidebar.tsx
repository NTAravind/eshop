"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Store,
    Settings,
    ShoppingBag,
    Package,
    Users,
    Activity,
    Bell,
    List,
    Palette,
    LayoutTemplate,
} from "lucide-react";

interface AdminSidebarProps {
    storeId?: string;
    className?: string;
}

export function AdminSidebar({ storeId, className }: AdminSidebarProps) {
    const pathname = usePathname();

    const tenantLinks = [
        {
            href: "/admin",
            label: "Overview",
            icon: LayoutDashboard,
            active: pathname === "/admin",
        },
        {
            href: "/admin/stores",
            label: "Stores",
            icon: Store,
            active: pathname === "/admin/stores",
        },
        {
            href: "/admin/settings",
            label: "Settings",
            icon: Settings,
            active: pathname === "/admin/settings",
        },
    ];

    const storeLinks = [
        {
            href: `/admin/stores/${storeId}/overview`,
            label: "Overview",
            icon: LayoutDashboard,
            active: pathname === `/admin/stores/${storeId}/overview`,
        },
        {
            href: `/admin/stores/${storeId}/orders`,
            label: "Orders",
            icon: ShoppingBag,
            active: pathname.includes(`/admin/stores/${storeId}/orders`),
        },
        {
            href: `/admin/stores/${storeId}/products`,
            label: "Products",
            icon: Package,
            active: pathname.includes(`/admin/stores/${storeId}/products`),
        },
        {
            href: `/admin/stores/${storeId}/categories`,
            label: "Categories",
            icon: List,
            active: pathname.includes(`/admin/stores/${storeId}/categories`),
        },
        {
            href: `/admin/stores/${storeId}/product-schemas`,
            label: "Product Types",
            icon: Palette,
            active: pathname.includes(`/admin/stores/${storeId}/product-schemas`),
        },

        {
            href: `/admin/stores/${storeId}/notifications`,
            label: "Notifications",
            icon: Bell,
            active: pathname === `/admin/stores/${storeId}/notifications` || pathname === `/admin/stores/${storeId}/notifications/workflow`,
        },
        {
            href: `/admin/stores/${storeId}/notifications/templates`,
            label: "Templates",
            icon: LayoutTemplate,
            active: pathname.includes(`/admin/stores/${storeId}/notifications/templates`),
        },
        {
            href: `/admin/stores/${storeId}/payments`,
            label: "Payments",
            icon: ShoppingBag, // Or CreditCard if imported
            active: pathname.includes(`/admin/stores/${storeId}/payments`),
        },
        {
            href: `/admin/stores/${storeId}/customers`,
            label: "Customers",
            icon: Users,
            active: pathname.includes(`/admin/stores/${storeId}/customers`),
        },
        {
            href: `/admin/stores/${storeId}/operations`,
            label: "Operations",
            icon: Activity,
            active: pathname.includes(`/admin/stores/${storeId}/operations`),
        },
        {
            href: `/admin/stores/${storeId}/staff`,
            label: "Staff",
            icon: Users,
            active: pathname.includes(`/admin/stores/${storeId}/staff`),
        },
        {
            href: `/admin/stores/${storeId}/settings`,
            label: "Settings",
            icon: Settings,
            active: pathname.includes(`/admin/stores/${storeId}/settings`),
        },
    ];

    const links = storeId ? storeLinks : tenantLinks;

    return (
        <nav className={cn("grid gap-1 px-2", className)}>
            {links.map((link, index) => (
                <Link
                    key={index}
                    href={link.href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                        link.active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}
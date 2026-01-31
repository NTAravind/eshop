import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Check for admin role if necessary; for now, any logged-in user can access admin
    // (though the API might restrict what they see).
    // Ideally, we'd check if they are tenant admin or store staff here too,
    // but simpler auth check is a good first step.

    return (
        <>
            {children}
        </>
    );
}

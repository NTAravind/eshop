import { format } from "date-fns";
import { redirect } from "next/navigation";

import * as schemaService from "@/services/schema.service";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { ProductSchemasClient } from "./client";
import { SchemaColumn } from "./client";

export const dynamic = 'force-dynamic';

export default async function ProductSchemasPage({
    params
}: {
    params: { storeId: string }
}) {
    const { storeId } = await params;
    const tenant = await resolveTenant(storeId);

    if (!tenant.userId) {
        redirect("/login");
    }

    const schemas = await schemaService.listSchemas(storeId);

    const formattedSchemas: SchemaColumn[] = schemas.map((item) => ({
        id: item.id,
        name: item.name,
        version: item.version,
        fieldsCount: (item.fields as any[])?.length || 0,
        isActive: item.isActive,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductSchemasClient data={formattedSchemas} />
            </div>
        </div>
    );
}

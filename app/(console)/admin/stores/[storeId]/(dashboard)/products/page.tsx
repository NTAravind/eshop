import { format } from "date-fns";
import { ProductsClient } from "./client";
import { ProductColumn } from "./columns";
import * as productService from "@/services/product.service";
import * as schemaService from "@/services/schema.service";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
    params,
    searchParams
}: {
    params: { storeId: string };
    searchParams: { page?: string };
}) {
    const { storeId } = await params;
    const { page } = await searchParams;

    const tenant = await resolveTenant(storeId);
    if (!tenant.userId) {
        redirect("/login");
    }

    const pageIndex = page ? parseInt(page) - 1 : 0;
    const pageSize = 10;

    const [result, schemas] = await Promise.all([
        productService.listProducts(storeId, {
            skip: pageIndex * pageSize,
            take: pageSize
        }),
        schemaService.listActiveSchemas(storeId)
    ]);

    // Create a map of schema ID to schema name
    const schemaMap = new Map(schemas.map(s => [s.id, s.name]));

    const formattedProducts: ProductColumn[] = result.products.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.variants?.[0]?.sku || "N/A",
        price: item.variants?.[0]?.price || 0,
        stock: item.variants?.[0]?.stock || 0,
        productType: item.productSchemaId ? schemaMap.get(item.productSchemaId) || "No Type" : "No Type",
        category: item.category?.name || "Uncategorized",
        isActive: item.isActive,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
        customData: item.customData, // Pass customData for dynamic columns
    }));

    const pageCount = Math.ceil(result.total / pageSize);
    // Use the first schema for dynamic fields display (or could be made configurable)
    const schemaFields = (schemas[0]?.fields as any[]) || [];

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductsClient
                    data={formattedProducts}
                    pageCount={pageCount}
                    pageIndex={pageIndex}
                    schemaFields={schemaFields}
                />
            </div>
        </div>
    );
}

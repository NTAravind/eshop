import { ProductSchemaForm } from "@/components/admin/product-schema-form";
import prisma from "@/lib/prisma"; // Direct DB access for initial data, or use service
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function EditProductSchemaPage({
    params
}: {
    params: { storeId: string; schemaId: string }
}) {
    const { storeId, schemaId } = await params;

    const schema = await prisma.productSchema.findUnique({
        where: { id: schemaId }
    });

    if (!schema) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductSchemaForm initialData={schema} />
            </div>
        </div>
    );
}

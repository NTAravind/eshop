
import { ProductForm } from "../components/product-form";
import * as schemaService from "@/services/schema.service";
import * as categoryService from "@/services/category.service";
import * as db from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProductPage({
    params
}: {
    params: { storeId: string; productId: string }
}) {
    const { storeId, productId } = await params;

    const isNew = productId === 'new';

    const [schemas, categories, product] = await Promise.all([
        schemaService.listActiveSchemas(storeId),
        categoryService.listCategories(storeId),
        isNew ? null : db.default.product.findUnique({
            where: {
                id: productId,
            },
        })
    ]);

    if (!isNew && !product) {
        notFound();
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductForm
                    initialData={product}
                    schemas={schemas}
                    categories={categories}
                />
            </div>
        </div>
    );
}

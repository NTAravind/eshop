

import { getVariant } from "@/services/variant.service";
import { getProduct } from "@/services/product.service";
import * as schemaService from "@/services/schema.service";
import { VariantForm } from "../components/variant-form";
import { notFound } from "next/navigation";

export default async function EditVariantPage({
    params
}: {
    params: { storeId: string; productId: string; variantId: string }
}) {
    const { storeId, productId, variantId } = await params;

    const [product, variant] = await Promise.all([
        getProduct(storeId, productId),
        getVariant(storeId, variantId)
    ]);

    if (!variant || !product) {
        notFound();
    }

    // Fetch product schema if product has one
    let productSchema = null;
    if (product.productSchemaId) {
        productSchema = await schemaService.getSchemaById(product.productSchemaId);
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <VariantForm initialData={variant} productId={productId} productSchema={productSchema} />
            </div>
        </div>
    );
}

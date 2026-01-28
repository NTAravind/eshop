
import { getProduct } from "@/services/product.service";
import * as schemaService from "@/services/schema.service";
import { VariantForm } from "../components/variant-form";
import { notFound } from "next/navigation";

export default async function NewVariantPage({
    params
}: {
    params: { storeId: string; productId: string }
}) {
    const { storeId, productId } = await params;

    const product = await getProduct(storeId, productId);

    if (!product) {
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
                <VariantForm initialData={null} productId={productId} productSchema={productSchema} />
            </div>
        </div>
    );
}

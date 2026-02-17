

import { listVariants } from "@/services/variant.service";
import { getProduct } from "@/services/product.service";
import { getStoreWithAccount } from "@/services/store.service";
import * as schemaService from "@/services/schema.service";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { VariantList } from "./components/variant-list";
import { notFound } from "next/navigation";

export default async function VariantsPage({
    params
}: {
    params: { storeId: string; productId: string }
}) {
    const { storeId, productId } = await params;

    const [product, variants, store] = await Promise.all([
        getProduct(storeId, productId),
        listVariants(storeId, productId),
        getStoreWithAccount(storeId)
    ]);

    if (!product) {
        notFound();
    }

    // Fetch product schema if product has one
    let productSchema = null;
    if (product.productSchemaId) {
        productSchema = await schemaService.getSchemaById(product.productSchemaId);
    }

    // Transform variants to handle customData type (JsonValue can be null)
    const transformedVariants = variants.map(variant => ({
        ...variant,
        customData: variant.customData as Record<string, any> | undefined
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title={`Variants for "${product.name}"`}
                        description="Manage product variants (SKU, price, stock, attributes)"
                    />
                    <Link href={`/admin/stores/${storeId}/products/${productId}/variants/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Variant
                        </Button>
                    </Link>
                </div>
                <Separator />
                <VariantList
                    variants={transformedVariants}
                    productId={productId}
                    currency={store?.currency || 'USD'}
                />
            </div>
        </div>
    );
}

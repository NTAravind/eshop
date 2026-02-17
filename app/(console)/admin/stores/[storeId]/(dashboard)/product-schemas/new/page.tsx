import { ProductSchemaForm } from "@/components/admin/product-schema-form";

export const dynamic = 'force-dynamic';

export default function CreateProductSchemaPage() {
    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <ProductSchemaForm />
            </div>
        </div>
    );
}

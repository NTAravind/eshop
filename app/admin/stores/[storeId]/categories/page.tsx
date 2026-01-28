
import { format } from "date-fns";

import { CategoryClient } from "./components/client";
import { listCategories } from "@/services/category.service"; // Direct DB call for server component

export default async function CategoriesPage({
    params
}: {
    params: { storeId: string }
}) {
    const { storeId } = await params;
    const categories = await listCategories(storeId);

    const formattedCategories: any[] = categories.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        createdAt: format(item.createdAt, "MMMM do, yyyy"),
    }));

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryClient data={formattedCategories} />
            </div>
        </div>
    );
}

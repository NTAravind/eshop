
import { CategoryForm } from "../components/category-form";
import { getCategory, listCategories } from "@/services/category.service";

export default async function CategoryPage({
    params
}: {
    params: { storeId: string; categoryId: string }
}) {
    const { storeId, categoryId } = await params;
    let category = null;

    // Retrieve all categories for the parent dropdown
    // Real implementation might want to filter or paginate, but for now fetching all is reasonable for select
    const categories = await listCategories(storeId);

    if (categoryId !== "new") {
        category = await getCategory(storeId, categoryId);
    }

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <CategoryForm initialData={category} categories={categories} />
            </div>
        </div>
    );
}

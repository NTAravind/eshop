"use server";

import * as facetService from "@/server/services/facet.service";
import { revalidatePath } from "next/cache";

export async function deleteFacetAction(storeId: string, facetId: string) {
    try {
        await facetService.deleteFacet(storeId, facetId);
        revalidatePath(`/admin/stores/${storeId}/filters`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete facet:", error);
        return { success: false, error: "Failed to delete facet" };
    }
}



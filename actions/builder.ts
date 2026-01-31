"use server"

import { upsertLayout } from "@/services/layout.service"
import type { LayoutRoot } from "@/types/builder"

export async function saveLayoutAction(storeId: string, layout: LayoutRoot) {
    try {
        // Save as draft (isPublished = false)
        await upsertLayout(storeId, layout.page, layout.tree, false)
        return { success: true }
    } catch (error) {
        console.error("Failed to save layout:", error)
        return { success: false, error: "Failed to save layout" }
    }
}

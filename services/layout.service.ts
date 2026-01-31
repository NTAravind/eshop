import db from "@/lib/prisma"
import type { Prisma } from "@/app/generated/prisma"

export async function upsertLayout(storeId: string, page: string, tree: any, isPublished: boolean = false) {
    return await db.layout.upsert({
        where: {
            storeId_page_isPublished: {
                storeId,
                page,
                isPublished,
            },
        },
        update: {
            tree,
        },
        create: {
            storeId,
            page,
            tree,
            isPublished,
        },
    })
}

export async function getLayout(storeId: string, page: string, isPublished: boolean = false) {
    return await db.layout.findUnique({
        where: {
            storeId_page_isPublished: {
                storeId,
                page,
                isPublished,
            },
        },
    })
}

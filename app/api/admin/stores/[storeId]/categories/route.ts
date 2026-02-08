
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as categoryService from '@/services/category.service';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, slug, parentId } = body;
        const { storeId } = await params;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        if (!slug) {
            return new NextResponse("Slug is required", { status: 400 });
        }

        const category = await categoryService.createCategory(userId, storeId, {
            name,
            slug,
            parentId
        });

        return NextResponse.json(category);
    } catch (error) {
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 400 });
        }
        console.log('[CATEGORIES_POST]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await params;

        const categories = await categoryService.listCategories(storeId);

        return NextResponse.json(categories);
    } catch (error) {
        console.log('[CATEGORIES_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

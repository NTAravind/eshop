
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as categoryService from '@/services/category.service';

export async function GET(
    req: Request,
    { params }: { params: { storeId: string; categoryId: string } }
) {
    try {
        const { storeId, categoryId } = await params;

        if (!categoryId) {
            return new NextResponse("Category ID is required", { status: 400 });
        }

        const category = await categoryService.getCategory(storeId, categoryId);

        return NextResponse.json(category);
    } catch (error) {
        console.log('[CATEGORY_GET]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { storeId: string; categoryId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const { storeId, categoryId } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, slug, parentId } = body;

        if (!categoryId) {
            return new NextResponse("Category ID is required", { status: 400 });
        }

        const category = await categoryService.updateCategory(userId, storeId, categoryId, {
            name,
            slug,
            parentId
        });

        return NextResponse.json(category);
    } catch (error) {
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 400 });
        }
        console.log('[CATEGORY_PATCH]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { storeId: string; categoryId: string } }
) {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        const { storeId, categoryId } = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!categoryId) {
            return new NextResponse("Category ID is required", { status: 400 });
        }

        const category = await categoryService.deleteCategory(userId, storeId, categoryId);

        return NextResponse.json(category);
    } catch (error) {
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 400 });
        }
        console.log('[CATEGORY_DELETE]', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

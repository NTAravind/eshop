
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as categoryService from '@/services/category.service';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ storeId: string; categoryId: string }> }
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



import { NextRequest, NextResponse } from "next/server";
import * as facetService from "@/server/services/facet.service";
import { requireStoreRole } from "@/server/auth/requireStore";
import { auth } from "@/server/auth";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ storeId: string }> }
) {
    try {
        const { storeId } = await context.params;
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify access - assuming MANAGER role is required to manage facets
        // requireStoreRole will throw an error if access is denied
        await requireStoreRole(session.user.id, storeId, 'MANAGER');

        await facetService.syncAllFacets(storeId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FACETS_SYNC_ERROR]", error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        // If requireStoreRole throws, we might want to return 403
        // Check if error message contains "Access denied"
        if (error instanceof Error && error.message.includes("Access denied")) {
            return new NextResponse(error.message, { status: 403 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

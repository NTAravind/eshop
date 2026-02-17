import { getFacets } from "@/server/services/facet.service";
import { FacetClient } from "./client";

export default async function FacetsPage({
    params
}: {
    params: Promise<{ storeId: string }>
}) {
    const { storeId } = await params;
    const facets = await getFacets(storeId);

    return (
        <div className="flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <FacetClient data={facets} storeId={storeId} />
            </div>
        </div>
    );
}

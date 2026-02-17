import { redirect } from 'next/navigation';
import * as storefrontService from '@/services/storefront.service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StorefrontDocKind } from '@/app/generated/prisma';

export default async function BuilderDocumentListPage({
    params,
}: {
    params: Promise<{ storeId: string }>;
}) {
    const { storeId } = await params;

    const documents = await storefrontService.listDocuments(storeId);

    // Group documents by kind
    const grouped = documents.reduce((acc, doc) => {
        const kind = doc.kind as string;
        if (!acc[kind]) acc[kind] = [];
        acc[kind].push(doc);
        return acc;
    }, {} as Record<string, typeof documents>);

    // Order of kinds to display
    const kindOrder = [
        StorefrontDocKind.PAGE,
        StorefrontDocKind.LAYOUT,
        StorefrontDocKind.TEMPLATE,
        StorefrontDocKind.PREFAB,
    ];

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Storefront Builder</h1>
                    <p className="text-muted-foreground">Select a document to edit.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/admin/stores/${storeId}`}>Back to Dashboard</Link>
                </Button>
            </div>

            <div className="space-y-8">
                {kindOrder.map((kind) => {
                    const docs = grouped[kind] || [];
                    if (docs.length === 0) return null;

                    return (
                        <div key={kind} className="space-y-4">
                            <h2 className="text-xl font-semibold capitalize">
                                {kind.toLowerCase().replace('_', ' ')}s
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {docs.map((doc) => (
                                    <div key={doc.id}>
                                        <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                                            <Link href={`/admin/stores/${storeId}/builder/${doc.id}`}>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{doc.key}</CardTitle>
                                                    <CardDescription>
                                                        Last updated: {new Date(doc.updatedAt).toLocaleDateString()}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex gap-2">
                                                        <span className="text-xs bg-muted px-2 py-1 rounded">
                                                            {doc.status}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Link>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

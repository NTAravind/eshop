'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { StorefrontDocKind } from '@/app/generated/prisma';
import { createDocument } from '../actions';

interface CreateDocumentButtonProps {
    storeId: string;
}

const kindLabels: Record<StorefrontDocKind, string> = {
    [StorefrontDocKind.PAGE]: 'Page',
    [StorefrontDocKind.LAYOUT]: 'Layout',
    [StorefrontDocKind.TEMPLATE]: 'Template',
    [StorefrontDocKind.PREFAB]: 'Prefab',
};

const kindDescriptions: Record<StorefrontDocKind, string> = {
    [StorefrontDocKind.PAGE]: 'Static pages like Home, About, Contact, or custom collection pages',
    [StorefrontDocKind.LAYOUT]: 'Wrappers that contain shared elements (headers, footers, navbars)',
    [StorefrontDocKind.TEMPLATE]: 'Dynamic layouts for product detail pages or other dynamic routes',
    [StorefrontDocKind.PREFAB]: 'Reusable component templates like ProductCard variants',
};

export function CreateDocumentButton({ storeId }: CreateDocumentButtonProps) {
    const [open, setOpen] = useState(false);
    const [kind, setKind] = useState<StorefrontDocKind>(StorefrontDocKind.PAGE);
    const [key, setKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const result = await createDocument(storeId, kind, key.trim());

        if (result.success) {
            setOpen(false);
            setKey('');
            setKind(StorefrontDocKind.PAGE);
            // Refresh the page to show the new document
            window.location.reload();
        } else {
            setError(result.error || 'Failed to create document');
        }

        setIsLoading(false);
    }

    if (!mounted) {
        return (
            <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Document
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Document</DialogTitle>
                    <DialogDescription>
                        Create a new page, layout, template, or prefab for your storefront.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="kind">Document Type</Label>
                            <Select
                                value={kind}
                                onValueChange={(value) => setKind(value as StorefrontDocKind)}
                            >
                                <SelectTrigger id="kind">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(StorefrontDocKind).map((k) => (
                                        <SelectItem key={k} value={k}>
                                            {kindLabels[k]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {kindDescriptions[kind]}
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="key">Document Key</Label>
                            <Input
                                id="key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="e.g., ABOUT_US or ProductCardLarge"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique identifier. Use letters, numbers, underscores, colons, and hyphens.
                            </p>
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !key.trim()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Document'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { seedStore } from '@/lib/actions/seed-store';
import { toast } from 'sonner';
import { Database, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SeedStoreButtonProps {
    storeId: string;
}

export function SeedStoreButton({ storeId }: SeedStoreButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSeed = () => {
        startTransition(async () => {
            try {
                const result = await seedStore(storeId);
                if (result.success) {
                    toast.success('Store seeded successfully with sample data');
                    router.refresh();
                } else {
                    toast.error(result.error || 'Failed to seed store');
                }
            } catch (error) {
                toast.error('An unexpected error occurred');
                console.error(error);
            }
        });
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={isPending}
            className="gap-2"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Database className="h-4 w-4" />
            )}
            {isPending ? 'Seeding...' : 'Seed Sample Data'}
        </Button>
    );
}

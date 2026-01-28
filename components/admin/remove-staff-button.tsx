'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RemoveStaffButtonProps {
    storeId: string;
    userId: string;
    userName: string;
    disabled?: boolean;
}

export function RemoveStaffButton({ storeId, userId, userName, disabled }: RemoveStaffButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    async function handleRemove() {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/admin/staff/${userId}`, {
                method: 'DELETE',
                headers: {
                    'X-Store-Id': storeId,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Failed to remove staff member');
                return;
            }

            toast.success('Staff member removed successfully');
            router.refresh();
        } catch (error) {
            toast.error('Failed to remove staff member');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled={disabled || isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to remove <strong>{userName}</strong> from this store?
                        They will lose all access immediately.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Remove
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

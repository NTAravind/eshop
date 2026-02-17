'use client';

import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, UserPlus, Store } from 'lucide-react';
import { toast } from 'sonner';
import { PlanType } from '@/app/generated/prisma';
import {
    createClientAction,
    assignSubscriptionAction,
    createStoreForClientAction,
} from '@/app/superadmin/actions/superadmin.actions';

export function QuickActions() {
    return (
        <div className="flex gap-2">
            <CreateClientDialog />
            <AssignSubscriptionDialog />
            <CreateStoreDialog />
        </div>
    );
}

// ==========================================
// CREATE CLIENT DIALOG
// ==========================================

function CreateClientDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ownerEmail: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.ownerEmail) {
            toast.error('Please fill in all fields');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.ownerEmail)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createClientAction(formData);

            if (result.success) {
                toast.success(`Client created successfully! ID: ${result.accountId?.slice(0, 8)}...`);
                setOpen(false);
                setFormData({ name: '', ownerEmail: '' });
                // Trigger page refresh
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to create client');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error('Create client error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Client
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Client</DialogTitle>
                        <DialogDescription>
                            Create a new billing account with FREE subscription
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Account Name</Label>
                            <Input
                                id="name"
                                placeholder="Acme Corporation"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Owner Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="owner@example.com"
                                value={formData.ownerEmail}
                                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                User will be created if they don't exist
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Client'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// ASSIGN SUBSCRIPTION DIALOG
// ==========================================

interface AssignSubscriptionDialogProps {
    defaultAccountId?: string;
}

function AssignSubscriptionDialog({ defaultAccountId }: AssignSubscriptionDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        accountId: defaultAccountId || '',
        userEmail: '',
        planType: '' as PlanType | '',
        billingCycle: 'MONTHLY' as 'MONTHLY' | 'YEARLY',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((!formData.accountId && !formData.userEmail) || !formData.planType) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const result = await assignSubscriptionAction({
                accountId: formData.accountId,
                userEmail: formData.userEmail,
                planType: formData.planType as PlanType,
                billingCycle: formData.billingCycle,
            });

            if (result.success) {
                toast.success('Subscription assigned successfully!');
                setOpen(false);
                setOpen(false);
                setFormData({ accountId: '', userEmail: '', planType: '', billingCycle: 'MONTHLY' });
                // Trigger page refresh
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to assign subscription');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error('Assign subscription error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Assign Subscription
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Assign Subscription</DialogTitle>
                        <DialogDescription>
                            Assign or upgrade a subscription plan for an account
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="userEmail">User Email</Label>
                            <Input
                                id="userEmail"
                                type="email"
                                placeholder="user@example.com"
                                value={formData.userEmail}
                                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                                required={!formData.accountId}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter the email of the user to find their account
                            </p>
                        </div>
                        {/* Hidden Account ID field if needed for fallback or pre-fill */}
                        {formData.accountId && (
                            <div className="text-xs text-muted-foreground">
                                Account ID: {formData.accountId}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="planType">Plan Type</Label>
                            <Select
                                value={formData.planType}
                                onValueChange={(value) => setFormData({ ...formData, planType: value as PlanType })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FREE">FREE</SelectItem>
                                    <SelectItem value="BASIC">BASIC</SelectItem>
                                    <SelectItem value="PRO">PRO</SelectItem>
                                    <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="billingCycle">Billing Cycle</Label>
                            <Select
                                value={formData.billingCycle}
                                onValueChange={(value) => setFormData({ ...formData, billingCycle: value as 'MONTHLY' | 'YEARLY' })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    <SelectItem value="YEARLY">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Assigning...' : 'Assign Subscription'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// CREATE STORE DIALOG
// ==========================================

interface CreateStoreDialogProps {
    defaultAccountId?: string;
}

function CreateStoreDialog({ defaultAccountId }: CreateStoreDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        accountId: defaultAccountId || '',
        storeName: '',
        slug: '',
    });

    const handleNameChange = (name: string) => {
        setFormData({
            ...formData,
            storeName: name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.accountId || !formData.storeName || !formData.slug) {
            toast.error('Please fill in all fields');
            return;
        }

        // Validate slug format
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(formData.slug)) {
            toast.error('Slug must be lowercase alphanumeric with hyphens');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createStoreForClientAction(formData);

            if (result.success) {
                toast.success(`Store created successfully! Slug: ${formData.slug}`);
                setOpen(false);
                setFormData({ accountId: '', storeName: '', slug: '' });
                // Trigger page refresh
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to create store');
            }
        } catch (error) {
            toast.error('An error occurred');
            console.error('Create store error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Store className="h-4 w-4" />
                    Create Store
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Store for Client</DialogTitle>
                        <DialogDescription>
                            Create a new store on behalf of a billing account
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="storeAccountId">Account ID</Label>
                            <Input
                                id="storeAccountId"
                                placeholder="clxxxxxxxxxxxxx"
                                value={formData.accountId}
                                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Copy from the accounts table
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="storeName">Store Name</Label>
                            <Input
                                id="storeName"
                                placeholder="My Awesome Store"
                                value={formData.storeName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Store Slug</Label>
                            <Input
                                id="slug"
                                placeholder="my-awesome-store"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                URL-friendly identifier (lowercase, hyphens only)
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Store'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Export individual dialogs for use in table row actions
export { AssignSubscriptionDialog, CreateStoreDialog };

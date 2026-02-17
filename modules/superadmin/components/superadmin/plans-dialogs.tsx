'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlanType } from '@/app/generated/prisma';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil } from 'lucide-react';
import { createPlanAction, updatePlanAction, CreatePlanInput } from '@/app/superadmin/actions/superadmin.actions';

const planSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.nativeEnum(PlanType),
    price: z.coerce.number().min(0, 'Price must be non-negative'),
    yearlyPrice: z.coerce.number().min(0).optional(),
    maxStores: z.coerce.number().int().min(1).optional(),
    maxProducts: z.coerce.number().int().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planSchema>;

interface CreatePlanDialogProps {
    onSuccess?: () => void;
}

export function CreatePlanDialog({ onSuccess }: CreatePlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<PlanFormData>({
        resolver: zodResolver(planSchema) as any,
        defaultValues: {
            isActive: true,
            type: PlanType.FREE,
            price: 0,
            yearlyPrice: 0,
        },
    });

    const onSubmit = async (data: PlanFormData) => {
        setIsLoading(true);
        try {
            const result = await createPlanAction(data);
            if (result.success) {
                toast.success('Plan created successfully');
                setOpen(false);
                reset();
                onSuccess?.();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to create plan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Plan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Subscription Plan</DialogTitle>
                    <DialogDescription>
                        Add a new subscription tier to the system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Plan Name</Label>
                            <Input id="name" placeholder="e.g. Basic" {...register('name')} />
                            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                onValueChange={(val) => setValue('type', val as PlanType)}
                                defaultValue={watch('type')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.values(PlanType).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && <span className="text-xs text-red-500">{errors.type.message}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Monthly Price ($)</Label>
                            <Input id="price" type="number" step="0.01" {...register('price')} />
                            {errors.price && <span className="text-xs text-red-500">{errors.price.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
                            <Input id="yearlyPrice" type="number" step="0.01" {...register('yearlyPrice')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxStores">Max Stores</Label>
                            <Input id="maxStores" type="number" {...register('maxStores')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxProducts">Max Products</Label>
                            <Input id="maxProducts" type="number" {...register('maxProducts')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" {...register('description')} />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={watch('isActive')}
                            onCheckedChange={(checked: boolean) => setValue('isActive', checked)}
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Plan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface UpdatePlanDialogProps {
    plan: {
        id: string;
        name: string;
        type: PlanType;
        price: number;
        yearlyPrice?: number | null;
        maxStores?: number | null;
        maxProducts?: number | null;
        description?: string | null;
        isActive: boolean;
    };
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function UpdatePlanDialog({ plan, trigger, onSuccess }: UpdatePlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<PlanFormData>({
        resolver: zodResolver(planSchema) as any,
        defaultValues: {
            name: plan.name,
            type: plan.type,
            price: plan.price,
            yearlyPrice: plan.yearlyPrice || undefined,
            maxStores: plan.maxStores || undefined,
            maxProducts: plan.maxProducts || undefined,
            description: plan.description || undefined,
            isActive: plan.isActive,
        },
    });

    const onSubmit = async (data: PlanFormData) => {
        setIsLoading(true);
        try {
            const result = await updatePlanAction(plan.id, data);
            if (result.success) {
                toast.success('Plan updated successfully');
                setOpen(false);
                onSuccess?.();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to update plan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Plan</DialogTitle>
                    <DialogDescription>
                        Update details for {plan.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Reuse similar form fields - ideally extract form but duplication is fine for now */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Plan Name</Label>
                            <Input id="edit-name" {...register('name')} />
                            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Type</Label>
                            <Input value={plan.type} disabled className="bg-muted" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-price">Monthly Price ($)</Label>
                            <Input id="edit-price" type="number" step="0.01" {...register('price')} />
                            {errors.price && <span className="text-xs text-red-500">{errors.price.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-yearlyPrice">Yearly Price ($)</Label>
                            <Input id="edit-yearlyPrice" type="number" step="0.01" {...register('yearlyPrice')} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-maxStores">Max Stores</Label>
                            <Input id="edit-maxStores" type="number" {...register('maxStores')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-maxProducts">Max Products</Label>
                            <Input id="edit-maxProducts" type="number" {...register('maxProducts')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea id="edit-description" {...register('description')} />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="edit-isActive"
                            checked={watch('isActive')}
                            onCheckedChange={(checked: boolean) => setValue('isActive', checked)}
                        />
                        <Label htmlFor="edit-isActive">Active</Label>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Updating...' : 'Update Plan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

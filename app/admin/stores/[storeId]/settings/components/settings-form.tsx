'use client';

import { useActionState, useEffect } from "react";
import { updateStoreAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'INR', name: 'Indian Rupee (₹)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' },
];

interface SettingsFormProps {
    storeId: string;
    initialData: {
        name: string;
        currency: string;
    };
}

const initialState = {
    message: "",
    errors: {},
    success: false,
};

export function SettingsForm({ storeId, initialData }: SettingsFormProps) {
    // @ts-ignore - useActionState type definition might differ slightly in different React 19 builds/types
    const [state, formAction, isPending] = useActionState(updateStoreAction.bind(null, storeId), initialState);

    useEffect(() => {
        if (state.success) {
            toast.success(state.message);
        } else if (state.errors?._form) {
            toast.error(state.errors._form[0]);
        }
    }, [state]);

    return (
        <form action={formAction} className="space-y-8">
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Store Name</Label>
                    <Input
                        id="name"
                        name="name"
                        defaultValue={initialData.name}
                        placeholder="My Awesome Store"
                    />
                    {state.errors?.name && (
                        <p className="text-sm text-red-500">{state.errors.name[0]}</p>
                    )}
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="currency">Store Currency</Label>
                    <div className="flex flex-col space-y-1">
                        <Select name="currency" defaultValue={initialData.currency}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((currency) => (
                                    <SelectItem key={currency.code} value={currency.code}>
                                        {currency.code} - {currency.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[0.8rem] text-muted-foreground">
                            This is the currency your customers will see.
                        </p>
                    </div>

                    {state.errors?.currency && (
                        <p className="text-sm text-red-500">{state.errors.currency[0]}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}

'use server';

import { updateStore } from '@/dal/store.dal';
import { revalidatePath } from 'next/cache';
import { resolveTenant } from '@/lib/tenant/resolveTenant';

export type UpdateStoreState = {
    message?: string;
    errors?: {
        name?: string[];
        currency?: string[];
        _form?: string[];
    };
    success?: boolean;
};

export async function updateStoreAction(
    storeId: string,
    prevState: UpdateStoreState,
    formData: FormData
): Promise<UpdateStoreState> {
    try {
        // Ensure access (this will throw if not allowed)
        await resolveTenant(storeId);

        const name = formData.get('name') as string;
        const currency = formData.get('currency') as string;
        // requirePhoneNumber is a checkbox, sending 'on' if checked, null otherwise
        // But for now, let's focus on currency and name as requested.
        // If we want to support requirePhoneNumber, we'd check formData.get('requirePhoneNumber') === 'on'

        if (!name || name.trim().length < 3) {
            return {
                errors: {
                    name: ['Store name must be at least 3 characters long.'],
                },
            };
        }

        if (!currency) {
            return {
                errors: {
                    currency: ['Currency is required.'],
                },
            };
        }

        // Simple validation for currency code
        if (currency.length !== 3) {
            return {
                errors: {
                    currency: ['Currency must be a 3-letter code (e.g. INR, USD).'],
                },
            };
        }

        await updateStore(storeId, {
            name,
            currency: currency.toUpperCase(),
        });

        revalidatePath(`/admin/stores/${storeId}/settings`);

        return {
            success: true,
            message: 'Store settings updated successfully.',
        };
    } catch (error) {
        console.error('Failed to update store:', error);
        return {
            success: false,
            errors: {
                _form: ['Failed to update store settings. Please try again.'],
            },
        };
    }
}

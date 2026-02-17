import prisma from '@/lib/prisma';
import { StorefrontDocStatus } from '@/app/generated/prisma';

export interface ThemeVars {
    // Core colors
    background?: string;
    foreground?: string;
    card?: string;
    cardForeground?: string;
    popover?: string;
    popoverForeground?: string;
    primary?: string;
    primaryForeground?: string;
    secondary?: string;
    secondaryForeground?: string;
    muted?: string;
    mutedForeground?: string;
    accent?: string;
    accentForeground?: string;
    destructive?: string;
    destructiveForeground?: string;
    border?: string;
    input?: string;
    ring?: string;
    // Chart colors
    chart1?: string;
    chart2?: string;
    chart3?: string;
    chart4?: string;
    chart5?: string;
    // Radius
    radius?: string;
    // Additional custom vars
    [key: string]: string | undefined;
}

/**
 * Get theme for a store by status
 */
export async function getTheme(storeId: string, status: StorefrontDocStatus) {
    return prisma.storefrontTheme.findUnique({
        where: {
            storeId_status: {
                storeId,
                status,
            },
        },
    });
}

/**
 * Create or update a theme
 */
export async function createOrUpdateTheme(
    storeId: string,
    status: StorefrontDocStatus,
    vars: ThemeVars
) {
    return prisma.storefrontTheme.upsert({
        where: {
            storeId_status: {
                storeId,
                status,
            },
        },
        update: {
            vars: vars as object,
        },
        create: {
            storeId,
            status,
            vars: vars as object,
        },
    });
}

/**
 * Publish theme - copy DRAFT vars to PUBLISHED
 */
export async function publishTheme(storeId: string) {
    return prisma.$transaction(async (tx) => {
        // Get draft theme
        const draft = await tx.storefrontTheme.findUnique({
            where: {
                storeId_status: {
                    storeId,
                    status: StorefrontDocStatus.DRAFT,
                },
            },
        });

        if (!draft) {
            throw new Error('No draft theme found');
        }

        // Upsert published theme
        const published = await tx.storefrontTheme.upsert({
            where: {
                storeId_status: {
                    storeId,
                    status: StorefrontDocStatus.PUBLISHED,
                },
            },
            update: {
                vars: draft.vars as object,
            },
            create: {
                storeId,
                status: StorefrontDocStatus.PUBLISHED,
                vars: draft.vars as object,
            },
        });

        return published;
    });
}

/**
 * Get published theme (for runtime)
 */
export async function getPublishedTheme(storeId: string) {
    return prisma.storefrontTheme.findUnique({
        where: {
            storeId_status: {
                storeId,
                status: StorefrontDocStatus.PUBLISHED,
            },
        },
    });
}

/**
 * Delete theme
 */
export async function deleteTheme(storeId: string, status: StorefrontDocStatus) {
    return prisma.storefrontTheme.delete({
        where: {
            storeId_status: {
                storeId,
                status,
            },
        },
    });
}

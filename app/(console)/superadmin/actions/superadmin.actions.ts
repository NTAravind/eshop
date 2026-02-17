'use server';

import prisma from '@/lib/prisma';
import * as subscriptionService from '@/services/subscription.service';
import * as subscriptionDal from '@/dal/subscription.dal';
import { PlanType, BillingCycle, SubscriptionStatus } from '@/app/generated/prisma';
import { revalidatePath } from 'next/cache';

// ==========================================
// CREATE CLIENT
// ==========================================

export interface CreateClientInput {
    name: string;
    ownerEmail: string;
}

export interface CreateClientResult {
    success: boolean;
    accountId?: string;
    error?: string;
}

export async function createClientAction(
    data: CreateClientInput
): Promise<CreateClientResult> {
    try {
        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email: data.ownerEmail },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: data.ownerEmail,
                    name: data.name,
                },
            });
        }

        // Create billing account with owner
        const account = await subscriptionService.createAccountForUser(
            user.id,
            data.name
        );

        // Initialize FREE subscription
        await subscriptionService.initializeFreeSubscription(account.id);

        revalidatePath('/superadmin');

        return {
            success: true,
            accountId: account.id,
        };
    } catch (error: any) {
        console.error('Create client error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create client',
        };
    }
}

// ==========================================
// ASSIGN SUBSCRIPTION
// ==========================================

export interface AssignSubscriptionInput {
    accountId?: string;
    userEmail?: string;
    planType: PlanType;
    billingCycle: BillingCycle;
}

export interface AssignSubscriptionResult {
    success: boolean;
    subscriptionId?: string;
    error?: string;
}

export async function assignSubscriptionAction(
    data: AssignSubscriptionInput
): Promise<AssignSubscriptionResult> {
    try {
        let targetAccountId = data.accountId;

        // Resolve account ID from email if provided
        if (data.userEmail && !targetAccountId) {
            const user = await prisma.user.findUnique({
                where: { email: data.userEmail },
                include: {
                    ownedAccounts: {
                        where: { role: 'OWNER' }, // Assuming we want the account they own
                        take: 1
                    }
                }
            });

            if (!user) {
                return { success: false, error: `User with email ${data.userEmail} not found` };
            }

            if (user.ownedAccounts.length === 0) {
                // Auto-create billing account
                try {
                    const accountName = user.name ? `${user.name}'s Organization` : `${user.email.split('@')[0]}'s Organization`;
                    const newAccount = await subscriptionService.createAccountForUser(user.id, accountName);
                    targetAccountId = newAccount.id;

                    // Note: We don't initialize a FREE subscription here because the code below will assign the requested subscription
                } catch (err: any) {
                    return { success: false, error: `Failed to auto-create billing account: ${err.message}` };
                }
            } else {
                targetAccountId = user.ownedAccounts[0].accountId;
            }
        }

        if (!targetAccountId) {
            return { success: false, error: 'Account ID or User Email is required' };
        }

        // Get the plan
        const plan = await subscriptionDal.getPlanByType(data.planType);
        if (!plan) {
            return {
                success: false,
                error: `Plan ${data.planType} not found`,
            };
        }

        // Check if subscription exists
        const existingSubscription = await subscriptionDal.getSubscriptionByAccountId(
            targetAccountId
        );

        const startDate = new Date();
        const endDate = new Date(startDate);

        if (data.billingCycle === BillingCycle.MONTHLY) {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        if (existingSubscription) {
            // Update existing subscription
            await subscriptionDal.changeSubscriptionPlan(targetAccountId as string, plan.id);

            // Update billing cycle
            await prisma.accountSubscription.update({
                where: { accountId: targetAccountId as string },
                data: {
                    billingCycle: data.billingCycle,
                    currentPeriodStart: startDate,
                    currentPeriodEnd: endDate,
                    status: SubscriptionStatus.ACTIVE,
                },
            });

            revalidatePath('/superadmin');

            return {
                success: true,
                subscriptionId: existingSubscription.id,
            };
        } else {
            // Create new subscription
            const subscription = await prisma.accountSubscription.create({
                data: {
                    accountId: targetAccountId,
                    planId: plan.id,
                    billingCycle: data.billingCycle,
                    currentPeriodStart: startDate,
                    currentPeriodEnd: endDate,
                    status: SubscriptionStatus.ACTIVE,
                },
            });

            revalidatePath('/superadmin');

            return {
                success: true,
                subscriptionId: subscription.id,
            };
        }
    } catch (error: any) {
        console.error('Assign subscription error:', error);
        return {
            success: false,
            error: error.message || 'Failed to assign subscription',
        };
    }
}

// ==========================================
// CREATE STORE FOR CLIENT
// ==========================================

export interface CreateStoreForClientInput {
    accountId: string;
    storeName: string;
    slug: string;
}

export interface CreateStoreForClientResult {
    success: boolean;
    storeId?: string;
    error?: string;
}

export async function createStoreForClientAction(
    data: CreateStoreForClientInput
): Promise<CreateStoreForClientResult> {
    try {
        // Validate account exists
        const account = await subscriptionDal.getAccountById(data.accountId);
        if (!account) {
            return {
                success: false,
                error: 'Account not found',
            };
        }

        // Check if slug is available
        const existingStore = await prisma.store.findUnique({
            where: { slug: data.slug },
        });

        if (existingStore) {
            return {
                success: false,
                error: 'Store slug already exists',
            };
        }

        // Create store
        const store = await prisma.store.create({
            data: {
                accountId: data.accountId,
                name: data.storeName,
                slug: data.slug,
            },
        });

        // Increment usage counter
        await subscriptionDal.incrementUsage(data.accountId, 'storeCount', 1);

        revalidatePath('/superadmin');

        return {
            success: true,
            storeId: store.id,
        };
    } catch (error: any) {
        console.error('Create store error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create store',
        };
    }
}

// ==========================================
// PLANS MANAGEMENT
// ==========================================

export interface CreatePlanInput {
    name: string;
    type: PlanType;
    price: number;
    yearlyPrice?: number;
    maxStores?: number;
    maxProducts?: number;
    description?: string;
    isActive?: boolean;
}

export interface PlanResult {
    success: boolean;
    planId?: string;
    error?: string;
}

export async function createPlanAction(data: CreatePlanInput): Promise<PlanResult> {
    try {
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { type: data.type },
        });

        if (existingPlan) {
            return { success: false, error: `Plan type ${data.type} already exists` };
        }

        const plan = await prisma.subscriptionPlan.create({
            data: {
                ...data,
                isActive: data.isActive ?? true,
            },
        });

        revalidatePath('/superadmin/plans');
        return { success: true, planId: plan.id };
    } catch (error: any) {
        console.error('Create plan error:', error);
        return { success: false, error: error.message || 'Failed to create plan' };
    }
}

export async function updatePlanAction(id: string, data: Partial<CreatePlanInput>): Promise<PlanResult> {
    try {
        await prisma.subscriptionPlan.update({
            where: { id },
            data,
        });

        revalidatePath('/superadmin/plans');
        return { success: true, planId: id };
    } catch (error: any) {
        console.error('Update plan error:', error);
        return { success: false, error: error.message || 'Failed to update plan' };
    }
}

export async function deletePlanAction(id: string): Promise<PlanResult> {
    try {
        await prisma.subscriptionPlan.delete({
            where: { id },
        });

        revalidatePath('/superadmin/plans');
        return { success: true };
    } catch (error: any) {
        console.error('Delete plan error:', error);
        return { success: false, error: error.message || 'Failed to delete plan' };
    }
}

// ==========================================
// SUSPEND ACCOUNT
// ==========================================

export interface SuspendAccountResult {
    success: boolean;
    error?: string;
}

export async function suspendAccountAction(
    accountId: string
): Promise<SuspendAccountResult> {
    try {
        await subscriptionDal.updateSubscriptionStatus(
            accountId,
            SubscriptionStatus.CANCELED
        );

        revalidatePath('/superadmin');

        return { success: true };
    } catch (error: any) {
        console.error('Suspend account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to suspend account',
        };
    }
}

// ==========================================
// REACTIVATE ACCOUNT
// ==========================================

export interface ReactivateAccountResult {
    success: boolean;
    error?: string;
}

export async function reactivateAccountAction(
    accountId: string
): Promise<ReactivateAccountResult> {
    try {
        await subscriptionDal.updateSubscriptionStatus(
            accountId,
            SubscriptionStatus.ACTIVE
        );

        revalidatePath('/superadmin');

        return { success: true };
    } catch (error: any) {
        console.error('Reactivate account error:', error);
        return {
            success: false,
            error: error.message || 'Failed to reactivate account',
        };
    }
}

// ==========================================
// INVITE ACCOUNT USER
// ==========================================

export interface InviteAccountUserInput {
    accountId: string;
    email: string;
    role?: string;
}

export interface InviteAccountUserResult {
    success: boolean;
    invitation?: any;
    error?: string;
}

export async function inviteAccountUserAction(
    data: InviteAccountUserInput
): Promise<InviteAccountUserResult> {
    try {
        // We need the current user ID to send the invite
        // Since this is a server action, we can use auth()
        // But we need to import it.
        const { auth } = await import('@/lib/auth');
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        // Import service dynamically or statically?
        // Services are already imported as subscriptionService, subscriptionDal.
        // We need invitationService.
        const { inviteAccountUser } = await import('@/services/invitation.service');

        const invitation = await inviteAccountUser(
            session.user.id,
            data.accountId,
            data.email,
            data.role || 'OWNER'
        );

        revalidatePath('/superadmin');

        return { success: true, invitation };

    } catch (error: any) {
        console.error('Invite user error:', error);
        return {
            success: false,
            error: error.message || 'Failed to invite user',
        };
    }
}


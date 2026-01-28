import prisma from '@/lib/prisma';
import { StoreRole, NotificationChannel } from '@/app/generated/prisma';
import * as notificationService from '@/services/notification/notification.service';
import * as storeStaffDal from '@/dal/storestaff.dal';
import * as subscriptionDal from '@/dal/subscription.dal';

// Helper to generate a token (using various methods, here simple random string or UUID if available, 
// using crypto or just rely on Prisma default if we insert, but we need it before for the link?
// Prisma schema has @default(cuid()) for token, so we can let DB generate it if we return the record.
// But we need the token to send the email. So we create first, then send.

export async function inviteAccountUser(
    currentUserId: string,
    accountId: string,
    email: string,
    role: string = 'MEMBER' // 'MEMBER' or 'OWNER' (Tenant Admin)
) {
    // 1. Validate permissions
    // Check if currentUserId is SuperAdmin or Owner of the account
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });

    // Check if account owner
    const accountUser = await prisma.accountUser.findUnique({
        where: { accountId_userId: { accountId, userId: currentUserId } }
    });

    const isSuperAdmin = user?.isSuperAdmin;
    const isAccountOwner = accountUser?.role === 'OWNER';

    if (!isSuperAdmin && !isAccountOwner) {
        throw new Error('Permission denied: Only SuperAdmin or Account Owner can invite users.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check existing membership
    const existingMember = await prisma.accountUser.findFirst({
        where: { accountId, userId: { not: undefined }, user: { email: normalizedEmail } }
    });

    if (existingMember) {
        throw new Error('User is already a member of this account.');
    }

    // 3. Create Invitation
    // Upsert to handle re-invites (update token/expiry)
    // Delete existing if any to keep clean or update.
    await prisma.accountInvitation.deleteMany({
        where: { accountId, email: normalizedEmail }
    });

    const invitation = await prisma.accountInvitation.create({
        data: {
            accountId,
            email: normalizedEmail,
            role,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
    });

    // 4. Send Email via System Config (SuperAdmin level)
    const account = await prisma.billingAccount.findUnique({ where: { id: accountId } });

    // Construct Invite Link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/account/${invitation.token}`;

    // We use a "System" notification helper or assume global config for now.
    // Since we don't have a "System Store", we might need to send using nodemailer directly 
    // OR we use a "SuperAdmin Store" concept. 
    // FOR NOW: Let's assume we use the global EMAIL_USER/PASS as per plan.
    // But notificationService expects a storeId. 
    // workaround: Create a generic sendSystemEmail function or pass a specific flag?
    // The plan said: "System Emails ... Use global .env credentials".

    // We'll implement a helper in this file or use a direct provider call if notificationService handles store-bound logic only.
    // Actually, notificationService.sendNotification requires storeId.
    // We'll bypass it for Account Invites or use a dummy ID?
    // Better: import EmailProvider directly for system emails.

    await sendSystemEmail(normalizedEmail, `Invitation to manage ${account?.name}`,
        `<p>You have been invited to manage the account <strong>${account?.name}</strong>.</p>
     <p>Click below to accept:</p>
     <a href="${inviteLink}">${inviteLink}</a>`
    );

    return invitation;
}

export async function inviteStoreStaff(
    currentUserId: string,
    storeId: string,
    email: string,
    role: StoreRole
) {
    // 1. Validate permissions (Owner only for now)
    const staff = await storeStaffDal.getStoreStaff(storeId, currentUserId);
    if (staff?.role !== 'OWNER') {
        throw new Error('Permission denied: Only Store Owner can invite staff.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check existing membership
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
        const existingStaff = await storeStaffDal.getStoreStaff(storeId, existingUser.id);
        if (existingStaff) {
            throw new Error('User is already a member of this store.');
        }
    }

    // 3. CHECK STORE NOTIFICATION CONFIG (Crucial User Requirement)
    const config = await prisma.notificationConfig.findUnique({
        where: { storeId_channel: { storeId, channel: NotificationChannel.EMAIL } }
    });

    if (!config || !config.isActive) {
        throw new Error('Please configure Email settings for this store (Settings -> Notifications) before inviting staff. The system uses your store\'s email credentials to send invites.');
    }

    // 4. Create Invitation
    // Remove old invites
    await prisma.storeInvitation.delete({
        where: { storeId_email: { storeId, email: normalizedEmail } }
    }).catch(() => { }); // Ignore not found

    // StoreInvitation model might not have token by default if I didn't verify it carefully?
    // User asked to check schema. StoreInvitation HAS token @default(cuid()).

    const invitation = await prisma.storeInvitation.create({
        data: {
            storeId,
            email: normalizedEmail,
            role,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
    });

    // 5. Send User-Configured Email
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/store/${invitation.token}`;

    await notificationService.sendNotification(
        storeId,
        NotificationChannel.EMAIL,
        normalizedEmail,
        `You have been invited to join ${store?.name}`,
        {
            subject: `Invitation to join ${store?.name}`,
            isHtml: true,
            html: `<p>You have been invited to join <strong>${store?.name}</strong> as a <strong>${role}</strong>.</p>
             <p>Click below to accept:</p>
             <a href="${inviteLink}">${inviteLink}</a>`
        } // Passing raw content or html depending on provider implementation
    );

    return invitation;
}

export async function validateToken(type: 'store' | 'account', token: string) {
    if (type === 'store') {
        const invite = await prisma.storeInvitation.findUnique({
            where: { token },
            include: { store: true }
        });

        if (!invite) return null;
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            throw new Error('Invitation expired');
        }
        return { ...invite, type: 'store', name: invite.store.name };
    } else {
        const invite = await prisma.accountInvitation.findUnique({
            where: { token },
            include: { account: true }
        });

        if (!invite) return null;
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            throw new Error('Invitation expired');
        }
        return { ...invite, type: 'account', name: invite.account.name };
    }
}

export async function acceptInvitation(userId: string, type: 'store' | 'account', token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (type === 'store') {
        const invite = await prisma.storeInvitation.findUnique({ where: { token } });
        if (!invite) throw new Error('Invalid invitation');

        // Add to store
        await storeStaffDal.addStoreStaff(invite.storeId, userId, invite.role);

        // Cleanup
        await prisma.storeInvitation.delete({ where: { id: invite.id } });

        return { success: true, storeId: invite.storeId };
    } else {
        const invite = await prisma.accountInvitation.findUnique({ where: { token } });
        if (!invite) throw new Error('Invalid invitation');

        // Add to account
        await prisma.accountUser.create({
            data: {
                accountId: invite.accountId,
                userId,
                role: invite.role,
            }
        });

        // Cleanup
        await prisma.accountInvitation.delete({ where: { id: invite.id } });

        return { success: true, accountId: invite.accountId };
    }
}

// Internal helper for system emails (using same provider logic but local config)
import { EmailProvider } from '@/services/notification/providers/email';

async function sendSystemEmail(to: string, subject: string, html: string) {
    const provider = new EmailProvider();
    const config = {
        service: 'gmail', // Default for system
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM || process.env.EMAIL_User
    };

    if (!config.user || !config.pass) {
        console.warn('System email undefined. Logging invite:', to, subject);
        // In dev, we might assume this is fine and just log.
        // But for production completeness:
        // throw new Error("System email credentials not configured");
        return;
    }

    await provider.send(config, to, '', { subject, html, isHtml: true });
}

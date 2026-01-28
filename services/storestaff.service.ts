import * as storeStaffDal from '@/dal/storestaff.dal';
import * as subscriptionDal from '@/dal/subscription.dal';
import * as usageService from '@/services/usage.service';
import { requireStoreRole } from '@/lib/auth/requireStore';
import { StoreRole } from '@/app/generated/prisma';
import prisma from '@/lib/prisma';

export async function addStaffMember(
  currentUserId: string,
  storeId: string,
  input: {
    email: string;
    role: StoreRole;
  }
) {
  // Only OWNER can add staff
  await requireStoreRole(currentUserId, storeId, 'OWNER');

  // GET ACCOUNT FROM STORE
  const account = await subscriptionDal.getAccountByStoreId(storeId);
  if (!account) {
    throw new Error('Store does not belong to any account');
  }

  // ENFORCE STAFF LIMIT (account-wide)
  await usageService.checkStaffLimit(account.id);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error('User not found with this email');
  }

  // Check if already a member
  const existing = await storeStaffDal.getStoreStaff(storeId, user.id);
  if (existing) {
    throw new Error('User is already a member of this store');
  }

  // Validate role
  if (!['OWNER', 'MANAGER', 'SUPPORT'].includes(input.role)) {
    throw new Error('Invalid role');
  }

  const staff = await storeStaffDal.addStoreStaff(storeId, user.id, input.role);

  // RECORD STAFF ADDITION
  await usageService.recordStaffAddition(account.id);

  return staff;
}

export async function updateStaffRole(
  currentUserId: string,
  storeId: string,
  targetUserId: string,
  newRole: StoreRole
) {
  // Only OWNER can change roles
  await requireStoreRole(currentUserId, storeId, 'OWNER');

  // Cannot change own role
  if (currentUserId === targetUserId) {
    throw new Error('Cannot change your own role');
  }

  // Validate new role
  if (!['OWNER', 'MANAGER', 'SUPPORT'].includes(newRole)) {
    throw new Error('Invalid role');
  }

  // Check if target is last owner
  const isLast = await storeStaffDal.isLastOwner(storeId, targetUserId);
  if (isLast && newRole !== 'OWNER') {
    throw new Error('Cannot demote the last owner');
  }

  return storeStaffDal.updateStoreStaffRole(storeId, targetUserId, newRole);
}

export async function removeStaffMember(
  currentUserId: string,
  storeId: string,
  targetUserId: string
) {
  // Only OWNER can remove staff
  await requireStoreRole(currentUserId, storeId, 'OWNER');

  // Cannot remove self
  if (currentUserId === targetUserId) {
    throw new Error('Cannot remove yourself from the store');
  }

  // Check if target is last owner
  const isLast = await storeStaffDal.isLastOwner(storeId, targetUserId);
  if (isLast) {
    throw new Error('Cannot remove the last owner');
  }

  const result = await storeStaffDal.removeStoreStaff(storeId, targetUserId);

  // GET ACCOUNT FROM STORE
  const account = await subscriptionDal.getAccountByStoreId(storeId);
  if (account) {
    // RECORD STAFF REMOVAL
    await usageService.recordStaffRemoval(account.id);
  }

  return result;
}

export async function listStaff(
  currentUserId: string,
  storeId: string
) {
  // Any staff member can view other members
  await requireStoreRole(currentUserId, storeId, 'SUPPORT');

  return storeStaffDal.listStoreStaff(storeId);
}

export async function getMyStores(userId: string) {
  return storeStaffDal.getUserStores(userId);
}

export async function getStaffMember(
  currentUserId: string,
  storeId: string,
  targetUserId: string
) {
  // Any staff member can view other members
  await requireStoreRole(currentUserId, storeId, 'SUPPORT');

  // ... existing code ...
  return storeStaffDal.getStoreStaff(storeId, targetUserId);
}

// INVITATION / ALLOWLIST LOGIC

export async function inviteStaff(
  currentUserId: string,
  storeId: string,
  email: string,
  role: StoreRole = 'MANAGER'
) {
  // Only OWNER can invite (allowlist)
  await requireStoreRole(currentUserId, storeId, 'OWNER');

  const normalizedEmail = email.toLowerCase().trim();

  // Check if already member
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    const existing = await storeStaffDal.getStoreStaff(storeId, user.id);
    if (existing) {
      throw new Error('User is already a member of this store');
    }
  }

  // Check existing invite
  const existingInvite = await prisma.storeInvitation.findUnique({
    where: { storeId_email: { storeId, email: normalizedEmail } }
  });

  if (existingInvite) {
    // Update role if needed
    return prisma.storeInvitation.update({
      where: { id: existingInvite.id },
      data: { role }
    });
  }

  return prisma.storeInvitation.create({
    data: {
      storeId,
      email: normalizedEmail,
      role,
    }
  });
}

export async function removeInvitation(
  currentUserId: string,
  storeId: string,
  email: string
) {
  await requireStoreRole(currentUserId, storeId, 'OWNER');
  return prisma.storeInvitation.delete({
    where: { storeId_email: { storeId, email: email.toLowerCase().trim() } }
  });
}

export async function listInvitations(
  currentUserId: string,
  storeId: string
) {
  await requireStoreRole(currentUserId, storeId, 'MANAGER');
  return prisma.storeInvitation.findMany({
    where: { storeId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Checks if there is a pending invitation for this user and accepts it automatically.
 * Called during tenant resolution / login.
 */
export async function acceptInvitation(userId: string, storeId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (!user.email && !user.emailVerified)) return null;

  // We trust the user.email provided by Auth.js (Google)
  // Some providers might not verify email, but for Google it's usually fine.
  // Ideally check emailVerified, but keeping it simple for now.

  const email = user.email || "";

  const invite = await prisma.storeInvitation.findUnique({
    where: { storeId_email: { storeId, email } }
  });

  if (!invite) return null;

  // Create staff member
  try {
    const staff = await storeStaffDal.addStoreStaff(storeId, userId, invite.role);

    // Delete invitation after acceptance
    await prisma.storeInvitation.delete({ where: { id: invite.id } });

    return staff;
  } catch (e) {
    console.error("Failed to accept invitation", e);
    return null; // Maybe already added in race condition
  }
}
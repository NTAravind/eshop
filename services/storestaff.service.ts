import * as storeStaffDal from '@/dal/storestuff.dal';
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

  return storeStaffDal.getStoreStaff(storeId, targetUserId);
}
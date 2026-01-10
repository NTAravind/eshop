import { StoreRole } from '@/app/generated/prisma';

/**
 * Role hierarchy for permission checks
 */
export const ROLE_HIERARCHY: Record<StoreRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  SUPPORT: 1,
};

/**
 * Check if user role meets minimum required role
 */
export function hasMinimumRole(
  userRole: StoreRole,
  minimumRole: StoreRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if role can manage API keys and payment configs
 */
export function canManageApiKeys(role: StoreRole): boolean {
  return role === 'OWNER';
}

/**
 * Check if role can write (create/update/delete)
 */
export function canWrite(role: StoreRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

/**
 * Check if role can read
 */
export function canRead(role: StoreRole): boolean {
  return true; // All roles can read
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: StoreRole): string {
  const names: Record<StoreRole, string> = {
    OWNER: 'Owner',
    MANAGER: 'Manager',
    SUPPORT: 'Support',
  };
  return names[role];
}

/**
 * Get role permissions description
 */
export function getRolePermissions(role: StoreRole): string[] {
  const permissions: Record<StoreRole, string[]> = {
    OWNER: [
      'Full access to all features',
      'Manage API keys and payment configurations',
      'Manage store staff and roles',
      'View billing and subscription details',
      'Create, edit, and delete all resources',
    ],
    MANAGER: [
      'Create, edit, and delete products and orders',
      'Manage discounts and promotions',
      'View and update order status',
      'Access all reports and analytics',
      'Cannot manage API keys or payment settings',
    ],
    SUPPORT: [
      'Read-only access to all resources',
      'View products, orders, and customers',
      'View reports and analytics',
      'Cannot create, edit, or delete anything',
    ],
  };
  return permissions[role];
}

/**
 * Validate if a role transition is allowed
 */
export function canChangeRole(
  currentUserRole: StoreRole,
  targetUserCurrentRole: StoreRole,
  targetUserNewRole: StoreRole
): boolean {
  // Only OWNER can change roles
  if (currentUserRole !== 'OWNER') {
    return false;
  }

  // Cannot demote the last owner
  // (This check should be done in the service layer with actual count)
  
  return true;
}
export type AuthScope =
    | 'super_admin'
    | 'tenant_owner'
    | 'tenant_admin'
    | 'tenant_member'
    | 'store_owner'
    | 'store_manager'
    | 'store_support'
    | 'store_assignment_manage'; // Special scope for the task I just finished? 
// Stick to the core roles first.

export interface AuthContextValue {
    userId: string;
    email: string;
    isSuperAdmin: boolean;
    activeTenantId?: string;
    activeStoreId?: string;
    scopes: AuthScope[];
}

import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../binding-ast';
import { userProfileFormPrefab } from './prefabs/user-profile-form';

/**
 * Default profile page
 */
export const defaultProfilePage: StorefrontNode = {
    id: 'page_profile',
    type: 'Container',
    props: {},
    styleOverrides: {
        base: {
            padding: '2rem',
            maxWidth: '600px',
            margin: '0 auto',
        },
    },
    children: [
        {
            id: 'profile_header',
            type: 'Heading',
            props: {
                level: 1,
                text: 'My Profile',
            },
            styleOverrides: {
                base: {
                    marginBottom: '2rem',
                },
            },
        },
        {
            ...userProfileFormPrefab,
            bindingMap: {
                user: migrateStringBinding('user'),
                requirePhone: migrateStringBinding('store.requirePhoneNumber'),
                profileFields: migrateStringBinding('settings.profileFields'),
            },
        },
    ],
};

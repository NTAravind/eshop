import type { StorefrontNode } from '@/types/storefront-builder';

/**
 * Default profile page
 */
export const defaultProfilePage: StorefrontNode = {
    id: 'page_profile',
    type: 'Container',
    props: {},
    styles: {
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
            styles: {
                base: {
                    marginBottom: '2rem',
                },
            },
        },
        {
            id: 'profile_form',
            type: 'UserProfileForm',
            props: {},
            bindings: {
                user: 'user',
                requirePhone: 'store.requirePhoneNumber',
                profileFields: 'settings.profileFields',
            },
        },
    ],
};

import { StorefrontNode } from "@/types/storefront-builder";

export const userProfileFormPrefab: StorefrontNode = {
    id: 'UserProfileForm_default',
    type: 'UserProfileForm',
    props: {
        heading: 'Profile Settings',
        subheading: 'Update your personal information',
    },
    styleOverrides: {},
    children: [
        // Name Field
        {
            id: 'section_name',
            type: 'ProfileSection',
            props: {},
            children: [
                {
                    id: 'label_name',
                    type: 'ProfileLabel',
                    props: { text: 'Name' },
                    styleOverrides: {},
                },
                {
                    id: 'input_name',
                    type: 'ProfileInput',
                    props: { fieldName: 'name' },
                    styleOverrides: {},
                }
            ]
        },
        // Email Field (Read Only)
        {
            id: 'section_email',
            type: 'ProfileSection',
            props: {},
            children: [
                {
                    id: 'label_email',
                    type: 'ProfileLabel',
                    props: { text: 'Email' },
                    styleOverrides: {},
                },
                {
                    id: 'input_email',
                    type: 'ProfileInput',
                    props: { fieldName: 'email', readOnly: true },
                    styleOverrides: {
                        base: { backgroundColor: 'var(--muted)', cursor: 'not-allowed' }
                    },
                }
            ]
        },
        // Phone Field
        {
            id: 'section_phone',
            type: 'ProfileSection',
            props: {},
            children: [
                {
                    id: 'label_phone',
                    type: 'ProfileLabel',
                    props: { text: 'Phone Number' },
                    styleOverrides: {},
                },
                {
                    id: 'input_phone',
                    type: 'ProfileInput',
                    props: { fieldName: 'phone' },
                    styleOverrides: {},
                }
            ]
        },
        // Address Section
        {
            id: 'section_address',
            type: 'ProfileSection',
            props: {},
            styleOverrides: {
                base: { borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }
            },
            children: [
                {
                    id: 'label_address_heading',
                    type: 'ProfileLabel',
                    props: { text: 'Address' },
                    styleOverrides: { base: { fontWeight: '600', fontSize: '1rem' } },
                },
                {
                    id: 'input_addr1',
                    type: 'ProfileInput',
                    props: { fieldName: 'addressLine1', placeholder: 'Address line 1' },
                    styleOverrides: { base: { marginBottom: '0.75rem' } },
                },
                {
                    id: 'input_addr2',
                    type: 'ProfileInput',
                    props: { fieldName: 'addressLine2', placeholder: 'Address line 2' },
                    styleOverrides: { base: { marginBottom: '0.75rem' } },
                },
                {
                    id: 'container_city_state',
                    type: 'Container',
                    props: {},
                    styleOverrides: { base: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' } },
                    children: [
                        {
                            id: 'input_city',
                            type: 'ProfileInput',
                            props: { fieldName: 'city', placeholder: 'City' },
                        },
                        {
                            id: 'input_state',
                            type: 'ProfileInput',
                            props: { fieldName: 'state', placeholder: 'State / Region' },
                        }
                    ]
                },
                {
                    id: 'container_zip_country',
                    type: 'Container',
                    props: {},
                    styleOverrides: { base: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' } },
                    children: [
                        {
                            id: 'input_postal',
                            type: 'ProfileInput',
                            props: { fieldName: 'postalCode', placeholder: 'Postal Code' },
                        },
                        {
                            id: 'input_country',
                            type: 'ProfileInput',
                            props: { fieldName: 'country', placeholder: 'Country' },
                        }
                    ]
                }
            ]
        },
        // Submit Button
        {
            id: 'submit_btn',
            type: 'ProfileSubmitButton',
            props: { label: 'Save Changes' },
            styleOverrides: {},
        }
    ]
};

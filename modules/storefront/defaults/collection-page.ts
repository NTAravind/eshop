import type { StorefrontNode } from '@/types/storefront-builder';
import { migrateStringBinding } from '../binding-ast';

/**
 * Default collection/shop page with filters and product grid
 */
export const defaultCollectionPage: StorefrontNode = {
    id: 'page_collection',
    type: 'Container',
    props: {},
    children: [
        {
            id: 'collection_header',
            type: 'Section',
            props: {},
            styleOverrides: {
                base: {
                    padding: '2rem',
                    backgroundColor: 'var(--muted)',
                },
            },
            children: [
                {
                    id: 'collection_title',
                    type: 'Heading',
                    props: {
                        level: 1,
                        text: 'All Products',
                    },
                },
                {
                    id: 'collection_breadcrumb',
                    type: 'Breadcrumb',
                    props: {
                        items: [
                            { label: 'Home', href: '/' },
                            { label: 'Shop', href: '/collection' },
                        ],
                    },
                },
            ],
        },
        {
            id: 'collection_main',
            type: 'Row',
            props: {},
            styleOverrides: {
                base: {
                    display: 'flex',
                    gap: '2rem',
                    padding: '2rem',
                },
            },
            children: [
                // Sidebar filters
                {
                    id: 'collection_sidebar',
                    type: 'Column',
                    props: {},
                    styleOverrides: {
                        base: {
                            width: '280px',
                            flexShrink: 0,
                            display: 'none',
                        },
                        md: {
                            display: 'block',
                        },
                    },
                    children: [
                        {
                            id: 'filter_menu',
                            type: 'CollectionFilters',
                            props: {},
                            bindingMap: {
                                facets: migrateStringBinding('facets.facets'),
                                activeFilters: migrateStringBinding('uiState.activeFilters'),
                            },
                        },
                    ],
                },
                // Product grid
                {
                    id: 'collection_content',
                    type: 'Column',
                    props: {},
                    styleOverrides: {
                        base: {
                            flex: 1,
                        },
                    },
                    children: [
                        {
                            id: 'collection_toolbar',
                            type: 'Row',
                            props: {},
                            styleOverrides: {
                                base: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1.5rem',
                                },
                            },
                            children: [
                                {
                                    id: 'collection_count',
                                    type: 'Text',
                                    props: {
                                        text: 'Showing products',
                                    },
                                    bindingMap: {
                                        text: migrateStringBinding('collection.total'),
                                    },
                                },
                                {
                                    id: 'collection_sort',
                                    type: 'CollectionSort',
                                    props: {},
                                },
                            ],
                        },
                        {
                            id: 'collection_grid',
                            type: 'ProductGrid',
                            props: {
                                columns: 3,
                            },
                            bindingMap: {
                                products: migrateStringBinding('collection.products'),
                            },
                        },
                    ],
                },
            ],
        },
    ],
};

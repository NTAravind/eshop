'use client';

/**
 * Main Editor Layout for the Storefront Builder
 * Composes TopBar, Left Sidebar (Palette/Layers), Canvas, and Right Panel (Inspector)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { TopBar } from './TopBar';
import { ComponentPalette, PaletteItemPreview } from './ComponentPalette';
import { LayerTree } from './LayerTree';
import { Canvas } from './Canvas';
import { BottomBar } from './bottom-bar/BottomBar';
import { Inspector } from './Inspector';
import { useEditorStore } from '@/modules/builder/editor-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Box, Layers, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import type {
    ComponentDefinition,
    StorefrontNode,
    ThemeVars,
    ProductContext,
    CartContext,
    FacetsContext,
} from '@/types/storefront-builder';
import { getRegistry, initializeRegistry } from '@/modules/storefront/registry/init';
import { Renderer } from '@/modules/storefront/runtime/renderer';
import { RuntimeContextProvider } from '@/modules/storefront/runtime/context';
import { handleKeyboardShortcut } from '@/modules/builder/keyboard';
import { useAutoSave } from '@/modules/builder/useAutoSave';
import { SelectionBreadcrumb } from '@/modules/builder/components/SelectionBreadcrumb';
import { useValidationStore } from '@/modules/builder/stores/validation-store';

interface EditorLayoutProps {
    storeId: string;
    documentId: string;
    documentKey: string;
    documentKind: 'LAYOUT' | 'PAGE' | 'TEMPLATE' | 'PREFAB';
    initialTree: StorefrontNode;

    initialTheme?: ThemeVars;
    onSave: (tree: StorefrontNode, theme: ThemeVars) => Promise<void>;
    onPublish: (tree: StorefrontNode, theme: ThemeVars) => Promise<void>;
    onGenerate: () => Promise<void>;
    store: {
        id: string;
        name: string;
        slug: string;
        currency: string;
    };
    previewData?: {
        products: ProductContext[];
        defaultProduct?: ProductContext;
        prefabs?: Record<string, StorefrontNode>;
    };
}

/**
 * Isolated component that subscribes to tree from the store.
 * This prevents EditorLayout from re-rendering on every tree mutation.
 * Only the canvas content re-renders when the tree changes.
 */
const CanvasRenderer = React.memo(function CanvasRenderer({
    store,
    mockContext,
    selectedPreviewProduct,
    previewData,
    previewFacets,
}: {
    store: { id: string; name: string; slug: string; currency: string };
    mockContext: {
        store: { id: string; name: string; slug: string; currency: string };
        settings: Record<string, unknown>;
        user: null;
        cart: CartContext | null;
        route: { pathname: string; searchParams: Record<string, string>; params: Record<string, string> };
        uiState: Record<string, unknown>;
    };
    selectedPreviewProduct?: ProductContext;
    previewData?: {
        products: ProductContext[];
        defaultProduct?: ProductContext;
        prefabs?: Record<string, StorefrontNode>;
    };
    previewFacets?: FacetsContext;
}) {
    const tree = useEditorStore((s) => s.tree);

    if (!tree) return null;

    return (
        <RuntimeContextProvider
            store={{
                ...store,
                requirePhoneNumber: false,
            }}
            settings={mockContext.settings}
            user={mockContext.user}
            cart={mockContext.cart}
            routeData={mockContext.route}
            pageData={{
                product: selectedPreviewProduct,
                collection: previewData?.products
                    ? {
                        products: previewData.products,
                        total: previewData.products.length,
                        page: 1,
                        pageSize: previewData.products.length,
                        totalPages: 1,
                    }
                    : undefined,
                facets: previewFacets,
                prefabs: previewData?.prefabs,
            }}
        >
            <div className="min-h-full relative" data-node-id={tree.id}>
                <Renderer tree={tree} />
            </div>
        </RuntimeContextProvider>
    );
});

CanvasRenderer.displayName = 'CanvasRenderer';

export function EditorLayout({
    storeId,
    documentId,
    documentKey,
    documentKind,
    initialTree,
    initialTheme,
    onSave,
    onPublish,
    onGenerate,
    store,
    previewData,
}: EditorLayoutProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeDragType, setActiveDragType] = useState<string | null>(null);

    // NOTE: tree and theme are NOT subscribed here to avoid full re-renders.
    // CanvasRenderer subscribes to tree internally.
    // handleSave/handlePublish use getState() for fresh values.
    const mode = useEditorStore((s) => s.mode);
    const leftPanelCollapsed = useEditorStore((s) => s.leftPanelCollapsed);
    const rightPanelCollapsed = useEditorStore((s) => s.rightPanelCollapsed);
    const activeLeftTab = useEditorStore((s) => s.activeLeftTab);
    const loadDocument = useEditorStore((s) => s.loadDocument);
    const insertNode = useEditorStore((s) => s.insertNode);
    const toggleLeftPanel = useEditorStore((s) => s.toggleLeftPanel);
    const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel);
    const setActiveLeftTab = useEditorStore((s) => s.setActiveLeftTab);
    const setDirty = useEditorStore((s) => s.setDirty);
    const setTheme = useEditorStore((s) => s.setTheme);
    const previewProductId = useEditorStore((s) => s.previewProductId);
    const setPreviewProductId = useEditorStore((s) => s.setPreviewProductId);

    // Set initial preview product
    React.useEffect(() => {
        if (previewData?.defaultProduct && !previewProductId) {
            setPreviewProductId(previewData.defaultProduct.id);
        }
    }, [previewData, previewProductId, setPreviewProductId]);

    // Get currently selected preview product
    const selectedPreviewProduct = React.useMemo(() => {
        if (!previewData?.products) return undefined;
        return previewData.products.find(p => p.id === previewProductId) || previewData.defaultProduct;
    }, [previewData, previewProductId]);

    // Track loaded document to prevent re-loading on revalidation
    const loadedDocIdRef = React.useRef<string | null>(null);

    // Load document on mount
    React.useEffect(() => {
        // If we have already loaded this document, don't reload it from props
        // This prevents the store from resetting (clearing selection/history) when
        // revalidatePath() triggers a server component refresh after save.
        if (loadedDocIdRef.current === documentId) return;

        loadDocument(documentId, documentKind, documentKey, initialTree);
        if (initialTheme) {
            setTheme(initialTheme);
        }

        loadedDocIdRef.current = documentId;
    }, [documentId, documentKind, documentKey, initialTree, initialTheme, loadDocument, setTheme]);

    // Validation subscription
    const runValidation = useValidationStore((s) => s.runValidation);
    const autoValidateEnabled = useValidationStore((s) => s.autoValidateEnabled);

    useEffect(() => {
        if (!autoValidateEnabled) return;

        // Initial check
        const { tree } = useEditorStore.getState();
        if (tree) runValidation(tree, undefined);

        // Subscribe to changes
        return useEditorStore.subscribe((state, prevState) => {
            if (state.tree !== prevState.tree) {
                if (state.tree) {
                    runValidation(state.tree, undefined);
                }
            }
        });
    }, [autoValidateEnabled, runValidation]);


    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    // Get component registry
    const registry = React.useMemo(() => {
        try {
            initializeRegistry();
            return getRegistry();
        } catch {
            return {
                components: {} as Record<string, ComponentDefinition>,
                implementations: {}
            };
        }
    }, []);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (event.active.data.current?.source === 'palette') {
            setActiveDragType(String(event.active.data.current.type));
        }
    }, []);

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragType(null);
        const { active, over } = event;

        // Use getState() to avoid re-render dependency on tree
        const currentTree = useEditorStore.getState().tree;
        if (!over || !currentTree) return;

        const dragData = active.data.current;
        const dropData = over.data.current;

        // If dropping from palette to canvas
        if (dragData?.source === 'palette' && dropData?.type === 'canvas') {
            const componentType = String(dragData.type);
            const definition = registry.components[componentType];

            if (definition) {
                // Create new node from defaults
                const newNode: StorefrontNode = {
                    id: `${componentType}_${Date.now()}`,
                    type: componentType,
                    props: { ...definition.defaults.props },
                    styleOverrides: definition.defaults.styleOverrides ? { ...definition.defaults.styleOverrides } : undefined,
                    children: definition.defaults.children ? [...definition.defaults.children] : undefined,
                };

                const { hoveredNodeId, zoom } = useEditorStore.getState();
                const targetParentId = hoveredNodeId || currentTree.id;

                // Calculate drop position if we have mouse event
                const currentRect = active.rect.current;
                const dragRect = currentRect ? (currentRect.translated || currentRect.initial) : null;
                const rootElement = document.querySelector(`[data-node-id="${currentTree.id}"]`);

                // Check if target is root
                const isRootDrop = targetParentId === currentTree.id;

                if (dragRect && rootElement && isRootDrop) {
                    const rect = rootElement.getBoundingClientRect();
                    const scale = zoom / 100;

                    const dropX = dragRect.left + dragRect.width / 2;
                    const dropY = dragRect.top + dragRect.height / 2;
                    const relativeX = (dropX - rect.left) / scale;
                    const relativeY = (dropY - rect.top) / scale;

                    newNode.styleOverrides = {
                        ...newNode.styleOverrides,
                        base: {
                            ...newNode.styleOverrides?.base,
                            position: 'absolute',
                            left: `${Math.round(relativeX)}px`,
                            top: `${Math.round(relativeY)}px`,
                        } as any
                    };
                } else {
                    if (newNode.styleOverrides?.base?.position === 'absolute') {
                        const { position, left, top, ...restBase } = newNode.styleOverrides.base as any || {};
                        if (newNode.styleOverrides.base) {
                            newNode.styleOverrides.base = restBase;
                        }
                    }
                }

                insertNode(targetParentId, newNode);
            }
        }
    }, [registry.components, insertNode]);

    // Handle save
    const handleSave = useCallback(async () => {
        // Use getState() to get fresh tree/theme without re-render dependency
        const { tree: currentTree, theme: currentTheme } = useEditorStore.getState();
        if (!currentTree) return;
        setIsSaving(true);
        try {
            await onSave(currentTree, currentTheme);
            setDirty(false);
        } finally {
            setIsSaving(false);
        }
    }, [onSave, setDirty]);

    // Keyboard shortcuts
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            handleKeyboardShortcut(e, { onSave: handleSave });
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleSave]);

    // Auto-save (debounced, 3s after last change)
    useAutoSave({ onSave: handleSave, intervalMs: 3000 });

    // Handle publish
    const handlePublish = useCallback(async () => {
        const { tree: currentTree, theme: currentTheme } = useEditorStore.getState();
        if (!currentTree) return;
        setIsPublishing(true);
        try {
            await onPublish(currentTree, currentTheme);
        } finally {
            setIsPublishing(false);
        }
    }, [onPublish]);

    // Handle generate
    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
            await onGenerate();
        } finally {
            setIsGenerating(false);
        }
    }, [onGenerate]);

    const previewFacets = React.useMemo<FacetsContext | undefined>(() => {
        if (!previewData?.products?.length) return undefined;

        const schemaIds = new Set<string>();
        const categoryIds = new Set<string>();

        previewData.products.forEach((product) => {
            if (product.productSchemaId) schemaIds.add(product.productSchemaId);
            if (product.categoryId) categoryIds.add(product.categoryId);
        });

        const facets = [] as FacetsContext['facets'];

        if (schemaIds.size > 1) {
            facets.push({
                id: 'facet_schemaId',
                code: 'schemaId',
                name: 'Product Type',
                values: Array.from(schemaIds).map((schemaId) => ({
                    id: `schemaId:${schemaId}`,
                    value: schemaId,
                    label: schemaId,
                })),
            });
        }

        if (categoryIds.size > 0) {
            facets.push({
                id: 'facet_category',
                code: 'category',
                name: 'Category',
                values: Array.from(categoryIds).map((categoryId) => ({
                    id: `category:${categoryId}`,
                    value: categoryId,
                    label: categoryId,
                })),
            });
        }

        if (facets.length === 0) {
            facets.push({
                id: 'facet_preview',
                code: 'category',
                name: 'Category',
                values: [
                    { id: 'category:all', value: 'all', label: 'All' },
                    { id: 'category:featured', value: 'featured', label: 'Featured' },
                ],
            });
        }

        return { facets };
    }, [previewData]);

    const previewCart = React.useMemo<CartContext | null>(() => {
        const product = selectedPreviewProduct ?? previewData?.products?.[0];
        const variant = product?.variants?.[0];
        if (!product || !variant) return null;

        const lineTotal = variant.price;

        return {
            id: 'preview-cart',
            items: [
                {
                    id: `preview-item-${product.id}`,
                    variantId: variant.id,
                    quantity: 1,
                    product,
                    variant,
                    lineTotal,
                },
            ],
            subtotal: lineTotal,
            total: lineTotal,
            currency: store.currency,
            itemCount: 1,
        };
    }, [previewData, selectedPreviewProduct, store.currency]);

    // Mock runtime context for preview
    const mockContext = React.useMemo(() => ({
        store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            currency: store.currency,
            // requirePhoneNumber: false, // Moved to RuntimeContextProvider directly
        },
        settings: {},
        user: null,
        cart: previewCart,
        route: {
            pathname: store.slug ? `/store/${store.slug}/collection` : '/collection',
            searchParams: {},
            params: {},
        },
        uiState: {},
    }), [previewCart, store]);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="h-screen flex flex-col bg-background">
                {/* Top Bar */}
                <TopBar
                    documentName={documentKey}
                    storeSlug={store.slug}
                    onSave={handleSave}
                    onPublish={handlePublish}
                    onGenerate={handleGenerate}
                    isSaving={isSaving}
                    isPublishing={isPublishing}
                    isGenerating={isGenerating}
                    previewProducts={previewData?.products}
                />

                {/* Main Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar */}
                    <div
                        className={cn(
                            'border-r bg-background transition-all duration-200',
                            leftPanelCollapsed ? 'w-0' : 'w-64'
                        )}
                    >
                        {!leftPanelCollapsed && (
                            <div className="h-full flex flex-col">
                                <div className="border-b p-1 flex gap-1">
                                    <Button
                                        variant={activeLeftTab === 'components' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="flex-1 gap-1"
                                        onClick={() => setActiveLeftTab('components')}
                                    >
                                        <Box className="h-4 w-4" />
                                        Components
                                    </Button>
                                    <Button
                                        variant={activeLeftTab === 'layers' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="flex-1 gap-1"
                                        onClick={() => setActiveLeftTab('layers')}
                                    >
                                        <Layers className="h-4 w-4" />
                                        Layers
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1">
                                    {activeLeftTab === 'components' ? (
                                        <ComponentPalette components={registry.components} />
                                    ) : (
                                        <LayerTree prefabs={previewData?.prefabs} />
                                    )}
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    {/* Left Panel Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-16 w-4 rounded-l-none border border-l-0"
                        onClick={toggleLeftPanel}
                    >
                        <PanelLeftClose className={cn('h-4 w-4', leftPanelCollapsed && 'rotate-180')} />
                    </Button>

                    {/* Canvas */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <SelectionBreadcrumb />
                        <Canvas>
                            <CanvasRenderer
                                store={store}
                                mockContext={mockContext}
                                selectedPreviewProduct={selectedPreviewProduct}
                                previewData={previewData}
                                previewFacets={previewFacets}
                            />
                        </Canvas>
                    </div>

                    {/* Right Panel Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-16 w-4 rounded-r-none border border-r-0"
                        onClick={toggleRightPanel}
                    >
                        <PanelRightClose className={cn('h-4 w-4', rightPanelCollapsed && 'rotate-180')} />
                    </Button>

                    {/* Right Sidebar (Inspector) */}
                    <div
                        className={cn(
                            'border-l bg-background transition-all duration-200',
                            rightPanelCollapsed ? 'w-0' : 'w-72'
                        )}
                    >
                        {!rightPanelCollapsed && (
                            <ScrollArea className="h-full">
                                <Inspector onSaveTheme={handleSave} prefabs={previewData?.prefabs} />
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </div>
            <DragOverlay>
                {activeDragType && registry.components[activeDragType] ? (
                    <div className="opacity-80 rotate-3 cursor-grabbing">
                        <PaletteItemPreview
                            type={activeDragType}
                            displayName={registry.components[activeDragType].displayName}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

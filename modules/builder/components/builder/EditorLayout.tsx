'use client';

/**
 * Main Editor Layout for the Storefront Builder
 * Composes TopBar, Left Sidebar (Palette/Layers), Canvas, and Right Panel (Inspector)
 */

import React, { useCallback, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { TopBar } from './TopBar';
import { ComponentPalette } from './ComponentPalette';
import { LayerTree } from './LayerTree';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import { useEditorStore } from '@/lib/builder/editor-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Box, Layers, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComponentDefinition, StorefrontNode, ThemeVars, ProductContext } from '@/types/storefront-builder';
import { getRegistry, initializeRegistry } from '@/lib/storefront/registry/init';
import { Renderer } from '@/lib/storefront/runtime/renderer';
import { RuntimeContextProvider } from '@/lib/storefront/runtime/context';

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
    };
}

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

    const tree = useEditorStore((s) => s.tree);
    const theme = useEditorStore((s) => s.theme);
    const mode = useEditorStore((s) => s.mode);
    const leftPanelCollapsed = useEditorStore((s) => s.leftPanelCollapsed);
    const rightPanelCollapsed = useEditorStore((s) => s.rightPanelCollapsed);
    const activeLeftTab = useEditorStore((s) => s.activeLeftTab);
    const {
        loadDocument,
        insertNode,
        toggleLeftPanel,
        toggleRightPanel,
        setActiveLeftTab,
        setDirty,
        setTheme,
    } = useEditorStore();

    // Load document on mount
    React.useEffect(() => {
        loadDocument(documentId, documentKind, documentKey, initialTree);
        if (initialTheme) {
            setTheme(initialTheme);
        }
    }, [documentId, documentKind, documentKey, initialTree, initialTheme, loadDocument, setTheme]);

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

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || !tree) return;

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
                    styles: definition.defaults.styles ? { ...definition.defaults.styles } : undefined,
                    children: definition.defaults.children ? [...definition.defaults.children] : undefined,
                };

                insertNode(tree.id, newNode);
            }
        }
    }, [tree, registry.components, insertNode]);

    // Handle save
    const handleSave = useCallback(async () => {
        if (!tree) return;
        setIsSaving(true);
        try {
            await onSave(tree, theme);
            setDirty(false);
        } finally {
            setIsSaving(false);
        }
    }, [tree, theme, onSave, setDirty]);

    // Handle publish
    const handlePublish = useCallback(async () => {
        if (!tree) return;
        setIsPublishing(true);
        try {
            await onPublish(tree, theme);
        } finally {
            setIsPublishing(false);
        }
    }, [tree, theme, onPublish]);

    // Handle generate
    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);
        try {
            await onGenerate();
        } finally {
            setIsGenerating(false);
        }
    }, [onGenerate]);

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
        cart: null,
        route: {
            pathname: '/',
            searchParams: {},
            params: {},
        },
        uiState: {},
    }), [store]);

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="h-screen flex flex-col bg-background">
                {/* Top Bar */}
                <TopBar
                    documentName={documentKey}
                    onSave={handleSave}
                    onPublish={handlePublish}
                    onGenerate={handleGenerate}
                    isSaving={isSaving}
                    isPublishing={isPublishing}
                    isGenerating={isGenerating}
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
                                        <LayerTree />
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
                    <Canvas>
                        {tree && (
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
                                    product: previewData?.defaultProduct,
                                    collection: previewData?.products
                                        ? {
                                            products: previewData.products,
                                            total: previewData.products.length,
                                            page: 1,
                                            pageSize: previewData.products.length,
                                            totalPages: 1,
                                        }
                                        : undefined,
                                }}
                            >
                                <div className="min-h-full" data-node-id={tree.id}>
                                    <Renderer tree={tree} />
                                </div>
                            </RuntimeContextProvider>
                        )}
                    </Canvas>

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
                                <Inspector />
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </div>
        </DndContext>
    );
}

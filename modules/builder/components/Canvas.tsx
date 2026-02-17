'use client';

/**
 * Canvas for the Storefront Builder
 * Renders the document tree with selection overlay
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useDroppable, useDndMonitor, DragOverlay } from '@dnd-kit/core';
import { cn } from '@/shared/utils';
import { useEditorStore, selectSelectedNode } from '@/modules/builder/editor-store';
import type { StorefrontNode, DeviceType } from '@/types/storefront-builder';
import { generateThemeStyleObject } from '@/modules/storefront/theme';
import { calculateSnap, getSiblingRects, type SnapLine } from '@/modules/builder/snapping';
import { InlineTextEditor, EDITABLE_COMPONENTS } from './InlineTextEditor';
import { findNodeById } from '@/shared/utils/tree';

interface CanvasProps {
    children?: React.ReactNode;
}

const CanvasContent = React.memo(function CanvasContent({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
});

CanvasContent.displayName = 'CanvasContent';

// Device width presets
const deviceWidths: Record<DeviceType, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
};

export function Canvas({ children }: CanvasProps) {
    const mode = useEditorStore((s) => s.mode);
    const device = useEditorStore((s) => s.device);
    const zoom = useEditorStore((s) => s.zoom);
    // tree is NOT subscribed here to prevent re-renders. theme IS subscribed for live preview.
    const theme = useEditorStore((s) => s.theme);
    const select = useEditorStore((s) => s.select);
    const selectPath = useEditorStore((s) => s.selectPath);
    const setHoveredNode = useEditorStore((s) => s.setHoveredNode);
    const setZoom = useEditorStore((s) => s.setZoom);
    const hoveredNodeIdRef = useRef<string | null>(useEditorStore.getState().hoveredNodeId);
    const hoverRafRef = useRef<number | null>(null);
    const pendingHoverRef = useRef<string | null>(null);

    // Pan state
    const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
    const pan = useEditorStore((s) => s.pan);
    const setPan = useEditorStore((s) => s.setPan);
    // Local isPanning state is fine
    const [isPanning, setIsPanning] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const panLayerRef = useRef<HTMLDivElement>(null);
    const scaleLayerRef = useRef<HTMLDivElement>(null);
    const commitTimerRef = useRef<number | null>(null);
    const interactionRef = useRef(false);
    const zoomFrameRef = useRef<number | null>(null);
    const pendingZoomRef = useRef<number | null>(null);
    const [scale, setScale] = useState(zoom / 100);
    const [displayZoom, setDisplayZoom] = useState(zoom);
    const [isDragging, setIsDragging] = useState(false);

    // Inline editing state
    // tree is NOT subscribed here.
    const [editingNode, setEditingNode] = useState<StorefrontNode | null>(null);

    // Generate CSS variables from theme using the centralized mapper
    const themeStyles = React.useMemo(() => {
        return generateThemeStyleObject(theme);
    }, [theme]);

    useEffect(() => {
        const unsubscribe = useEditorStore.subscribe((state) => {
            hoveredNodeIdRef.current = state.hoveredNodeId;
        });
        return unsubscribe;
    }, []);

    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-root',
        data: {
            type: 'canvas',
        },
    });

    useDndMonitor({
        onDragStart: () => {
            setIsDragging(true);
        },
        onDragMove: (event) => {
            // Manual hit-testing for drop targets since nodes aren't droppables
            const { active, activatorEvent } = event;
            let clientX, clientY;

            // Try to get coordinates from activator event (mouse/touch)
            if (activatorEvent instanceof MouseEvent || activatorEvent instanceof TouchEvent) {
                clientX = activatorEvent instanceof MouseEvent ? activatorEvent.clientX : activatorEvent.touches[0].clientX;
                clientY = activatorEvent instanceof MouseEvent ? activatorEvent.clientY : activatorEvent.touches[0].clientY;
            } else {
                // Fallback to center of dragged item
                const rect = active.rect.current.translated;
                if (rect) {
                    clientX = rect.left + rect.width / 2;
                    clientY = rect.top + rect.height / 2;
                }
            }

            if (clientX !== undefined && clientY !== undefined) {
                const element = document.elementFromPoint(clientX, clientY);
                const nodeElement = element?.closest('[data-node-id]');
                if (nodeElement) {
                    const nodeId = nodeElement.getAttribute('data-node-id');
                    if (nodeId !== hoveredNodeIdRef.current) {
                        setHoveredNode(nodeId);
                    }
                } else if (hoveredNodeIdRef.current) {
                    setHoveredNode(null);
                }
            }
        },
        onDragEnd: () => {
            setIsDragging(false);
            setHoveredNode(null);
        },
        onDragCancel: () => {
            setIsDragging(false);
            setHoveredNode(null);
        }
    });

    const containerWidth = deviceWidths[device];

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (mode !== 'edit' || isPanning) return;

        const target = e.target as HTMLElement;

        // Ignore clicks originating from selection overlays/handles
        if (target.closest('[data-builder-ignore-click]')) return;

        // Check for prefab instance first
        const prefabElement = target.closest('[data-prefab-instance-id]');
        if (prefabElement) {
            const instanceId = prefabElement.getAttribute('data-prefab-instance-id');
            const childId = target.closest('[data-prefab-child-id]')?.getAttribute('data-prefab-child-id');

            if (instanceId) {
                e.stopPropagation();
                select(instanceId, childId);
                return;
            }
        }

        // Find the closest node element
        const nodeElement = target.closest('[data-node-id]');

        if (nodeElement) {
            e.stopPropagation();
            const nodeId = nodeElement.getAttribute('data-node-id');
            select(nodeId);
        }
    };

    const handleCanvasClickCapture = (e: React.MouseEvent) => {
        if (mode !== 'edit') return;
        if (isPanning) return;

        const target = e.target as HTMLElement;

        // Ignore clicks originating from selection overlays/handles
        if (target.closest('[data-builder-ignore-click]')) return;
        const nodeElement = target.closest('[data-node-id]');

        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            select(nodeId);
        }

        e.preventDefault();
        e.stopPropagation();
    };

    const handleCanvasDoubleClick = (e: React.MouseEvent) => {
        if (mode !== 'edit' || isPanning) return;

        const target = e.target as HTMLElement;
        const nodeElement = target.closest('[data-node-id]');

        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            if (!nodeId) return;

            const currentTree = useEditorStore.getState().tree;
            if (!currentTree) return;

            // Find node to check type
            const node = findNodeById(currentTree, nodeId);
            if (node && EDITABLE_COMPONENTS[node.type]) {
                e.stopPropagation();
                setEditingNode(node);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) return;

        const target = e.target as HTMLElement;
        const nodeElement = target.closest('[data-node-id]');

        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            pendingHoverRef.current = nodeId;
        } else {
            pendingHoverRef.current = null;
        }

        if (hoverRafRef.current === null) {
            hoverRafRef.current = window.requestAnimationFrame(() => {
                const nextHover = pendingHoverRef.current;
                if (nextHover !== hoveredNodeIdRef.current) {
                    setHoveredNode(nextHover);
                }
                hoverRafRef.current = null;
            });
        }
    };

    const handleMouseLeave = () => {
        pendingHoverRef.current = null;
        if (hoverRafRef.current === null) {
            hoverRafRef.current = window.requestAnimationFrame(() => {
                if (hoveredNodeIdRef.current !== null) {
                    setHoveredNode(null);
                }
                hoverRafRef.current = null;
            });
        }
    };

    // Track latest pan/zoom in refs to avoid re-registering listeners on every change
    const zoomRef = React.useRef(zoom);
    const panRef = React.useRef(pan);
    React.useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);
    React.useEffect(() => {
        panRef.current = pan;
    }, [pan]);

    const applyTransforms = useCallback(() => {
        if (panLayerRef.current) {
            panLayerRef.current.style.transform = `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0)`;
        }
        if (scaleLayerRef.current) {
            scaleLayerRef.current.style.transform = `scale(${zoomRef.current / 100})`;
        }
    }, []);

    const scheduleZoomState = useCallback((nextZoom: number) => {
        pendingZoomRef.current = nextZoom;
        if (zoomFrameRef.current === null) {
            zoomFrameRef.current = window.requestAnimationFrame(() => {
                const latestZoom = pendingZoomRef.current ?? zoomRef.current;
                setDisplayZoom(latestZoom);
                setScale(latestZoom / 100);
                zoomFrameRef.current = null;
            });
        }
    }, []);

    const commitPanZoom = useCallback(() => {
        setPan({ ...panRef.current });
        setZoom(zoomRef.current);
    }, [setPan, setZoom]);

    const scheduleCommit = useCallback((delay = 120) => {
        interactionRef.current = true;
        if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current);
        }
        commitTimerRef.current = window.setTimeout(() => {
            commitPanZoom();
            interactionRef.current = false;
            commitTimerRef.current = null;
        }, delay);
    }, [commitPanZoom]);

    useEffect(() => {
        if (interactionRef.current) return;
        zoomRef.current = zoom;
        panRef.current = pan;
        scheduleZoomState(zoom);
        applyTransforms();
    }, [zoom, pan, applyTransforms, scheduleZoomState]);

    // Pan/Zoom handlers
    useEffect(() => {
        const clampZoom = (value: number) => Math.min(Math.max(value, 25), 400);
        let panFrame: number | null = null;
        let pendingPan: { x: number; y: number } | null = null;

        const flushPan = () => {
            if (pendingPan) {
                panRef.current = pendingPan;
                applyTransforms();
                scheduleCommit();
                pendingPan = null;
            }
            panFrame = null;
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                // Zoom (trackpad-friendly): exponential-ish factor with sensible floor/ceiling per tick
                e.preventDefault();
                const delta = -e.deltaY; // up = zoom in, down = zoom out
                const magnitude = Math.min(0.25, Math.abs(delta) / 400); // cap per-tick change at 25%
                const factor = 1 + magnitude * Math.sign(delta || 1);
                const newZoom = clampZoom(zoomRef.current * factor);
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                    const cursorX = e.clientX - rect.left;
                    const cursorY = e.clientY - rect.top;
                    const currentScale = zoomRef.current / 100;
                    const nextScale = newZoom / 100;
                    const worldX = (cursorX - panRef.current.x) / currentScale;
                    const worldY = (cursorY - panRef.current.y) / currentScale;
                    panRef.current = {
                        x: cursorX - worldX * nextScale,
                        y: cursorY - worldY * nextScale,
                    };
                }
                zoomRef.current = newZoom;
                applyTransforms();
                scheduleZoomState(newZoom);
                scheduleCommit();
            } else {
                // Pan (both mouse wheel and trackpad two-finger scroll)
                e.preventDefault();
                const nextPan = {
                    x: panRef.current.x - e.deltaX,
                    y: panRef.current.y - e.deltaY,
                };
                pendingPan = nextPan;
                if (panFrame === null) {
                    panFrame = window.requestAnimationFrame(flushPan);
                }
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                setIsPanning(true);
                document.body.style.cursor = 'grab';
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsPanning(false);
                document.body.style.cursor = 'default';
            }
        };

        const target = canvasRef.current;
        if (target) {
            target.addEventListener('wheel', handleWheel, { passive: false });
        }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            if (panFrame !== null) cancelAnimationFrame(panFrame);
            if (target) {
                target.removeEventListener('wheel', handleWheel);
            }
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [applyTransforms, scheduleZoomState, scheduleCommit]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Allow panning if:
        // 1. Spacebar is held (isPanning)
        // 2. Middle mouse button
        // 3. Alt + Click
        // 4. Clicking on the background (not a node)

        const isBackgroundClick = (e.target === e.currentTarget) || (e.target as HTMLElement).id === 'canvas-background';

        if (isPanning || e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && isBackgroundClick)) {
            // Only prevent default if it's explicitly a pan action to avoid blocking other interactions?
            // But for background drag it should be fine.
            // e.preventDefault(); // Don't prevent default immediately for left click to allow focus

            const startX = e.clientX - panRef.current.x;
            const startY = e.clientY - panRef.current.y;

            let panFrame: number | null = null;
            let pendingPan: { x: number; y: number } | null = null;

            const flushPan = () => {
                if (pendingPan) {
                    panRef.current = pendingPan;
                    applyTransforms();
                    scheduleCommit();
                    pendingPan = null;
                }
                panFrame = null;
            };

            const onMouseMove = (ev: MouseEvent) => {
                pendingPan = {
                    x: ev.clientX - startX,
                    y: ev.clientY - startY,
                };

                if (panFrame === null) {
                    panFrame = window.requestAnimationFrame(flushPan);
                }
            };

            const onMouseUp = () => {
                if (panFrame !== null) {
                    cancelAnimationFrame(panFrame);
                }
                if (commitTimerRef.current !== null) {
                    window.clearTimeout(commitTimerRef.current);
                    commitTimerRef.current = null;
                }
                interactionRef.current = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                commitPanZoom();
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }
    };

    return (
        <div
            id="canvas-background"
            ref={canvasRef}
            className="flex-1 bg-muted/50 overflow-hidden relative cursor-default"
            onMouseDown={handleMouseDown}
        >
            <div
                ref={panLayerRef}
                className="absolute inset-0 will-change-transform"
            >
                <div className="flex items-start justify-center p-32 min-h-full min-w-full">
                    <div
                        ref={(node) => {
                            scaleLayerRef.current = node;
                            setNodeRef(node);
                        }}
                        onClickCapture={handleCanvasClickCapture}
                        onDoubleClick={handleCanvasDoubleClick}
                        onClick={handleCanvasClick}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        className={cn(
                            'bg-background shadow-lg isolate',
                            isOver && 'ring-2 ring-primary'
                        )}
                        style={{
                            width: containerWidth,
                            minHeight: '100vh',
                            transformOrigin: 'top center',
                            ...themeStyles,
                        }}
                    >
                        <CanvasContent>{children}</CanvasContent>
                        {!isDragging && <HoverOverlay scale={scale} />}
                        {isDragging && <DropIndicatorOverlay scale={scale} />}
                        <SelectionOverlay scale={scale} onSnap={setSnapLines} />
                        <SnapLines lines={snapLines} scale={scale} />
                        {editingNode && (
                            <InlineTextEditor
                                node={editingNode}
                                zoom={zoom}
                                onClose={() => setEditingNode(null)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Zoom Indicator */}
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur border rounded-md px-2 py-1 text-xs font-mono select-none pointer-events-none">
                {Math.round(displayZoom)}%
            </div>
        </div>
    );
}

// Global store/context for snap lines would be better, but local state works for now if lifted
// For this implementation, we'll keep it simple and just visualize selection

/**
 * Selection overlay with resize handles and drag support
 */
export function SelectionOverlay({ scale, onSnap }: { scale: number; onSnap?: (lines: SnapLine[]) => void }) {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const selection = useEditorStore((s) => s.selection);
    const selectedNode = useEditorStore(selectSelectedNode);
    const updateNode = useEditorStore((s) => s.updateNode);
    const elementRef = useRef<HTMLElement | null>(null);
    const pendingRectRef = useRef<DOMRect | null>(null);
    const rectRafRef = useRef<number | null>(null);

    // Use ref for scale to avoid re-triggering effect on zoom which causes layout thrashing
    const scaleRef = useRef(scale);
    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    // Check if node is absolutely positioned
    const isAbsolute = selectedNode?.styles?.base?.position === 'absolute';

    const scheduleRectUpdate = useCallback((nextRect: DOMRect) => {
        pendingRectRef.current = nextRect;
        if (rectRafRef.current === null) {
            rectRafRef.current = window.requestAnimationFrame(() => {
                setRect(pendingRectRef.current);
                rectRafRef.current = null;
            });
        }
    }, []);

    useEffect(() => {
        if (!selection.nodeId) {
            elementRef.current = null;
            setRect(null);
            onSnap?.([]);
            return;
        }

        const updateRect = () => {
            const currentScale = scaleRef.current;
            const element = elementRef.current;
            if (element) {
                const canvasContainer = element.closest('.isolate') as HTMLElement;
                if (!canvasContainer) {
                    const elRect = element.getBoundingClientRect();
                    scheduleRectUpdate({
                        left: elRect.left,
                        top: elRect.top,
                        width: elRect.width,
                        height: elRect.height,
                        right: elRect.right,
                        bottom: elRect.bottom,
                        x: elRect.x,
                        y: elRect.y,
                        toJSON: () => { },
                    });
                    return;
                }

                const elRect = element.getBoundingClientRect();
                const containerRect = canvasContainer.getBoundingClientRect();

                scheduleRectUpdate({
                    left: (elRect.left - containerRect.left) / currentScale,
                    top: (elRect.top - containerRect.top) / currentScale,
                    width: elRect.width / currentScale,
                    height: elRect.height / currentScale,
                    right: 0,
                    bottom: 0,
                    x: 0,
                    y: 0,
                    toJSON: () => { },
                });
            } else {
                setRect(null);
                onSnap?.([]);
            }
        };

        const element = document.querySelector(`[data-node-id="${selection.nodeId}"]`) as HTMLElement | null
            || document.querySelector(`[data-prefab-instance-id="${selection.nodeId}"]`) as HTMLElement | null; // Fallback for prefab instances

        elementRef.current = element;

        if (!element) {
            setRect(null);
            onSnap?.([]);
            return;
        }

        updateRect();

        window.addEventListener('resize', updateRect);

        const resizeObserver = new ResizeObserver(updateRect);
        resizeObserver.observe(element);

        return () => {
            window.removeEventListener('resize', updateRect);
            resizeObserver.disconnect();
            if (rectRafRef.current !== null) {
                cancelAnimationFrame(rectRafRef.current);
                rectRafRef.current = null;
            }
        };
    }, [selection.nodeId, onSnap, scheduleRectUpdate]);

    const handleDragStart = (e: React.MouseEvent) => {
        if (!isAbsolute || !selectedNode || !rect) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        const leftValue = parseFloat(selectedNode.styles?.base?.left as string);
        const topValue = parseFloat(selectedNode.styles?.base?.top as string);
        const startLeft = Number.isFinite(leftValue) ? leftValue : rect.left;
        const startTop = Number.isFinite(topValue) ? topValue : rect.top;
        let latestLeft = startLeft;
        let latestTop = startTop;

        const element = elementRef.current ?? document.querySelector(`[data-node-id="${selection.nodeId}"]`) as HTMLElement | null;
        if (!element) return;

        // Get siblings for snapping
        const container = document.querySelector(`[data-node-id="${selection.nodeId}"]`)?.closest('.isolate') as HTMLElement;
        const siblings = container ? getSiblingRects(container, selection.nodeId!) : [];

        const onMouseMove = (ev: MouseEvent) => {
            // Adjust delta by scale to ensure 1:1 movement
            const rawDx = (ev.clientX - startX) / scale;
            const rawDy = (ev.clientY - startY) / scale;

            // Calculate current rect based on raw movement
            const currentRect = {
                id: selection.nodeId!,
                left: startLeft + rawDx,
                top: startTop + rawDy,
                right: startLeft + rawDx + rect.width,
                bottom: startTop + rawDy + rect.height,
                width: rect.width,
                height: rect.height,
                centerX: startLeft + rawDx + rect.width / 2,
                centerY: startTop + rawDy + rect.height / 2
            };

            // Calculate snap
            // Threshold is 5px visual, so we pass 5
            const snapResult = calculateSnap(currentRect, siblings, 5, scale);

            // Apply snap result to delta
            const dx = rawDx + snapResult.x;
            const dy = rawDy + snapResult.y;

            // Update snap lines
            onSnap?.(snapResult.lines);

            latestLeft = Math.round(startLeft + dx);
            latestTop = Math.round(startTop + dy);

            element.style.left = `${latestLeft}px`;
            element.style.top = `${latestTop}px`;

            scheduleRectUpdate({
                left: latestLeft,
                top: latestTop,
                width: rect.width,
                height: rect.height,
                right: 0,
                bottom: 0,
                x: 0,
                y: 0,
                toJSON: () => { },
            });
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            onSnap?.([]);

            updateNode(selectedNode.id, {
                styles: {
                    ...selectedNode.styles,
                    base: {
                        ...selectedNode.styles?.base,
                        left: `${latestLeft}px`,
                        top: `${latestTop}px`,
                    }
                }
            });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        if (!isAbsolute || !selectedNode) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        const widthValue = parseFloat(selectedNode.styles?.base?.width as string);
        const heightValue = parseFloat(selectedNode.styles?.base?.height as string);
        const leftValue = parseFloat(selectedNode.styles?.base?.left as string);
        const topValue = parseFloat(selectedNode.styles?.base?.top as string);

        const startWidth = Number.isFinite(widthValue) ? widthValue : (rect?.width || 100);
        const startHeight = Number.isFinite(heightValue) ? heightValue : (rect?.height || 100);
        const startLeft = Number.isFinite(leftValue) ? leftValue : (rect?.left || 0);
        const startTop = Number.isFinite(topValue) ? topValue : (rect?.top || 0);

        let latestWidth = startWidth;
        let latestHeight = startHeight;
        let latestLeft = startLeft;
        let latestTop = startTop;

        const element = elementRef.current ?? document.querySelector(`[data-node-id="${selection.nodeId}"]`) as HTMLElement | null;
        if (!element) return;

        // Get siblings for snapping
        const container = document.querySelector(`[data-node-id="${selection.nodeId}"]`)?.closest('.isolate') as HTMLElement;
        const siblings = container ? getSiblingRects(container, selection.nodeId!) : [];

        const onMouseMove = (ev: MouseEvent) => {
            const rawDx = (ev.clientX - startX) / scale;
            const rawDy = (ev.clientY - startY) / scale;

            // We need to calculate the POTENTIAL new rect to snap it
            // This is trickier for resize because different edges move

            let newW = startWidth;
            let newH = startHeight;
            let newL = startLeft;
            let newT = startTop;

            if (direction.includes('e')) newW = Math.max(10, startWidth + rawDx);
            if (direction.includes('s')) newH = Math.max(10, startHeight + rawDy);
            if (direction.includes('w')) {
                const w = Math.max(10, startWidth - rawDx);
                newL = startLeft + (startWidth - w);
                newW = w;
            }
            if (direction.includes('n')) {
                const h = Math.max(10, startHeight - rawDy);
                newT = startTop + (startHeight - h);
                newH = h;
            }

            // Construct proposal rect
            const proposal = {
                id: selection.nodeId!,
                left: newL, top: newT, width: newW, height: newH,
                right: newL + newW, bottom: newT + newH,
                centerX: newL + newW / 2, centerY: newT + newH / 2
            };

            // Calculate snap
            // We only want to snap the edges that are moving? 
            // calculateSnap aligns the WHOLE object based on delta.
            // For resize, we might want to snap specific edges.
            // But calculateSnap returns a delta for the whole rect.
            // If we blindly apply it, it might shift the non-moving edges.
            // However, sticking to "move whole rect to snap" logic for now:

            const snapResult = calculateSnap(proposal, siblings, 5, scale);

            // If dragging SE, we want to snap Right and Bottom.
            // If calculateSnap returns x/y shift, it means "shift the whole object by x/y".
            // But here we want to shift the EDGE.
            // If we are resizing East, and snapResult.x says "move +5px", it means the RIGHT edge should move +5px?
            // "calculateSnap" compares Left, Center, Right.
            // If it matched Right edge, it returns delta to align Right edge.

            const dx = rawDx + snapResult.x;
            const dy = rawDy + snapResult.y;

            const newStyles = { ...selectedNode.styles?.base };

            // Apply snapped deltas
            // Note: this is a simplification. Ideally snapping should be per-edge.
            // But let's see if this feels okay.

            if (direction.includes('e')) {
                latestWidth = Math.max(10, Math.round(startWidth + dx));
                newStyles.width = `${latestWidth}px`;
            }
            if (direction.includes('s')) {
                latestHeight = Math.max(10, Math.round(startHeight + dy));
                newStyles.height = `${latestHeight}px`;
            }

            if (direction.includes('w')) {
                const w = Math.max(10, Math.round(startWidth - dx));
                latestWidth = w;
                latestLeft = Math.round(startLeft + (startWidth - w));
                newStyles.width = `${w}px`;
                newStyles.left = `${latestLeft}px`;
            }
            if (direction.includes('n')) {
                const h = Math.max(10, Math.round(startHeight - dy));
                latestHeight = h;
                latestTop = Math.round(startTop + (startHeight - h));
                newStyles.height = `${h}px`;
                newStyles.top = `${latestTop}px`;
            }

            onSnap?.(snapResult.lines);

            if (typeof newStyles.width === 'string') element.style.width = newStyles.width;
            if (typeof newStyles.height === 'string') element.style.height = newStyles.height;
            if (typeof newStyles.left === 'string') element.style.left = newStyles.left;
            if (typeof newStyles.top === 'string') element.style.top = newStyles.top;

            scheduleRectUpdate({
                left: latestLeft,
                top: latestTop,
                width: latestWidth,
                height: latestHeight,
                right: 0,
                bottom: 0,
                x: 0,
                y: 0,
                toJSON: () => { },
            });
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            onSnap?.([]);

            updateNode(selectedNode.id, {
                styles: {
                    ...selectedNode.styles,
                    base: {
                        ...selectedNode.styles?.base,
                        left: `${latestLeft}px`,
                        top: `${latestTop}px`,
                        width: `${latestWidth}px`,
                        height: `${latestHeight}px`,
                    }
                }
            });
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    if (!rect || !selection.nodeId) return null;

    return (
        <div
            className={cn(
                "absolute z-50 border-2 border-primary rounded-sm select-none",
                isAbsolute ? "cursor-move pointer-events-auto" : "pointer-events-none"
            )}
            data-builder-ignore-click
            style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
            }}
            onMouseDown={handleDragStart}
        >
            {/* Label */}
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-t-sm whitespace-nowrap">
                {selectedNode?.type || selection.nodeId}
                {isAbsolute && <span className="opacity-70 ml-1">({Math.round(rect.left)}, {Math.round(rect.top)})</span>}
            </div>

            {/* Resize handles */}
            {isAbsolute && (
                <>
                    {/* Corners */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-background border border-primary rounded-full cursor-nw-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-background border border-primary rounded-full cursor-ne-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-background border border-primary rounded-full cursor-sw-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-background border border-primary rounded-full cursor-se-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'se')} />

                    {/* Edges */}
                    <div className="absolute top-1/2 -left-1.5 w-3 h-3 -mt-1.5 bg-background border border-primary rounded-full cursor-w-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'w')} />
                    <div className="absolute top-1/2 -right-1.5 w-3 h-3 -mt-1.5 bg-background border border-primary rounded-full cursor-e-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'e')} />
                    <div className="absolute left-1/2 -top-1.5 w-3 h-3 -ml-1.5 bg-background border border-primary rounded-full cursor-n-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 'n')} />
                    <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 -ml-1.5 bg-background border border-primary rounded-full cursor-s-resize pointer-events-auto"
                        onMouseDown={(e) => handleResizeStart(e, 's')} />
                </>
            )}
        </div>
    );
}

function SnapLines({ lines, scale }: { lines: SnapLine[]; scale: number }) {
    if (!lines.length) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            {lines.map((line) => (
                <div
                    key={line.id}
                    className="absolute bg-pink-500"
                    style={{
                        left: line.orientation === 'vertical' ? line.position / scale : (line.start ? line.start / scale : 0),
                        top: line.orientation === 'horizontal' ? line.position / scale : (line.start ? line.start / scale : 0),
                        width: line.orientation === 'vertical' ? 1 : '100%', // Full width relative to parent or bounded
                        height: line.orientation === 'horizontal' ? 1 : '100%',
                        // If we have start/end, use them
                        ...(line.start !== undefined && line.end !== undefined && {
                            [line.orientation === 'vertical' ? 'top' : 'left']: line.start / scale,
                            [line.orientation === 'vertical' ? 'height' : 'width']: (line.end - line.start) / scale,
                        })
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Hover overlay - simplified version of SelectionOverlay
 */
export function HoverOverlay({ scale }: { scale: number }) {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const hoveredNodeId = useEditorStore((s) => s.hoveredNodeId);
    const selection = useEditorStore((s) => s.selection);

    // Use ref for scale to avoid re-triggering effect on zoom which causes layout thrashing
    const scaleRef = useRef(scale);
    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    const isSelected = hoveredNodeId === selection.nodeId;

    useEffect(() => {
        if (!hoveredNodeId || isSelected) {
            setRect(null);
            return;
        }

        const updateRect = () => {
            const currentScale = scaleRef.current;
            const element = document.querySelector(`[data-node-id="${hoveredNodeId}"]`);
            if (element) {
                // Get rect relative to the canvas container (not viewport)
                // We need to traverse up to the scaling container
                const canvasContainer = element.closest('.isolate') as HTMLElement;
                if (!canvasContainer) {
                    setRect(null);
                    return;
                }

                const elRect = element.getBoundingClientRect();
                const containerRect = canvasContainer.getBoundingClientRect();

                // Calculate position relative to scaled container
                setRect({
                    left: (elRect.left - containerRect.left) / currentScale,
                    top: (elRect.top - containerRect.top) / currentScale,
                    width: elRect.width / currentScale,
                    height: elRect.height / currentScale,
                    right: 0, bottom: 0, x: 0, y: 0, toJSON: () => { }
                });
            } else {
                setRect(null);
            }
        };

        // Initial update
        updateRect();

        // Update on resize/scroll and mutation
        window.addEventListener('resize', updateRect);

        // Also use ResizeObserver for more performant size tracking
        const element = document.querySelector(`[data-node-id="${hoveredNodeId}"]`);
        let resizeObserver: ResizeObserver | null = null;

        if (element) {
            resizeObserver = new ResizeObserver(updateRect);
            resizeObserver.observe(element);
        }

        return () => {
            window.removeEventListener('resize', updateRect);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [hoveredNodeId, isSelected]); // Re-run when hovered node or selection state changes

    if (!rect || !hoveredNodeId || isSelected) return null;

    return (
        <div
            className="absolute z-40 border-2 border-primary/50 pointer-events-none transition-all duration-75"
            style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
            }}
        >
            <div className="absolute -top-6 right-0 bg-primary/80 text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                {hoveredNodeId}
            </div>
        </div>
    );
}

/**
 * Drop indicator overlay - visual feedback during drag
 */
export function DropIndicatorOverlay({ scale }: { scale: number }) {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const hoveredNodeId = useEditorStore((s) => s.hoveredNodeId);

    // Use ref for scale to avoid re-triggering effect on zoom which causes layout thrashing
    const scaleRef = useRef(scale);
    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
        if (!hoveredNodeId) {
            setRect(null);
            return;
        }

        const updateRect = () => {
            const currentScale = scaleRef.current;
            const element = document.querySelector(`[data-node-id="${hoveredNodeId}"]`);
            if (element) {
                // Get rect relative to the canvas container
                const canvasContainer = element.closest('.isolate') as HTMLElement;
                if (!canvasContainer) {
                    setRect(null);
                    return;
                }

                const elRect = element.getBoundingClientRect();
                const containerRect = canvasContainer.getBoundingClientRect();

                // Calculate position relative to scaled container
                setRect({
                    left: (elRect.left - containerRect.left) / currentScale,
                    top: (elRect.top - containerRect.top) / currentScale,
                    width: elRect.width / currentScale,
                    height: elRect.height / currentScale,
                    right: 0, bottom: 0, x: 0, y: 0, toJSON: () => { }
                });
            } else {
                setRect(null);
            }
        };

        updateRect();
        const element = document.querySelector(`[data-node-id="${hoveredNodeId}"]`);
        let resizeObserver: ResizeObserver | null = null;
        if (element) {
            resizeObserver = new ResizeObserver(updateRect);
            resizeObserver.observe(element);
        }
        return () => {
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [hoveredNodeId]);

    if (!rect) return null;

    return (
        <div
            className="absolute z-50 border-2 border-green-500 bg-green-500/10 pointer-events-none transition-all duration-75"
            style={{
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
            }}
        >
            <div className="absolute -top-6 right-0 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm whitespace-nowrap font-bold">
                Insert into {hoveredNodeId}
            </div>
        </div>
    );
}

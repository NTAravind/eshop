import type { StorefrontNode } from '@/types/storefront-builder';

export interface SnapLine {
    id: string;
    orientation: 'vertical' | 'horizontal';
    position: number; // px value
    start?: number;
    end?: number;
}

export interface SnapResult {
    x: number; // New X position (or delta)
    y: number; // New Y position (or delta)
    lines: SnapLine[];
}

interface Rect {
    id: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

/**
 * Calculate snap positions for a dragging/resizing element
 */
export function calculateSnap(
    currentRect: Rect,
    otherRects: Rect[],
    threshold: number = 5,
    scale: number = 1
): SnapResult {
    // Adjust threshold by scale to make it consistent visually
    const activeThreshold = threshold / scale;

    let snappedX = currentRect.left;
    let snappedY = currentRect.top;
    const snapLines: SnapLine[] = [];

    let minDiffX = Infinity;
    let minDiffY = Infinity;

    // Horizontal snapping (Vertical lines: Left, Center, Right)
    // We compare currentRect's Left/Center/Right with others' Left/Center/Right

    const xPoints = [
        { val: currentRect.left, type: 'start' },
        { val: currentRect.centerX, type: 'center' },
        { val: currentRect.right, type: 'end' }
    ];

    for (const other of otherRects) {
        const otherXPoints = [
            { val: other.left, type: 'start' },
            { val: other.centerX, type: 'center' },
            { val: other.right, type: 'end' }
        ];

        for (const currentPoint of xPoints) {
            for (const otherPoint of otherXPoints) {
                const diff = otherPoint.val - currentPoint.val;

                if (Math.abs(diff) < activeThreshold && Math.abs(diff) < Math.abs(minDiffX)) {
                    minDiffX = diff;

                    // What are we snapping? The whole object moves by 'diff'
                    // If we snap Center to Center, the shift is otherCenter - currentCenter

                    // Create visual line
                    // The line is at 'otherPoint.val'
                    // It should span covering both objects vertically
                    const minY = Math.min(currentRect.top, other.top);
                    const maxY = Math.max(currentRect.bottom, other.bottom);

                    // Clear previous X lines as we found a better one? 
                    // Usually we want to show multiple if they are valid, but usually we prefer the closest snap.
                    // For now, let's just collect the best one or accumulate.
                    // A simple approach: First pass finds best delta. Second pass (or same) builds lines matching that delta.
                }
            }
        }
    }

    // Re-run to find all matches for the best diff (if found)
    const addedIds = new Set<string>();

    if (minDiffX !== Infinity) {
        snappedX += minDiffX;

        // Find which lines align with this new position
        const newLeft = currentRect.left + minDiffX;
        const newCenter = currentRect.centerX + minDiffX;
        const newRight = currentRect.right + minDiffX;

        const newXPoints = [newLeft, newCenter, newRight];

        for (const other of otherRects) {
            const otherXPoints = [other.left, other.centerX, other.right];

            for (const nx of newXPoints) {
                for (const ox of otherXPoints) {
                    if (Math.abs(nx - ox) < 0.1) { // Floating point tolerance
                        const id = `v-${other.id}-${ox}`;
                        if (!addedIds.has(id)) {
                            snapLines.push({
                                id,
                                orientation: 'vertical',
                                position: ox,
                                start: Math.min(currentRect.top, other.top) - 10,
                                end: Math.max(currentRect.bottom, other.bottom) + 10
                            });
                            addedIds.add(id);
                        }
                    }
                }
            }
        }
    }


    // Vertical snapping (Horizontal lines: Top, Center, Bottom)
    const yPoints = [
        { val: currentRect.top, type: 'start' },
        { val: currentRect.centerY, type: 'center' },
        { val: currentRect.bottom, type: 'end' }
    ];

    for (const other of otherRects) {
        const otherYPoints = [
            { val: other.top, type: 'start' },
            { val: other.centerY, type: 'center' },
            { val: other.bottom, type: 'end' }
        ];

        for (const currentPoint of yPoints) {
            for (const otherPoint of otherYPoints) {
                const diff = otherPoint.val - currentPoint.val;

                if (Math.abs(diff) < activeThreshold && Math.abs(diff) < Math.abs(minDiffY)) {
                    minDiffY = diff;
                }
            }
        }
    }

    if (minDiffY !== Infinity) {
        snappedY += minDiffY;

        const newTop = currentRect.top + minDiffY;
        const newCenter = currentRect.centerY + minDiffY;
        const newBottom = currentRect.bottom + minDiffY;

        const newYPoints = [newTop, newCenter, newBottom];

        for (const other of otherRects) {
            const otherYPoints = [other.top, other.centerY, other.bottom];

            for (const ny of newYPoints) {
                for (const oy of otherYPoints) {
                    if (Math.abs(ny - oy) < 0.1) {
                        const id = `h-${other.id}-${oy}`;
                        if (!addedIds.has(id)) {
                            snapLines.push({
                                id,
                                orientation: 'horizontal',
                                position: oy,
                                start: Math.min(currentRect.left, other.left) - 10,
                                end: Math.max(currentRect.right, other.right) + 10
                            });
                            addedIds.add(id);
                        }
                    }
                }
            }
        }
    }

    return {
        x: minDiffX !== Infinity ? minDiffX : 0, // Return DELTA
        y: minDiffY !== Infinity ? minDiffY : 0, // Return DELTA
        lines: snapLines
    };
}

/**
 * Helper to get all node rects from DOM
 * This is expensive, so use sparingly (drag start)
 */
export function getSiblingRects(container: HTMLElement, excludeId: string): Rect[] {
    const rects: Rect[] = [];
    // We assume nodes have data-node-id
    const nodes = container.querySelectorAll('[data-node-id]');

    const containerRect = container.getBoundingClientRect();

    nodes.forEach((node) => {
        const id = node.getAttribute('data-node-id');
        if (id && id !== excludeId) {
            const rect = node.getBoundingClientRect();
            // Convert to relative coords immediately? 
            // Better to keep in viewport coords for comparison if the container is the same, 
            // but for snapping we need them in the same coordinate space.
            // If we compare screen coords, it works regardless of nesting, 
            // BUT we only really care about visual alignment.

            // Let's store viewport coords for calculation, and then we might need to adjust for scroll/zoom if applying back.
            // wait, calculateSnap returns DELTA. Delta in screen pixels is Delta in relative pixels * scale.

            rects.push({
                id,
                left: rect.left,
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
            });
        }
    });

    return rects;
}

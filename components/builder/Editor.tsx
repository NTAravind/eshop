"use client"
"use client"

import type { RefObject } from "react"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { componentRegistry, registerCoreComponents } from "@/lib/builder/registry"
import { registerCoreActions } from "@/lib/builder/actions"
import { saveLayoutAction } from "@/actions/builder"
import {
  createDefaultLayout,
  createNode,
  findNode,
  insertNode,
  moveNode,
  removeNode,
  updateNode,
} from "@/lib/builder/layout"
import type { LayoutNode, LayoutRoot } from "@/types/builder"
import { Renderer } from "./Renderer"
import { Inspector } from "./Inspector"
import { LayersTree } from "./LayersTree"
import { Palette } from "./Palette"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditorProps {
  storeId: string
  initialLayout?: LayoutRoot | null
}

const PAGE_OPTIONS: LayoutRoot["page"][] = [
  "HOME",
  "PDP",
  "CART",
  "CHECKOUT",
  "COLLECTION",
]

export function Editor({ storeId, initialLayout }: EditorProps) {
  registerCoreComponents()
  registerCoreActions()

  const [isMounted, setIsMounted] = useState(false)
  const [layout, setLayout] = useState<LayoutRoot>(() =>
    initialLayout || createDefaultLayout(storeId)
  )
  const [selectedId, setSelectedId] = useState<string | null>(layout.tree.id)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<CanvasOverlayHandle | null>(null)

  const storageKey = useMemo(() => `storefront-builder:${storeId}`, [storeId])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only load from localStorage if we didn't get an initialLayout from DB,
    // OR if we want to prioritize local unsaved changes. 
    // For now, let's respect DB if provided, otherwise localStorage.
    if (initialLayout) return

    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as LayoutRoot
        if (parsed?.tree) {
          setLayout(parsed)
          setSelectedId(parsed.tree.id)
        }
      } catch (error) {
        console.warn("Failed to parse saved layout", error)
      }
    }
  }, [storageKey, initialLayout])

  const selectedNode = selectedId ? findNode(layout.tree, selectedId) : null
  const selectedDefinition = selectedNode ? componentRegistry.get(selectedNode.type) : undefined

  const handleAdd = (type: string) => {
    const newNode = createNode(type)
    const parentId = selectedNode?.id || layout.tree.id
    setLayout((prev) => ({
      ...prev,
      tree: insertNode(prev.tree, parentId, newNode),
    }))
    setSelectedId(newNode.id)
  }

  const handleDelete = () => {
    if (!selectedNode || selectedNode.id === layout.tree.id) {
      return
    }

    setLayout((prev) => ({
      ...prev,
      tree: removeNode(prev.tree, selectedNode.id),
    }))
    setSelectedId(layout.tree.id)
  }

  const updateNodeById = useCallback((nodeId: string, updater: (node: LayoutNode) => LayoutNode) => {
    setLayout((prev) => ({
      ...prev,
      tree: updateNode(prev.tree, nodeId, updater),
    }))
  }, [])

  const updateSelectedNode = (updater: (node: LayoutNode) => LayoutNode) => {
    if (!selectedId) {
      return
    }
    updateNodeById(selectedId, updater)
  }

  const saveLayout = async () => {
    setStatusMessage("Saving...")

    // 1. Local Persistence
    localStorage.setItem(storageKey, JSON.stringify(layout))

    // 2. Database Persistence
    const result = await saveLayoutAction(storeId, layout)

    if (result.success) {
      setStatusMessage("Saved to database")
    } else {
      setStatusMessage("Failed to save")
    }

    setTimeout(() => setStatusMessage(null), 2500)
  }

  const resetLayout = () => {
    const next = createDefaultLayout(storeId)
    setLayout(next)
    setSelectedId(next.tree.id)
  }

  if (!isMounted) {
    return <div className="h-[calc(100vh-6rem)] w-full" />
  }

  const handleMove = (nodeId: string, targetParentId: string) => {
    setLayout((prev) => ({
      ...prev,
      tree: moveNode(prev.tree, nodeId, targetParentId),
    }))
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">Storefront Builder</div>
          <Select
            value={layout.page}
            onValueChange={(value) => setLayout((prev) => ({ ...prev, page: value as LayoutRoot["page"] }))}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select page" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((page) => (
                <SelectItem key={page} value={page}>
                  {page}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {statusMessage && <span className="text-xs text-muted-foreground">{statusMessage}</span>}
          <Button variant="outline" size="sm" onClick={resetLayout}>
            Reset
          </Button>
          <Button size="sm" onClick={saveLayout}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid h-full grid-cols-[260px_minmax(0,1fr)_320px] gap-4">
        <div className="flex h-full flex-col gap-4 overflow-hidden">
          <Palette onAdd={handleAdd} />
          <LayersTree
            tree={layout.tree}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={handleMove}
          />
        </div>

        <div
          className="h-full overflow-hidden rounded-lg border bg-muted/30"
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = "copy"
          }}
          onDrop={(e) => {
            e.preventDefault()
            const type = e.dataTransfer.getData("component-type")
            if (type) {
              handleAdd(type)
            }
          }}
        >
          <div
            ref={canvasRef}
            className="relative h-full overflow-auto bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:8px_8px] p-6"
            onPointerDown={(event) => {
              if (event.button !== 0) {
                return
              }
              const target = event.target as HTMLElement | null
              const nodeElement = target?.closest(
                "[data-builder-node-id]"
              ) as HTMLElement | null
              const nodeId = nodeElement?.dataset?.builderNodeId
              if (!nodeId) {
                return
              }

              event.preventDefault()

              if (selectedId !== nodeId) {
                setSelectedId(nodeId)
              }

              overlayRef.current?.startDragForNode({
                nodeId,
                mode: "drag",
                clientX: event.clientX,
                clientY: event.clientY,
              })
            }}
          >
            <Renderer
              node={layout.tree}
              context={{ mode: "editor", runtimeContext: {} }}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <CanvasOverlay
              ref={overlayRef}
              canvasRef={canvasRef}
              nodeId={selectedId}
              node={selectedNode}
              onUpdateNodeById={updateNodeById}
            />
          </div>
        </div>

        <Inspector
          node={selectedNode}
          definition={selectedDefinition}
          onUpdate={updateSelectedNode}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

interface CanvasOverlayHandle {
  startDragForNode: (options: {
    nodeId: string
    mode: "drag" | "resize"
    handle?: ResizeHandle
    clientX: number
    clientY: number
  }) => void
}

interface CanvasOverlayProps {
  canvasRef: RefObject<HTMLDivElement | null>
  nodeId: string | null
  node: LayoutNode | null
  onUpdateNodeById: (nodeId: string, updater: (node: LayoutNode) => LayoutNode) => void
}

const GRID_SIZE = 8

const CanvasOverlay = forwardRef<CanvasOverlayHandle, CanvasOverlayProps>(
  ({ canvasRef, nodeId, node, onUpdateNodeById }, ref) => {
    const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
    const [activeNodeId, setActiveNodeId] = useState<string | null>(nodeId)
    const dragRef = useRef<{
      mode: "drag" | "resize"
      handle?: ResizeHandle
      startX: number
      startY: number
      startLeft: number
      startTop: number
      startWidth: number
      startHeight: number
    } | null>(null)

    const updateRect = useCallback(
      (idOverride?: string | null) => {
        const id = idOverride ?? activeNodeId
        if (!id || !canvasRef.current) {
          setRect(null)
          return
        }

        const target = canvasRef.current.querySelector(
          `[data-builder-node-id="${id}"]`
        ) as HTMLElement | null
        if (!target) {
          setRect(null)
          return
        }

        const targetRect = target.getBoundingClientRect()
        const canvasRect = canvasRef.current.getBoundingClientRect()
        const x = targetRect.left - canvasRect.left + canvasRef.current.scrollLeft
        const y = targetRect.top - canvasRect.top + canvasRef.current.scrollTop
        setRect({ x, y, width: targetRect.width, height: targetRect.height })
      },
      [canvasRef, activeNodeId]
    )

    useEffect(() => {
      setActiveNodeId(nodeId)
    }, [nodeId])

    useEffect(() => {
      updateRect()
    }, [updateRect, node, activeNodeId])

    useEffect(() => {
      const handleResize = () => updateRect()
      const handleScroll = () => updateRect()
      window.addEventListener("resize", handleResize)
      canvasRef.current?.addEventListener("scroll", handleScroll)
      return () => {
        window.removeEventListener("resize", handleResize)
        canvasRef.current?.removeEventListener("scroll", handleScroll)
      }
    }, [updateRect, canvasRef])

    const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

    const applyPosition = (next: { left?: number; top?: number; width?: number; height?: number }) => {
      const targetId = activeNodeId || nodeId
      if (!targetId) {
        return
      }

      onUpdateNodeById(targetId, (prev) => {
        const nextStyles = { ...prev.styles, base: { ...(prev.styles?.base || {}) } }
        const layout = { ...((nextStyles.base.layout as Record<string, unknown>) || {}) }
        const position = { ...((nextStyles.base.position as Record<string, unknown>) || {}) }

        position.position = "absolute"
        if (next.left !== undefined) {
          position.left = snap(next.left)
        }
        if (next.top !== undefined) {
          position.top = snap(next.top)
        }
        if (next.width !== undefined) {
          layout.width = Math.max(GRID_SIZE * 4, snap(next.width))
        }
        if (next.height !== undefined) {
          layout.height = Math.max(GRID_SIZE * 4, snap(next.height))
        }

        nextStyles.base.layout = layout
        nextStyles.base.position = position

        return { ...prev, styles: nextStyles }
      })
    }

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        if (!dragRef.current || !rect) {
          return
        }

        const dx = event.clientX - dragRef.current.startX
        const dy = event.clientY - dragRef.current.startY

        if (dragRef.current.mode === "drag") {
          applyPosition({
            left: dragRef.current.startLeft + dx,
            top: dragRef.current.startTop + dy,
          })
          return
        }

        const handle = dragRef.current.handle || "se"
        let nextLeft = dragRef.current.startLeft
        let nextTop = dragRef.current.startTop
        let nextWidth = dragRef.current.startWidth
        let nextHeight = dragRef.current.startHeight

        if (handle.includes("e")) {
          nextWidth = dragRef.current.startWidth + dx
        }
        if (handle.includes("s")) {
          nextHeight = dragRef.current.startHeight + dy
        }
        if (handle.includes("w")) {
          nextWidth = dragRef.current.startWidth - dx
          nextLeft = dragRef.current.startLeft + dx
        }
        if (handle.includes("n")) {
          nextHeight = dragRef.current.startHeight - dy
          nextTop = dragRef.current.startTop + dy
        }

        applyPosition({
          left: nextLeft,
          top: nextTop,
          width: nextWidth,
          height: nextHeight,
        })
      },
      [rect]
    )

    const handlePointerUp = useCallback(() => {
      dragRef.current = null
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }, [handlePointerMove])

    const startDrag = (
      event: React.PointerEvent,
      mode: "drag" | "resize",
      handle?: ResizeHandle
    ) => {
      if (!rect) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      dragRef.current = {
        mode,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.x,
        startTop: rect.y,
        startWidth: rect.width,
        startHeight: rect.height,
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    }

    useImperativeHandle(ref, () => ({
      startDragForNode: ({ nodeId: targetId, mode, handle, clientX, clientY }) => {
        setActiveNodeId(targetId)
        updateRect(targetId)

        if (!canvasRef.current) {
          return
        }

        const target = canvasRef.current.querySelector(
          `[data-builder-node-id="${targetId}"]`
        ) as HTMLElement | null

        if (!target) {
          return
        }

        const targetRect = target.getBoundingClientRect()
        const canvasRect = canvasRef.current.getBoundingClientRect()
        const x = targetRect.left - canvasRect.left + canvasRef.current.scrollLeft
        const y = targetRect.top - canvasRect.top + canvasRef.current.scrollTop
        const nextRect = { x, y, width: targetRect.width, height: targetRect.height }
        setRect(nextRect)

        dragRef.current = {
          mode,
          handle,
          startX: clientX,
          startY: clientY,
          startLeft: nextRect.x,
          startTop: nextRect.y,
          startWidth: nextRect.width,
          startHeight: nextRect.height,
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)
      },
    }))

    if (!rect || !activeNodeId) {
      return null
    }

    const handles: Array<{ key: ResizeHandle; style: string; cursor: string }> = [
      { key: "nw", style: "-top-2 -left-2", cursor: "nwse-resize" },
      { key: "n", style: "-top-2 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
      { key: "ne", style: "-top-2 -right-2", cursor: "nesw-resize" },
      { key: "w", style: "top-1/2 -left-2 -translate-y-1/2", cursor: "ew-resize" },
      { key: "e", style: "top-1/2 -right-2 -translate-y-1/2", cursor: "ew-resize" },
      { key: "sw", style: "-bottom-2 -left-2", cursor: "nesw-resize" },
      { key: "s", style: "-bottom-2 left-1/2 -translate-x-1/2", cursor: "ns-resize" },
      { key: "se", style: "-bottom-2 -right-2", cursor: "nwse-resize" },
    ]

    return (
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 20 }}>
        <div
          className="pointer-events-auto absolute rounded-md border-2 border-emerald-500/70"
          style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
          onPointerDown={(event) => startDrag(event, "drag")}
        >
          {handles.map((handle) => (
            <div
              key={handle.key}
              className={`absolute h-3 w-3 rounded-sm border border-emerald-600 bg-white shadow ${handle.style}`}
              style={{ cursor: handle.cursor }}
              onPointerDown={(event) => startDrag(event, "resize", handle.key)}
            />
          ))}
        </div>
      </div>
    )
  }
)

CanvasOverlay.displayName = "CanvasOverlay"

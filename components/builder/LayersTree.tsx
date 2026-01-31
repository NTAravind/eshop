"use client"

import type { LayoutNode } from "@/types/builder"
import { cn } from "@/lib/utils"

interface LayersTreeProps {
  tree: LayoutNode
  selectedId?: string | null
  onSelect: (nodeId: string) => void
  onMove: (nodeId: string, targetParentId: string) => void
}

export function LayersTree({ tree, selectedId, onSelect, onMove }: LayersTreeProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-auto rounded-lg border bg-card p-3">
      <div className="text-xs font-semibold uppercase text-muted-foreground">Layers</div>
      <div className="flex flex-col gap-2">
        <TreeNode node={tree} selectedId={selectedId} onSelect={onSelect} onMove={onMove} depth={0} />
      </div>
    </div>
  )
}

interface TreeNodeProps {
  node: LayoutNode
  selectedId?: string | null
  onSelect: (nodeId: string) => void
  onMove: (nodeId: string, targetParentId: string) => void
  depth: number
}

function TreeNode({ node, selectedId, onSelect, onMove, depth }: TreeNodeProps) {
  const isSelected = node.id === selectedId

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm",
          isSelected ? "bg-emerald-500/10 text-emerald-600" : "hover:bg-muted"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("application/x-builder-node", node.id)
          event.dataTransfer.effectAllowed = "move"
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = "move"
        }}
        onDrop={(event) => {
          event.preventDefault()
          const draggedId = event.dataTransfer.getData("application/x-builder-node")
          if (draggedId && draggedId !== node.id) {
            onMove(draggedId, node.id)
          }
        }}
        onClick={() => onSelect(node.id)}
      >
        <span>{node.type}</span>
        <span className="text-[10px] text-muted-foreground">{node.id.slice(0, 4)}</span>
      </button>
      {node.children.length > 0 && (
        <div className="flex flex-col gap-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onMove={onMove}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

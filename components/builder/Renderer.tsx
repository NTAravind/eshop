import type { LayoutNode, RenderContext } from "@/types/builder"
import { componentRegistry, registerCoreComponents } from "@/lib/builder/registry"
import { registerCoreActions, actionRegistry } from "@/lib/builder/actions"
import { resolveBindings } from "@/lib/builder/binding"
import { mergeStyles } from "@/lib/builder/style"

interface RendererProps {
  node: LayoutNode
  context: RenderContext
  selectedId?: string | null
  onSelect?: (nodeId: string) => void
}

export function Renderer({ node, context, selectedId, onSelect }: RendererProps) {
  registerCoreComponents()
  registerCoreActions()

  const definition = componentRegistry.get(node.type)
  if (!definition) {
    return null
  }

  const boundValues = resolveBindings(node.bindings, context.runtimeContext as Record<string, unknown>)
  const resolvedProps = {
    ...node.props,
    ...boundValues,
  }

  const style = mergeStyles(node.styles)
  const children = node.children.map((child) => (
    <Renderer
      key={child.id}
      node={child}
      context={context}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  ))

  const actions = node.actions || {}
  const handlers: Record<string, unknown> = {}

  if (context.mode === "runtime") {
    Object.entries(actions).forEach(([slot, actionRef]) => {
      if (!actionRef) {
        return
      }
      handlers[slot] = async () => {
        const action = actionRegistry.get(actionRef.actionId)
        if (!action) {
          return
        }
        await action.handler(actionRef.payload, context.runtimeContext)
      }
    })
  }

  const rendered = definition.render(
    {
      ...resolvedProps,
      style,
      children,
      dataNodeId: node.id,
      ...handlers,
    },
    context
  )

  if (context.mode !== "editor") {
    return rendered
  }

  return (
    <div
      className="contents"
      onClick={(event) => {
        event.stopPropagation()
        onSelect?.(node.id)
      }}
    >
      {rendered}
    </div>
  )
}

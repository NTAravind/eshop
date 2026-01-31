import type { LayoutNode, LayoutRoot } from "@/types/builder"
import { componentRegistry, registerCoreComponents } from "@/lib/builder/registry"

export function createNode(type: string): LayoutNode {
  registerCoreComponents()
  const definition = componentRegistry.get(type)
  if (!definition) {
    throw new Error(`Unknown component type: ${type}`)
  }

  return {
    id: crypto.randomUUID(),
    type,
    props: { ...(definition.defaults?.props || {}) },
    styles: definition.defaults?.styles || { base: {} },
    bindings: { ...(definition.defaults?.bindings || {}) },
    actions: { ...(definition.defaults?.actions || {}) },
    children: definition.defaults?.children || [],
  }
}

export function createDefaultLayout(storeId: string): LayoutRoot {
  const container = createNode("Container")
  const heading = createNode("Heading")
  const text = createNode("Text")

  heading.props.text = "Welcome to your storefront"
  text.props.text = "Start building by selecting a component from the palette."

  container.children = [heading, text]

  return {
    page: "HOME",
    storeId,
    version: "1.0",
    status: "draft",
    tree: container,
  }
}

export function findNode(root: LayoutNode, nodeId: string): LayoutNode | null {
  if (root.id === nodeId) {
    return root
  }

  for (const child of root.children) {
    const match = findNode(child, nodeId)
    if (match) {
      return match
    }
  }

  return null
}

export function containsNode(root: LayoutNode, nodeId: string): boolean {
  if (root.id === nodeId) {
    return true
  }

  return root.children.some((child) => containsNode(child, nodeId))
}

export function updateNode(
  root: LayoutNode,
  nodeId: string,
  updater: (node: LayoutNode) => LayoutNode
): LayoutNode {
  if (root.id === nodeId) {
    return updater(root)
  }

  return {
    ...root,
    children: root.children.map((child) => updateNode(child, nodeId, updater)),
  }
}

export function removeNode(root: LayoutNode, nodeId: string): LayoutNode {
  if (root.id === nodeId) {
    return root
  }

  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeNode(child, nodeId)),
  }
}

export function insertNode(root: LayoutNode, parentId: string, node: LayoutNode): LayoutNode {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...root.children, node],
    }
  }

  return {
    ...root,
    children: root.children.map((child) => insertNode(child, parentId, node)),
  }
}

export function moveNode(root: LayoutNode, nodeId: string, targetParentId: string): LayoutNode {
  if (nodeId === targetParentId) {
    return root
  }

  const nodeToMove = findNode(root, nodeId)
  if (!nodeToMove) {
    return root
  }

  if (containsNode(nodeToMove, targetParentId)) {
    return root
  }

  const withoutNode = removeNode(root, nodeId)
  return insertNode(withoutNode, targetParentId, nodeToMove)
}

import type { CSSProperties, ReactNode } from "react"

export type JSONSchema = Record<string, unknown>

export type ComponentCategory = "layout" | "content" | "commerce" | "navigation"

export interface ActionSlot {
  name: string
  label: string
}

export type ActionID =
  | "ADD_TO_CART"
  | "BUY_NOW"
  | "SELECT_VARIANT"
  | "SET_DELIVERY_MODE"
  | "APPLY_DISCOUNT"
  | "OPEN_DRAWER"
  | "NAVIGATE"

export interface ActionRef {
  actionId: ActionID
  payload: Record<string, unknown>
}

export interface LayoutNode {
  id: string
  type: string
  props: Record<string, unknown>
  styles: StyleObject
  bindings: Record<string, string>
  actions: Record<string, ActionRef>
  children: LayoutNode[]
}

export interface LayoutRoot {
  page: "HOME" | "PDP" | "CART" | "CHECKOUT" | "COLLECTION"
  storeId: string
  version: string
  status?: "draft" | "published" | "archived"
  tree: LayoutNode
}

export interface RenderContext {
  mode: "editor" | "runtime"
  runtimeContext: RuntimeContext
  onAction?: (action: ActionRef, node: LayoutNode) => Promise<void>
}

export interface RuntimeContext {
  store?: Record<string, unknown>
  user?: Record<string, unknown>
  cart?: Record<string, unknown>
  product?: Record<string, unknown>
  collection?: Record<string, unknown>
  route?: Record<string, unknown>
}

export interface ComponentDefinition<P = Record<string, unknown>> {
  type: string
  category: ComponentCategory
  displayName: string
  icon?: string
  propsSchema: JSONSchema
  styleSchema: JSONSchema
  bindingSchema?: JSONSchema
  actions?: ActionSlot[]
  defaults?: {
    props?: Record<string, unknown>
    styles?: StyleObject
    bindings?: Record<string, string>
    actions?: Record<string, ActionRef>
    children?: LayoutNode[]
  }
  render: (props: P, context: RenderContext) => ReactNode
}

export interface ActionDefinition {
  id: ActionID
  label: string
  payloadSchema: JSONSchema
  handler: (payload: Record<string, unknown>, context: RuntimeContext) => Promise<void>
}

export interface StyleObject {
  base: StyleLayer
  breakpoints?: Record<string, StyleLayer>
  states?: Record<string, StyleLayer>
}

export interface StyleLayer {
  layout?: Record<string, unknown>
  spacing?: Record<string, unknown>
  position?: Record<string, unknown>
  flex?: Record<string, unknown>
  grid?: Record<string, unknown>
  background?: Record<string, unknown>
  border?: Record<string, unknown>
  effects?: Record<string, unknown>
  typography?: Record<string, unknown>
  transition?: Record<string, unknown>
}

export interface ResolvedNode {
  id: string
  type: string
  props: Record<string, unknown>
  styles: CSSProperties
  actions: Record<string, ActionRef>
  children: ResolvedNode[]
}

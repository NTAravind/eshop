import type { ComponentDefinition } from "@/types/builder"
import type { CSSProperties, MouseEventHandler, ReactNode } from "react"
import { styleSchema } from "@/lib/builder/style-schema"

type RegistryMap = Record<string, ComponentDefinition>

class ComponentRegistry {
  private components: RegistryMap = {}

  register(definition: ComponentDefinition) {
    this.components[definition.type] = definition
  }

  get(type: string) {
    return this.components[type]
  }

  list() {
    return Object.values(this.components)
  }
}

export const componentRegistry = new ComponentRegistry()

const basicPropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
}

const textPropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string" },
  },
}

const headingPropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    text: { type: "string" },
    level: { type: "integer", minimum: 1, maximum: 6 },
  },
}

const buttonPropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    label: { type: "string" },
    variant: { type: "string", enum: ["primary", "secondary", "outline"] },
  },
}

const imagePropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    src: { type: "string" },
    alt: { type: "string" },
    objectFit: { type: "string", enum: ["cover", "contain"] },
  },
}

const containerPropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    maxWidth: { type: "string" },
  },
}

const flexPropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    direction: { type: "string", enum: ["row", "column"] },
    gap: { type: "number" },
  },
}

const gridPropsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    columns: { type: "integer", minimum: 1, maximum: 12 },
    gap: { type: "number" },
  },
}

const productTextSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    fallback: { type: "string" },
  },
}

export function registerCoreComponents() {
  if (componentRegistry.list().length > 0) {
    return
  }

  componentRegistry.register({
    type: "Container",
    category: "layout",
    displayName: "Container",
    propsSchema: containerPropsSchema,
    styleSchema,
    actions: [],
    defaults: {
      props: { maxWidth: "1200px" },
      styles: { base: { layout: { display: "block" }, spacing: { padding: { top: 24, right: 24, bottom: 24, left: 24 } } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({
      style,
      children,
      maxWidth,
      dataNodeId,
    }: {
      style?: CSSProperties
      children?: ReactNode
      maxWidth?: string
      dataNodeId?: string
    }) => {
      return (
        <div data-builder-node-id={dataNodeId} style={{ ...style, maxWidth, margin: "0 auto", width: "100%" }}>
          {children}
        </div>
      )
    },
  })

  componentRegistry.register({
    type: "Section",
    category: "layout",
    displayName: "Section",
    propsSchema: containerPropsSchema,
    styleSchema,
    actions: [],
    defaults: {
      props: { maxWidth: "1200px" },
      styles: { base: { layout: { display: "block" } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({
      style,
      children,
      dataNodeId,
    }: {
      style?: CSSProperties
      children?: ReactNode
      dataNodeId?: string
    }) => (
      <section data-builder-node-id={dataNodeId} style={style}>
        {children}
      </section>
    ),
  })

  componentRegistry.register({
    type: "Flex",
    category: "layout",
    displayName: "Flex",
    propsSchema: flexPropsSchema,
    styleSchema,
    actions: [],
    defaults: {
      props: { direction: "row", gap: 16 },
      styles: { base: { layout: { display: "flex" } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({
      style,
      children,
      direction,
      gap,
      dataNodeId,
    }: {
      style?: CSSProperties
      children?: ReactNode
      direction?: string
      gap?: number
      dataNodeId?: string
    }) => (
      <div
        data-builder-node-id={dataNodeId}
        style={{
          ...style,
          display: "flex",
          flexDirection: direction as CSSProperties["flexDirection"],
          gap,
        }}
      >
        {children}
      </div>
    ),
  })

  componentRegistry.register({
    type: "Grid",
    category: "layout",
    displayName: "Grid",
    propsSchema: gridPropsSchema,
    styleSchema,
    actions: [],
    defaults: {
      props: { columns: 2, gap: 16 },
      styles: { base: { layout: { display: "grid" } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({
      style,
      children,
      columns,
      gap,
      dataNodeId,
    }: {
      style?: CSSProperties
      children?: ReactNode
      columns?: number
      gap?: number
      dataNodeId?: string
    }) => (
      <div
        data-builder-node-id={dataNodeId}
        style={{
          ...style,
          display: "grid",
          gridTemplateColumns: `repeat(${columns || 2}, minmax(0, 1fr))`,
          gap,
        }}
      >
        {children}
      </div>
    ),
  })

  componentRegistry.register({
    type: "Text",
    category: "content",
    displayName: "Text",
    propsSchema: textPropsSchema,
    styleSchema,
    actions: [],
    defaults: {
      props: { text: "Text" },
      styles: { base: { typography: { fontSize: 16, lineHeight: 1.5 } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({ style, text, dataNodeId }: { style?: CSSProperties; text?: string; dataNodeId?: string }) => (
      <p data-builder-node-id={dataNodeId} style={style}>
        {text}
      </p>
    ),
  })

  componentRegistry.register({
    type: "Heading",
    category: "content",
    displayName: "Heading",
    propsSchema: headingPropsSchema,
    styleSchema,
    actions: [],
    defaults: {
      props: { text: "Heading", level: 2 },
      styles: { base: { typography: { fontSize: 32, lineHeight: 1.2, fontWeight: 600 } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({
      style,
      text,
      level,
      dataNodeId,
    }: {
      style?: CSSProperties
      text?: string
      level?: number
      dataNodeId?: string
    }) => {
      const headingLevel = Math.min(6, Math.max(1, Number(level) || 2))
      const tag = `h${headingLevel}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
      const HeadingTag = tag
      return (
        <HeadingTag data-builder-node-id={dataNodeId} style={style}>
          {text}
        </HeadingTag>
      )
    },
  })

  componentRegistry.register({
    type: "Button",
    category: "content",
    displayName: "Button",
    propsSchema: buttonPropsSchema,
    styleSchema,
    actions: [{ name: "onClick", label: "On Click" }],
    defaults: {
      props: { label: "Button", variant: "primary" },
      styles: { base: { layout: { display: "inline-block" }, spacing: { padding: { top: 10, right: 16, bottom: 10, left: 16 } } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({
      style,
      label,
      onClick,
      variant,
      dataNodeId,
    }: {
      style?: CSSProperties
      label?: string
      onClick?: MouseEventHandler<HTMLButtonElement>
      variant?: string
      dataNodeId?: string
    }) => {
      const base =
        variant === "outline"
          ? { border: "1px solid var(--border)", background: "transparent" }
          : variant === "secondary"
          ? { background: "var(--muted)", color: "var(--foreground)" }
          : { background: "var(--primary)", color: "var(--primary-foreground)" }

      return (
        <button
          data-builder-node-id={dataNodeId}
          style={{
            ...base,
            ...style,
            borderRadius: 8,
            cursor: "pointer",
          }}
          onClick={onClick}
        >
          {label}
        </button>
      )
    },
  })

  componentRegistry.register({
    type: "Image",
    category: "content",
    displayName: "Image",
    propsSchema: imagePropsSchema,
    styleSchema,
    actions: [],
    defaults: {
      props: { src: "https://placehold.co/600x400", alt: "", objectFit: "cover" },
      styles: { base: { layout: { width: "100%" } } },
      bindings: {},
      actions: {},
      children: [],
    },
    render: ({
      style,
      src,
      alt,
      objectFit,
      dataNodeId,
    }: {
      style?: CSSProperties
      src?: string
      alt?: string
      objectFit?: string
      dataNodeId?: string
    }) => (
      <img
        data-builder-node-id={dataNodeId}
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "auto",
          objectFit: objectFit as CSSProperties["objectFit"],
          ...style,
        }}
      />
    ),
  })

  componentRegistry.register({
    type: "ProductTitle",
    category: "commerce",
    displayName: "Product Title",
    propsSchema: productTextSchema,
    styleSchema,
    bindingSchema: {
      type: "object",
      additionalProperties: false,
      properties: { text: { type: "string" } },
    },
    actions: [],
    defaults: {
      props: { fallback: "Product title" },
      styles: { base: { typography: { fontSize: 24, fontWeight: 600 } } },
      bindings: { text: "product.name" },
      actions: {},
      children: [],
    },
    render: ({
      style,
      text,
      fallback,
      dataNodeId,
    }: {
      style?: CSSProperties
      text?: string
      fallback?: string
      dataNodeId?: string
    }) => (
      <h3 data-builder-node-id={dataNodeId} style={style}>
        {text || fallback}
      </h3>
    ),
  })

  componentRegistry.register({
    type: "ProductPrice",
    category: "commerce",
    displayName: "Product Price",
    propsSchema: {
      type: "object",
      additionalProperties: false,
      properties: { prefix: { type: "string" }, fallback: { type: "string" } },
    },
    styleSchema,
    bindingSchema: {
      type: "object",
      additionalProperties: false,
      properties: { text: { type: "string" } },
    },
    actions: [],
    defaults: {
      props: { prefix: "$", fallback: "0.00" },
      styles: { base: { typography: { fontSize: 20 } } },
      bindings: { text: "product.variants[0].price" },
      actions: {},
      children: [],
    },
    render: ({
      style,
      text,
      prefix,
      fallback,
      dataNodeId,
    }: {
      style?: CSSProperties
      text?: string
      prefix?: string
      fallback?: string
      dataNodeId?: string
    }) => (
      <span data-builder-node-id={dataNodeId} style={style}>{`${prefix || ""}${text || fallback}`}</span>
    ),
  })

  componentRegistry.register({
    type: "ProductImage",
    category: "commerce",
    displayName: "Product Image",
    propsSchema: {
      type: "object",
      additionalProperties: false,
      properties: { alt: { type: "string" } },
    },
    styleSchema,
    bindingSchema: {
      type: "object",
      additionalProperties: false,
      properties: { src: { type: "string" } },
    },
    actions: [],
    defaults: {
      props: { alt: "Product image" },
      styles: { base: { layout: { width: "100%" } } },
      bindings: { src: "product.images[0].url" },
      actions: {},
      children: [],
    },
    render: ({
      style,
      src,
      alt,
      dataNodeId,
    }: {
      style?: CSSProperties
      src?: string
      alt?: string
      dataNodeId?: string
    }) => (
      <img
        data-builder-node-id={dataNodeId}
        src={src || "https://placehold.co/600x400"}
        alt={alt}
        style={{ width: "100%", ...style }}
      />
    ),
  })

  componentRegistry.register({
    type: "AddToCartButton",
    category: "commerce",
    displayName: "Add To Cart Button",
    propsSchema: buttonPropsSchema,
    styleSchema,
    actions: [{ name: "onClick", label: "On Click" }],
    defaults: {
      props: { label: "Add To Cart", variant: "primary" },
      styles: { base: { layout: { display: "inline-block" } } },
      bindings: {},
      actions: { onClick: { actionId: "ADD_TO_CART", payload: { variantId: "{{product.variants[0].id}}" } } },
      children: [],
    },
    render: ({
      style,
      label,
      onClick,
      variant,
      dataNodeId,
    }: {
      style?: CSSProperties
      label?: string
      onClick?: MouseEventHandler<HTMLButtonElement>
      variant?: string
      dataNodeId?: string
    }) => {
      const base =
        variant === "outline"
          ? { border: "1px solid var(--border)", background: "transparent" }
          : variant === "secondary"
          ? { background: "var(--muted)", color: "var(--foreground)" }
          : { background: "var(--primary)", color: "var(--primary-foreground)" }

      return (
        <button
          data-builder-node-id={dataNodeId}
          style={{
            ...base,
            ...style,
            borderRadius: 8,
            cursor: "pointer",
          }}
          onClick={onClick}
        >
          {label}
        </button>
      )
    },
  })
}

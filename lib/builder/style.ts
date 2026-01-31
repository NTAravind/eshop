import type { CSSProperties } from "react"
import type { StyleLayer, StyleObject } from "@/types/builder"

const transitionPresetMap: Record<string, string> = {
  none: "none",
  fast: "all 150ms ease",
  base: "all 250ms ease",
  slow: "all 400ms ease",
}

export function resolveStyles(styleObject?: StyleObject, layerKey = "base") {
  if (!styleObject) {
    return {}
  }

  if (layerKey === "base") {
    return toCss(styleObject.base)
  }

  if (styleObject.breakpoints?.[layerKey]) {
    return toCss(styleObject.breakpoints[layerKey])
  }

  if (styleObject.states?.[layerKey]) {
    return toCss(styleObject.states[layerKey])
  }

  return toCss(styleObject.base)
}

export function mergeStyles(styleObject?: StyleObject) {
  if (!styleObject) {
    return {}
  }

  return {
    ...toCss(styleObject.base),
  }
}

function toCss(layer?: StyleLayer): CSSProperties {
  if (!layer) {
    return {}
  }

  const css: CSSProperties = {}

  const layout = (layer.layout as Record<string, unknown>) || {}
  assignIfDefined(css, "display", layout.display)
  assignIfDefined(css, "width", length(layout.width))
  assignIfDefined(css, "height", length(layout.height))
  assignIfDefined(css, "minWidth", length(layout.minWidth))
  assignIfDefined(css, "maxWidth", length(layout.maxWidth))
  assignIfDefined(css, "minHeight", length(layout.minHeight))
  assignIfDefined(css, "maxHeight", length(layout.maxHeight))
  assignIfDefined(css, "aspectRatio", layout.aspectRatio)
  assignIfDefined(css, "overflow", layout.overflow)
  assignIfDefined(css, "visibility", layout.visibility)

  const spacing = (layer.spacing as Record<string, unknown>) || {}
  if (spacing.margin) {
    const margin = spacing.margin as Record<string, unknown>
    assignIfDefined(css, "marginTop", length(margin.top))
    assignIfDefined(css, "marginRight", length(margin.right))
    assignIfDefined(css, "marginBottom", length(margin.bottom))
    assignIfDefined(css, "marginLeft", length(margin.left))
  }
  if (spacing.padding) {
    const padding = spacing.padding as Record<string, unknown>
    assignIfDefined(css, "paddingTop", length(padding.top))
    assignIfDefined(css, "paddingRight", length(padding.right))
    assignIfDefined(css, "paddingBottom", length(padding.bottom))
    assignIfDefined(css, "paddingLeft", length(padding.left))
  }
  assignIfDefined(css, "gap", length(spacing.gap))

  const position = (layer.position as Record<string, unknown>) || {}
  assignIfDefined(css, "position", position.position)
  assignIfDefined(css, "top", length(position.top))
  assignIfDefined(css, "right", length(position.right))
  assignIfDefined(css, "bottom", length(position.bottom))
  assignIfDefined(css, "left", length(position.left))
  assignIfDefined(css, "zIndex", position.zIndex as number)

  if (position.transform) {
    const transform = position.transform as Record<string, unknown>
    const transforms = [
      transform.translateX !== undefined ? `translateX(${length(transform.translateX)})` : null,
      transform.translateY !== undefined ? `translateY(${length(transform.translateY)})` : null,
      transform.rotateDeg !== undefined ? `rotate(${transform.rotateDeg}deg)` : null,
      transform.scale !== undefined ? `scale(${transform.scale})` : null,
    ].filter(Boolean)
    if (transforms.length) {
      css.transform = transforms.join(" ")
    }
  }

  const flex = (layer.flex as Record<string, unknown>) || {}
  assignIfDefined(css, "flexDirection", flex.direction)
  assignIfDefined(css, "justifyContent", flex.justify)
  assignIfDefined(css, "alignItems", flex.align)
  assignIfDefined(css, "flexWrap", flex.wrap)

  const grid = (layer.grid as Record<string, unknown>) || {}
  if (grid.columns) {
    css.gridTemplateColumns = `repeat(${Number(grid.columns)}, minmax(0, 1fr))`
  }
  if (grid.rows) {
    css.gridTemplateRows = `repeat(${Number(grid.rows)}, minmax(0, 1fr))`
  }
  assignIfDefined(css, "columnGap", length(grid.columnGap))
  assignIfDefined(css, "rowGap", length(grid.rowGap))
  assignIfDefined(css, "justifyItems", grid.justifyItems)
  assignIfDefined(css, "alignItems", grid.alignItems)

  const background = (layer.background as Record<string, unknown>) || {}
  if (background.type === "color") {
    assignIfDefined(css, "background", background.color)
  }
  if (background.type === "gradient" && background.gradient) {
    const gradient = background.gradient as Record<string, unknown>
    const angle = Number(gradient.angleDeg || 0)
    const stops = Array.isArray(gradient.stops)
      ? gradient.stops
          .map((stop) => {
            if (typeof stop !== "object" || stop == null) {
              return null
            }
            const stopRecord = stop as Record<string, unknown>
            if (!stopRecord.color) {
              return null
            }
            const pos = stopRecord.pos !== undefined ? `${stopRecord.pos}%` : ""
            return `${stopRecord.color} ${pos}`.trim()
          })
          .filter(Boolean)
      : []
    if (stops.length) {
      css.background = `linear-gradient(${angle}deg, ${stops.join(", ")})`
    }
  }
  if (background.type === "image" && background.image) {
    const image = background.image as Record<string, unknown>
    const url = image.url || image.assetId
    if (url) {
      css.backgroundImage = `url(${url})`
      css.backgroundSize = image.fit as string
      css.backgroundPosition = image.position as string
      css.backgroundRepeat = image.repeat as string
    }
  }

  const border = (layer.border as Record<string, unknown>) || {}
  if (border.width || border.style || border.color) {
    css.border = `${length(border.width) || 0}px ${border.style || "solid"} ${border.color || "transparent"}`
  }
  if (border.radius) {
    const radius = border.radius as Record<string, unknown>
    css.borderRadius = `${length(radius.tl) || 0}px ${length(radius.tr) || 0}px ${length(radius.br) || 0}px ${
      length(radius.bl) || 0
    }px`
  }

  const effects = (layer.effects as Record<string, unknown>) || {}
  assignIfDefined(css, "opacity", effects.opacity as number)
  if (effects.shadow && typeof effects.shadow === "object") {
    const shadow = effects.shadow as Record<string, unknown>
    css.boxShadow = `${length(shadow.x) || 0}px ${length(shadow.y) || 0}px ${
      length(shadow.blur) || 0
    }px ${length(shadow.spread) || 0}px ${shadow.color || "rgba(0,0,0,0.2)"}`
  }

  const typography = (layer.typography as Record<string, unknown>) || {}
  assignIfDefined(css, "fontFamily", typography.fontFamily)
  assignIfDefined(css, "fontSize", length(typography.fontSize))
  assignIfDefined(css, "lineHeight", typography.lineHeight as number)
  assignIfDefined(css, "letterSpacing", typography.letterSpacing as number)
  assignIfDefined(css, "fontWeight", typography.fontWeight as number)
  assignIfDefined(css, "textAlign", typography.textAlign)
  assignIfDefined(css, "textTransform", typography.transform)
  assignIfDefined(css, "textDecoration", typography.decoration)
  assignIfDefined(css, "color", typography.color)

  const transition = (layer.transition as Record<string, unknown>) || {}
  if (transition.preset) {
    css.transition = transitionPresetMap[transition.preset as string] || transitionPresetMap.base
  }

  return css
}

function assignIfDefined<T extends keyof CSSProperties>(
  css: CSSProperties,
  key: T,
  value: unknown
) {
  if (value !== undefined && value !== null) {
    css[key] = value as CSSProperties[T]
  }
}

function length(value: unknown) {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    return value
  }
  return undefined
}

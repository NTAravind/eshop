import type { JSONSchema } from "@/types/builder"

export const styleSchemaDefinitions = {
  TokenVar: {
    type: "string",
    pattern: "^var\\(--[a-z0-9-]+\\)$",
    description: "Theme token reference in CSS var form, e.g. var(--surface)",
  },
  NumberPx: {
    type: "number",
    description: "Numeric values are interpreted as px by the renderer",
  },
  Length: {
    oneOf: [
      { $ref: "#/definitions/NumberPx" },
      { $ref: "#/definitions/TokenVar" },
    ],
    description: "Safe length subset: number(px) or theme token var()",
  },
  Percent: {
    type: "number",
    minimum: 0,
    maximum: 100,
  },
  Color: {
    oneOf: [
      { $ref: "#/definitions/TokenVar" },
      { type: "string", pattern: "^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$" },
    ],
    description: "Safe colors: theme token var() or #RRGGBB/#RRGGBBAA",
  },
  Box4: {
    type: "object",
    additionalProperties: false,
    properties: {
      top: { $ref: "#/definitions/Length" },
      right: { $ref: "#/definitions/Length" },
      bottom: { $ref: "#/definitions/Length" },
      left: { $ref: "#/definitions/Length" },
    },
  },
  Radius4: {
    type: "object",
    additionalProperties: false,
    properties: {
      tl: { $ref: "#/definitions/Length" },
      tr: { $ref: "#/definitions/Length" },
      br: { $ref: "#/definitions/Length" },
      bl: { $ref: "#/definitions/Length" },
    },
  },
  Shadow: {
    type: "object",
    additionalProperties: false,
    properties: {
      x: { $ref: "#/definitions/Length" },
      y: { $ref: "#/definitions/Length" },
      blur: { $ref: "#/definitions/Length" },
      spread: { $ref: "#/definitions/Length" },
      color: { $ref: "#/definitions/Color" },
      inset: { type: "boolean" },
    },
    required: ["x", "y", "blur", "color"],
  },
}

export const layoutGroupSchema = {
  title: "Layout",
  type: "object",
  additionalProperties: false,
  properties: {
    display: { type: "string", enum: ["block", "flex", "grid", "none"] },
    width: { $ref: "#/definitions/Length" },
    height: { $ref: "#/definitions/Length" },
    minWidth: { $ref: "#/definitions/Length" },
    maxWidth: { $ref: "#/definitions/Length" },
    minHeight: { $ref: "#/definitions/Length" },
    maxHeight: { $ref: "#/definitions/Length" },
    aspectRatio: { type: "number", minimum: 0 },
    overflow: { type: "string", enum: ["visible", "hidden", "scroll", "auto"] },
    visibility: { type: "string", enum: ["visible", "hidden"] },
  },
}

export const spacingGroupSchema = {
  title: "Spacing",
  type: "object",
  additionalProperties: false,
  properties: {
    margin: { $ref: "#/definitions/Box4" },
    padding: { $ref: "#/definitions/Box4" },
    gap: { $ref: "#/definitions/Length" },
  },
}

export const positionGroupSchema = {
  title: "Position",
  type: "object",
  additionalProperties: false,
  properties: {
    position: { type: "string", enum: ["relative", "absolute", "sticky", "fixed"] },
    top: { $ref: "#/definitions/Length" },
    right: { $ref: "#/definitions/Length" },
    bottom: { $ref: "#/definitions/Length" },
    left: { $ref: "#/definitions/Length" },
    zIndex: { type: "integer" },
    transform: {
      type: "object",
      additionalProperties: false,
      properties: {
        translateX: { $ref: "#/definitions/Length" },
        translateY: { $ref: "#/definitions/Length" },
        rotateDeg: { type: "number" },
        scale: { type: "number", minimum: 0 },
      },
    },
  },
}

export const flexGroupSchema = {
  title: "Flex",
  type: "object",
  additionalProperties: false,
  properties: {
    direction: {
      type: "string",
      enum: ["row", "column", "row-reverse", "column-reverse"],
    },
    justify: {
      type: "string",
      enum: [
        "flex-start",
        "center",
        "flex-end",
        "space-between",
        "space-around",
        "space-evenly",
      ],
    },
    align: {
      type: "string",
      enum: ["stretch", "flex-start", "center", "flex-end", "baseline"],
    },
    wrap: { type: "string", enum: ["nowrap", "wrap"] },
  },
}

export const gridGroupSchema = {
  title: "Grid",
  type: "object",
  additionalProperties: false,
  properties: {
    columns: { type: "integer", minimum: 1, maximum: 24 },
    rows: { type: "integer", minimum: 1, maximum: 24 },
    columnGap: { $ref: "#/definitions/Length" },
    rowGap: { $ref: "#/definitions/Length" },
    justifyItems: { type: "string", enum: ["start", "center", "end", "stretch"] },
    alignItems: { type: "string", enum: ["start", "center", "end", "stretch"] },
  },
}

export const backgroundGroupSchema = {
  title: "Background",
  type: "object",
  additionalProperties: false,
  properties: {
    type: { type: "string", enum: ["none", "color", "gradient", "image"] },
    color: { $ref: "#/definitions/Color" },
    gradient: {
      type: "object",
      additionalProperties: false,
      properties: {
        kind: { type: "string", enum: ["linear"] },
        angleDeg: { type: "number", minimum: 0, maximum: 360 },
        stops: {
          type: "array",
          minItems: 2,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              color: { $ref: "#/definitions/Color" },
              pos: { $ref: "#/definitions/Percent" },
            },
            required: ["color", "pos"],
          },
        },
      },
      required: ["kind", "angleDeg", "stops"],
    },
    image: {
      type: "object",
      additionalProperties: false,
      properties: {
        assetId: { type: "string" },
        url: { type: "string" },
        fit: { type: "string", enum: ["cover", "contain"] },
        position: { type: "string", enum: ["center", "top", "bottom", "left", "right"] },
        repeat: { type: "string", enum: ["no-repeat", "repeat"] },
      },
    },
  },
}

export const borderGroupSchema = {
  title: "Border",
  type: "object",
  additionalProperties: false,
  properties: {
    width: { $ref: "#/definitions/Length" },
    style: { type: "string", enum: ["solid", "dashed", "dotted", "none"] },
    color: { $ref: "#/definitions/Color" },
    radius: { $ref: "#/definitions/Radius4" },
  },
}

export const effectsGroupSchema = {
  title: "Effects",
  type: "object",
  additionalProperties: false,
  properties: {
    opacity: { type: "number", minimum: 0, maximum: 1 },
    shadow: {
      oneOf: [{ type: "null" }, { $ref: "#/definitions/Shadow" }],
    },
  },
}

export const typographyGroupSchema = {
  title: "Typography",
  type: "object",
  additionalProperties: false,
  properties: {
    fontFamily: { oneOf: [{ $ref: "#/definitions/TokenVar" }, { type: "string" }] },
    fontSize: { $ref: "#/definitions/Length" },
    lineHeight: { type: "number", minimum: 0 },
    letterSpacing: { type: "number" },
    fontWeight: { type: "integer", minimum: 100, maximum: 900 },
    textAlign: { type: "string", enum: ["left", "center", "right", "justify"] },
    transform: { type: "string", enum: ["none", "uppercase", "lowercase", "capitalize"] },
    decoration: { type: "string", enum: ["none", "underline", "line-through"] },
    color: { $ref: "#/definitions/Color" },
  },
}

export const transitionGroupSchema = {
  title: "Transition",
  type: "object",
  additionalProperties: false,
  properties: {
    preset: { type: "string", enum: ["none", "fast", "base", "slow"] },
    easing: { type: "string", enum: ["linear", "ease", "ease-in", "ease-out", "ease-in-out"] },
  },
}

const styleSchemaDefinitionsAll = {
  ...styleSchemaDefinitions,
  LayoutGroup: layoutGroupSchema,
  SpacingGroup: spacingGroupSchema,
  PositionGroup: positionGroupSchema,
  FlexGroup: flexGroupSchema,
  GridGroup: gridGroupSchema,
  BackgroundGroup: backgroundGroupSchema,
  BorderGroup: borderGroupSchema,
  EffectsGroup: effectsGroupSchema,
  TypographyGroup: typographyGroupSchema,
  TransitionGroup: transitionGroupSchema,
}

export const styleLayerSchema: JSONSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    layout: { $ref: "#/definitions/LayoutGroup" },
    spacing: { $ref: "#/definitions/SpacingGroup" },
    position: { $ref: "#/definitions/PositionGroup" },
    flex: { $ref: "#/definitions/FlexGroup" },
    grid: { $ref: "#/definitions/GridGroup" },
    background: { $ref: "#/definitions/BackgroundGroup" },
    border: { $ref: "#/definitions/BorderGroup" },
    effects: { $ref: "#/definitions/EffectsGroup" },
    typography: { $ref: "#/definitions/TypographyGroup" },
    transition: { $ref: "#/definitions/TransitionGroup" },
  },
  definitions: styleSchemaDefinitionsAll,
}

export const styleSchema: JSONSchema = {
  title: "StyleObject",
  type: "object",
  additionalProperties: false,
  properties: {
    base: { $ref: "#/definitions/StyleLayer" },
    breakpoints: {
      type: "object",
      additionalProperties: false,
      properties: {
        sm: { $ref: "#/definitions/StyleLayer" },
        md: { $ref: "#/definitions/StyleLayer" },
        lg: { $ref: "#/definitions/StyleLayer" },
      },
    },
    states: {
      type: "object",
      additionalProperties: false,
      properties: {
        hover: { $ref: "#/definitions/StyleLayer" },
        pressed: { $ref: "#/definitions/StyleLayer" },
        focus: { $ref: "#/definitions/StyleLayer" },
        disabled: { $ref: "#/definitions/StyleLayer" },
      },
    },
  },
  required: ["base"],
  definitions: {
    ...styleSchemaDefinitionsAll,
    StyleLayer: styleLayerSchema,
  },
}

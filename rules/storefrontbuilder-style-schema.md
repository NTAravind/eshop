# Storefront Builder Style Schema Spec (Framer-Like)

This document defines the canonical `node.styles` shape and reusable JSONSchema fragments for schema-driven style editing in the Builder Inspector.

Goals:
- Framer-like grouped controls (Layout, Spacing, Typography, Background, Border, Effects, Position, States, Responsive).
- Strict, safe subset of styling (no arbitrary CSS injection).
- Supports breakpoint and state overrides without introducing logic.

---

## 1) Canonical Style Object Shape

Recommended `LayoutNode.styles` structure:

- `base`: default styles (applies everywhere)
- `breakpoints`: per-breakpoint overrides
- `states`: interaction state overrides (visual only)

Example:
```json
{
  "styles": {
    "base": {
      "layout": { "display": "flex", "width": "100%", "overflow": "hidden" },
      "spacing": { "padding": { "top": 24, "right": 24, "bottom": 24, "left": 24 }, "gap": 12 },
      "background": { "type": "color", "color": "var(--surface)" },
      "border": { "radius": { "tl": 16, "tr": 16, "br": 16, "bl": 16 } }
    },
    "breakpoints": {
      "sm": {
        "spacing": { "padding": { "left": 16, "right": 16 } }
      }
    },
    "states": {
      "hover": { "effects": { "opacity": 0.92 } },
      "focus": { "border": { "width": 2, "color": "var(--focus)" } }
    }
  }
}
```

---

## 2) Inspector Grouping Map (Framer-Like)

Each top-level group in `base` maps to an Inspector section:
- `layout`
- `spacing`
- `position`
- `flex` (containers)
- `grid` (containers)
- `background`
- `border`
- `effects`
- `typography` (text-like components)
- `transition` (optional; applies to state changes)

Breakpoints UI:
- user selects `Base | sm | md | lg`
- edits write to `styles.base` or `styles.breakpoints[breakpointKey]`

States UI:
- user selects `hover | pressed | focus | disabled`
- edits write to `styles.states[stateKey]`

---

## 3) Schema Conventions (Safety)

- Prefer structured values (numbers, enums, objects) over raw CSS strings.
- Allow *theme tokens* via CSS var strings: `var(--token-name)`.
- Disallow unknown keys at group level (`additionalProperties: false`), so schema remains strict.
- If you need to allow future keys, add them explicitly and bump `layout.version`.

---

## 4) Shared Definitions (JSONSchema7)

Put these under `definitions` and reuse via `$ref`.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "TokenVar": {
      "type": "string",
      "pattern": "^var\\(--[a-z0-9-]+\\)$",
      "description": "Theme token reference in CSS var form, e.g. var(--surface)"
    },
    "NumberPx": {
      "type": "number",
      "description": "Numeric values are interpreted as px by the renderer"
    },
    "Length": {
      "oneOf": [
        { "$ref": "#/definitions/NumberPx" },
        { "$ref": "#/definitions/TokenVar" }
      ],
      "description": "Safe length subset: number(px) or theme token var()"
    },
    "Percent": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "Color": {
      "oneOf": [
        { "$ref": "#/definitions/TokenVar" },
        { "type": "string", "pattern": "^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$" }
      ],
      "description": "Safe colors: theme token var() or #RRGGBB/#RRGGBBAA"
    },
    "Box4": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "top": { "$ref": "#/definitions/Length" },
        "right": { "$ref": "#/definitions/Length" },
        "bottom": { "$ref": "#/definitions/Length" },
        "left": { "$ref": "#/definitions/Length" }
      }
    },
    "Radius4": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "tl": { "$ref": "#/definitions/Length" },
        "tr": { "$ref": "#/definitions/Length" },
        "br": { "$ref": "#/definitions/Length" },
        "bl": { "$ref": "#/definitions/Length" }
      }
    },
    "Shadow": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "x": { "$ref": "#/definitions/Length" },
        "y": { "$ref": "#/definitions/Length" },
        "blur": { "$ref": "#/definitions/Length" },
        "spread": { "$ref": "#/definitions/Length" },
        "color": { "$ref": "#/definitions/Color" },
        "inset": { "type": "boolean" }
      },
      "required": ["x", "y", "blur", "color"]
    }
  }
}
```

---

## 5) Style Group Schemas (Reusable Fragments)

### 5.1 Layout Group
```json
{
  "title": "Layout",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "display": { "type": "string", "enum": ["block", "flex", "grid", "none"] },
    "width": { "$ref": "#/definitions/Length" },
    "height": { "$ref": "#/definitions/Length" },
    "minWidth": { "$ref": "#/definitions/Length" },
    "maxWidth": { "$ref": "#/definitions/Length" },
    "minHeight": { "$ref": "#/definitions/Length" },
    "maxHeight": { "$ref": "#/definitions/Length" },
    "aspectRatio": { "type": "number", "minimum": 0 },
    "overflow": { "type": "string", "enum": ["visible", "hidden", "scroll", "auto"] },
    "visibility": { "type": "string", "enum": ["visible", "hidden"] }
  }
}
```

### 5.2 Spacing Group
```json
{
  "title": "Spacing",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "margin": { "$ref": "#/definitions/Box4" },
    "padding": { "$ref": "#/definitions/Box4" },
    "gap": { "$ref": "#/definitions/Length" }
  }
}
```

### 5.3 Position Group
```json
{
  "title": "Position",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "position": { "type": "string", "enum": ["relative", "absolute", "sticky", "fixed"] },
    "top": { "$ref": "#/definitions/Length" },
    "right": { "$ref": "#/definitions/Length" },
    "bottom": { "$ref": "#/definitions/Length" },
    "left": { "$ref": "#/definitions/Length" },
    "zIndex": { "type": "integer" },
    "transform": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "translateX": { "$ref": "#/definitions/Length" },
        "translateY": { "$ref": "#/definitions/Length" },
        "rotateDeg": { "type": "number" },
        "scale": { "type": "number", "minimum": 0 }
      }
    }
  }
}
```

### 5.4 Flex Group (Containers)
```json
{
  "title": "Flex",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "direction": { "type": "string", "enum": ["row", "column", "row-reverse", "column-reverse"] },
    "justify": { "type": "string", "enum": ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] },
    "align": { "type": "string", "enum": ["stretch", "flex-start", "center", "flex-end", "baseline"] },
    "wrap": { "type": "string", "enum": ["nowrap", "wrap"] }
  }
}
```

### 5.5 Grid Group (Containers)
```json
{
  "title": "Grid",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "columns": { "type": "integer", "minimum": 1, "maximum": 24 },
    "rows": { "type": "integer", "minimum": 1, "maximum": 24 },
    "columnGap": { "$ref": "#/definitions/Length" },
    "rowGap": { "$ref": "#/definitions/Length" },
    "justifyItems": { "type": "string", "enum": ["start", "center", "end", "stretch"] },
    "alignItems": { "type": "string", "enum": ["start", "center", "end", "stretch"] }
  }
}
```

### 5.6 Background Group
```json
{
  "title": "Background",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "type": { "type": "string", "enum": ["none", "color", "gradient", "image"] },
    "color": { "$ref": "#/definitions/Color" },
    "gradient": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "kind": { "type": "string", "enum": ["linear"] },
        "angleDeg": { "type": "number", "minimum": 0, "maximum": 360 },
        "stops": {
          "type": "array",
          "minItems": 2,
          "maxItems": 6,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "color": { "$ref": "#/definitions/Color" },
              "pos": { "$ref": "#/definitions/Percent" }
            },
            "required": ["color", "pos"]
          }
        }
      },
      "required": ["kind", "angleDeg", "stops"]
    },
    "image": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "assetId": { "type": "string" },
        "url": { "type": "string" },
        "fit": { "type": "string", "enum": ["cover", "contain"] },
        "position": { "type": "string", "enum": ["center", "top", "bottom", "left", "right"] },
        "repeat": { "type": "string", "enum": ["no-repeat", "repeat"] }
      }
    }
  }
}
```

### 5.7 Border Group
```json
{
  "title": "Border",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "width": { "$ref": "#/definitions/Length" },
    "style": { "type": "string", "enum": ["solid", "dashed", "dotted", "none"] },
    "color": { "$ref": "#/definitions/Color" },
    "radius": { "$ref": "#/definitions/Radius4" }
  }
}
```

### 5.8 Effects Group
```json
{
  "title": "Effects",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "opacity": { "type": "number", "minimum": 0, "maximum": 1 },
    "shadow": {
      "oneOf": [
        { "type": "null" },
        { "$ref": "#/definitions/Shadow" }
      ]
    }
  }
}
```

### 5.9 Typography Group (Text-like components)
```json
{
  "title": "Typography",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "fontFamily": { "oneOf": [{ "$ref": "#/definitions/TokenVar" }, { "type": "string" }] },
    "fontSize": { "$ref": "#/definitions/Length" },
    "lineHeight": { "type": "number", "minimum": 0 },
    "letterSpacing": { "type": "number" },
    "fontWeight": { "type": "integer", "minimum": 100, "maximum": 900 },
    "textAlign": { "type": "string", "enum": ["left", "center", "right", "justify"] },
    "transform": { "type": "string", "enum": ["none", "uppercase", "lowercase", "capitalize"] },
    "decoration": { "type": "string", "enum": ["none", "underline", "line-through"] },
    "color": { "$ref": "#/definitions/Color" }
  }
}
```

### 5.10 Transition Group (Optional, Safe Presets)
```json
{
  "title": "Transition",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "preset": { "type": "string", "enum": ["none", "fast", "base", "slow"] },
    "easing": { "type": "string", "enum": ["linear", "ease", "ease-in", "ease-out", "ease-in-out"] }
  }
}
```

---

## 6) Composite Style Schema (What `node.styles` Validates Against)

This is the schema you can embed as the common base for most components:

```json
{
  "title": "StyleObject",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "base": { "$ref": "#/definitions/StyleLayer" },
    "breakpoints": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "sm": { "$ref": "#/definitions/StyleLayer" },
        "md": { "$ref": "#/definitions/StyleLayer" },
        "lg": { "$ref": "#/definitions/StyleLayer" }
      }
    },
    "states": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "hover": { "$ref": "#/definitions/StyleLayer" },
        "pressed": { "$ref": "#/definitions/StyleLayer" },
        "focus": { "$ref": "#/definitions/StyleLayer" },
        "disabled": { "$ref": "#/definitions/StyleLayer" }
      }
    }
  },
  "required": ["base"],
  "definitions": {
    "StyleLayer": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "layout": { "$ref": "#/definitions/LayoutGroup" },
        "spacing": { "$ref": "#/definitions/SpacingGroup" },
        "position": { "$ref": "#/definitions/PositionGroup" },
        "flex": { "$ref": "#/definitions/FlexGroup" },
        "grid": { "$ref": "#/definitions/GridGroup" },
        "background": { "$ref": "#/definitions/BackgroundGroup" },
        "border": { "$ref": "#/definitions/BorderGroup" },
        "effects": { "$ref": "#/definitions/EffectsGroup" },
        "typography": { "$ref": "#/definitions/TypographyGroup" },
        "transition": { "$ref": "#/definitions/TransitionGroup" }
      }
    }
  }
}
```

Note:
- You will typically inline or `$ref` the group schemas into `definitions` as `LayoutGroup`, `SpacingGroup`, etc.
- Components should opt-in to groups (e.g. `Text` includes `typography`, `Image` may exclude it).

---

## 7) Component-Specific Style Schemas (Pattern)

Each `ComponentDefinition.styleSchema` should be composed from the shared `StyleObject` plus constraints:
- For leaf components, you may disallow container-only groups (`flex`, `grid`).
- For text components, include `typography`.
- For container components, include `flex`/`grid`.

Example policy:
- `Container`: allow `layout`, `spacing`, `background`, `border`, `effects`, `position`, `flex`, `grid`, `transition`
- `Text`: allow `layout`, `spacing`, `typography`, `effects`, `position`, `transition`
- `Button`: allow `layout`, `spacing`, `typography`, `background`, `border`, `effects`, `position`, `transition`, and state overrides

---

## 8) Rendering Rules (So Output Is Predictable)

Renderer should:
- Interpret all numeric `Length` values as px.
- Pass token vars through unchanged (e.g. `var(--space-4)`).
- For `states`, merge layers in order: `base` -> `breakpoint` -> `state` (last wins).
- For unsupported groups on a component (e.g. `typography` on `Image`), ignore safely or block via schema.

---

## 9) Minimum Theme Tokens (Recommended)

Even with strict values, tokens make the editor feel designed:
- Colors: `--surface`, `--surface-2`, `--text`, `--muted`, `--brand`, `--brand-contrast`, `--focus`
- Spacing: `--space-1..--space-10`
- Radii: `--radius-sm`, `--radius-md`, `--radius-lg`
- Shadows: (if tokenizing) `--shadow-sm`, `--shadow-md`
- Type: `--font-body`, `--font-display`

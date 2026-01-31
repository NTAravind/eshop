"use client"

import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { ComponentDefinition, LayoutNode, StyleLayer, StyleObject } from "@/types/builder"
import { styleLayerSchema } from "@/lib/builder/style-schema"
import { actionRegistry, registerCoreActions } from "@/lib/builder/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Paintbrush, Settings } from "lucide-react"

interface InspectorProps {
  node: LayoutNode | null
  definition?: ComponentDefinition
  onUpdate: (updater: (node: LayoutNode) => LayoutNode) => void
  onDelete: () => void
}

type StyleLayerKey = "base" | "sm" | "md" | "lg" | "hover" | "pressed" | "focus" | "disabled"

export function Inspector({ node, definition, onUpdate, onDelete }: InspectorProps) {
  registerCoreActions()

  const [styleLayer, setStyleLayer] = useState<StyleLayerKey>("base")
  const [actionPayloadDrafts, setActionPayloadDrafts] = useState<Record<string, string>>({})

  const actionOptions = actionRegistry.list()
  const bindingTargets = useMemo(() => {
    const schema = definition?.bindingSchema as Record<string, unknown> | undefined
    const properties = schema?.properties as Record<string, unknown> | undefined
    const targets = properties ? Object.keys(properties) : []
    if (node?.bindings) {
      Object.keys(node.bindings).forEach((key) => {
        if (!targets.includes(key)) {
          targets.push(key)
        }
      })
    }
    return targets
  }, [definition?.bindingSchema, node?.bindings])

  if (!node || !definition) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
        Select a component to edit
      </div>
    )
  }

  const handlePropsChange = (nextProps: Record<string, unknown>) => {
    onUpdate((prev) => ({ ...prev, props: nextProps }))
  }

  const handleBindingsChange = (nextBindings: Record<string, string>) => {
    onUpdate((prev) => ({ ...prev, bindings: nextBindings }))
  }

  const handleActionsChange = (nextActions: LayoutNode["actions"]) => {
    onUpdate((prev) => ({ ...prev, actions: nextActions }))
  }

  const handleStylesChange = (nextLayer: StyleLayer) => {
    onUpdate((prev) => {
      const nextStyles: StyleObject = { ...prev.styles, base: prev.styles.base || {} }

      if (styleLayer === "base") {
        nextStyles.base = nextLayer
      } else if (["sm", "md", "lg"].includes(styleLayer)) {
        nextStyles.breakpoints = {
          ...(nextStyles.breakpoints || {}),
          [styleLayer]: nextLayer,
        }
      } else {
        nextStyles.states = {
          ...(nextStyles.states || {}),
          [styleLayer]: nextLayer,
        }
      }

      return { ...prev, styles: nextStyles }
    })
  }

  const currentLayer = getStyleLayer(node.styles, styleLayer)
  const styleDefinitions = (styleLayerSchema as Record<string, unknown>)
    .definitions as Record<string, Record<string, unknown>>

  const styleGroups = [
    { key: "LayoutGroup", label: "Layout", dataKey: "layout" },
    { key: "SpacingGroup", label: "Spacing", dataKey: "spacing" },
    { key: "PositionGroup", label: "Position", dataKey: "position" },
    { key: "FlexGroup", label: "Flex", dataKey: "flex" },
    { key: "GridGroup", label: "Grid", dataKey: "grid" },
    { key: "BackgroundGroup", label: "Background", dataKey: "background" },
    { key: "BorderGroup", label: "Border", dataKey: "border" },
    { key: "EffectsGroup", label: "Effects", dataKey: "effects" },
    { key: "TypographyGroup", label: "Typography", dataKey: "typography" },
    { key: "TransitionGroup", label: "Transition", dataKey: "transition" },
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{definition.displayName}</div>
          <div className="text-xs text-muted-foreground">{node.type}</div>
        </div>
        <Button variant="outline" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>

      <Tabs defaultValue="settings" className="flex h-full flex-col">
        <div className="border-b px-3 py-2">
          <TabsList className="h-10 w-full justify-start gap-2 bg-transparent">
            <TabsTrigger
              value="settings"
              className="h-10 px-4 data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="text-xs">Settings</span>
            </TabsTrigger>
            <TabsTrigger
              value="styles"
              className="h-10 px-4 data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              <Paintbrush className="mr-2 h-4 w-4" />
              <span className="text-xs">Styles</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="h-full overflow-auto px-3 py-4">
          <div className="flex flex-col gap-3">
            <AccordionSection title="Props" defaultOpen>
              <SchemaEditor
                schema={definition.propsSchema}
                value={node.props}
                onChange={handlePropsChange}
              />
            </AccordionSection>

            <AccordionSection title="Bindings" defaultOpen>
              {bindingTargets.length === 0 && (
                <div className="text-sm text-muted-foreground">No bindable fields for this component.</div>
              )}
              <div className="flex flex-col gap-3">
                {bindingTargets.map((target) => (
                  <div key={target} className="space-y-2">
                    <Label>{target}</Label>
                    <Input
                      value={node.bindings?.[target] || ""}
                      placeholder="e.g. product.name"
                      onChange={(event) =>
                        handleBindingsChange({
                          ...node.bindings,
                          [target]: event.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Actions" defaultOpen>
              {(definition.actions || []).length === 0 && (
                <div className="text-sm text-muted-foreground">No actions available for this component.</div>
              )}
              <div className="flex flex-col gap-4">
                {(definition.actions || []).map((slot) => {
                  const currentAction = node.actions?.[slot.name]
                  const payloadKey = `${node.id}:${slot.name}`
                  const payloadValue =
                    actionPayloadDrafts[payloadKey] || JSON.stringify(currentAction?.payload || {}, null, 2)

                  return (
                    <div key={slot.name} className="rounded-md border p-3">
                      <div className="mb-2 text-sm font-semibold">{slot.label}</div>
                      <div className="space-y-2">
                        <Label>Action</Label>
                        <Select
                          value={currentAction?.actionId}
                          onValueChange={(value) =>
                            handleActionsChange({
                              ...node.actions,
                              [slot.name]: {
                                actionId: value as LayoutNode["actions"][string]["actionId"],
                                payload: currentAction?.payload || {},
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            {actionOptions.map((action) => (
                              <SelectItem key={action.id} value={action.id}>
                                {action.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Label>Payload (JSON)</Label>
                        <Textarea
                          value={payloadValue}
                          onChange={(event) =>
                            setActionPayloadDrafts((prev) => ({
                              ...prev,
                              [payloadKey]: event.target.value,
                            }))
                          }
                          onBlur={() => {
                            try {
                              const parsed = JSON.parse(payloadValue)
                              handleActionsChange({
                                ...node.actions,
                                [slot.name]: {
                                  actionId: currentAction?.actionId || actionOptions[0]?.id,
                                  payload: parsed,
                                },
                              })
                            } catch (error) {
                              console.warn("Invalid JSON payload", error)
                            }
                          }}
                          rows={4}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </AccordionSection>
          </div>
        </TabsContent>

        <TabsContent value="styles" className="h-full overflow-auto px-3 py-4">
          <div className="mb-3 flex items-center justify-between">
            <Label>Layer</Label>
            <Select value={styleLayer} onValueChange={(value) => setStyleLayer(value as StyleLayerKey)}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="sm">Breakpoint sm</SelectItem>
                <SelectItem value="md">Breakpoint md</SelectItem>
                <SelectItem value="lg">Breakpoint lg</SelectItem>
                <SelectItem value="hover">State hover</SelectItem>
                <SelectItem value="pressed">State pressed</SelectItem>
                <SelectItem value="focus">State focus</SelectItem>
                <SelectItem value="disabled">State disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            {styleGroups.map((group) => {
              const groupSchema = styleDefinitions?.[group.key]
              if (!groupSchema) {
                return null
              }

              const groupValue =
                ((currentLayer as Record<string, unknown>) || {})[group.dataKey] || {}

              return (
                <AccordionSection key={group.key} title={group.label}>
                  <SchemaEditor
                    schema={{
                      type: "object",
                      properties: groupSchema.properties || {},
                      definitions: styleDefinitions,
                    }}
                    value={groupValue as Record<string, unknown>}
                    onChange={(nextValue) => {
                      const nextLayer = {
                        ...(currentLayer as Record<string, unknown>),
                        [group.dataKey]: nextValue,
                      }
                      handleStylesChange(nextLayer as StyleLayer)
                    }}
                  />
                </AccordionSection>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface SchemaEditorProps {
  schema: Record<string, unknown>
  value: Record<string, unknown>
  onChange: (nextValue: Record<string, unknown>) => void
}

function SchemaEditor({ schema, value, onChange }: SchemaEditorProps) {
  const resolved = resolveSchema(schema)
  if (!resolved || resolved.type !== "object") {
    return null
  }

  const properties = (resolved.properties || {}) as Record<string, Record<string, unknown>>
  const definitions = (resolved.definitions || {}) as Record<string, Record<string, unknown>>

  return (
    <div className="space-y-3">
      {Object.entries(properties).map(([key, childSchema]) => (
        <SchemaField
          key={key}
          label={key}
          schema={childSchema}
          value={value?.[key]}
          definitions={definitions}
          onChange={(next) => onChange({ ...value, [key]: next })}
        />
      ))}
    </div>
  )
}

interface SchemaFieldProps {
  label: string
  schema: Record<string, unknown>
  value: unknown
  definitions?: Record<string, Record<string, unknown>>
  onChange: (nextValue: unknown) => void
}

function SchemaField({ label, schema, value, onChange, definitions }: SchemaFieldProps) {
  const resolved = resolveSchema(schema, definitions)

  if (!resolved) {
    return null
  }

  if (resolved.type === "object" && resolved.properties) {
    const properties = resolved.properties as Record<string, Record<string, unknown>>
    return (
      <div className="space-y-2 rounded-md border p-3">
        <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
        <div className="space-y-3">
          {Object.entries(properties).map(([childKey, childSchema]) => (
            <SchemaField
              key={childKey}
              label={childKey}
              schema={childSchema}
              value={(value as Record<string, unknown>)?.[childKey]}
              definitions={definitions}
              onChange={(next) => {
                const current = (value as Record<string, unknown>) || {}
                onChange({ ...current, [childKey]: next })
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (resolved.enum) {
    const options = resolved.enum as string[]
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select
          value={value as string}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  if (resolved.type === "boolean") {
    return (
      <label className="flex items-center justify-between gap-2 text-sm">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
      </label>
    )
  }

  if (resolved.type === "number" || resolved.type === "integer") {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type="number"
          value={(value as number | string) ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={(value as string) || ""} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

interface AccordionSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

function AccordionSection({ title, children, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      {open && <div className="border-t px-3 py-3">{children}</div>}
    </div>
  )
}

function resolveSchema(
  schema: Record<string, unknown>,
  definitions?: Record<string, Record<string, unknown>>
) {
  if (!schema) {
    return null
  }

  if (schema.$ref && typeof schema.$ref === "string") {
    const ref = schema.$ref as string
    const key = ref.replace("#/definitions/", "")
    const schemaDefinitions = schema.definitions as Record<string, Record<string, unknown>> | undefined
    if (schemaDefinitions?.[key]) {
      return schemaDefinitions[key]
    }
    if (definitions?.[key]) {
      return definitions[key]
    }
  }

  if (schema.definitions) {
    return schema
  }

  return schema
}

function getStyleLayer(styles: StyleObject, layer: StyleLayerKey) {
  if (layer === "base") {
    return styles.base || {}
  }
  if (["sm", "md", "lg"].includes(layer)) {
    return styles.breakpoints?.[layer] || {}
  }
  return styles.states?.[layer] || {}
}

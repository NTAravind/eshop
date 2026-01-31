"use client"

import { componentRegistry, registerCoreComponents } from "@/lib/builder/registry"
import { Button } from "@/components/ui/button"

interface PaletteProps {
  onAdd: (type: string) => void
}

export function Palette({ onAdd }: PaletteProps) {
  registerCoreComponents()

  const components = componentRegistry.list()
  const grouped = components.reduce<Record<string, typeof components>>((acc, component) => {
    const key = component.category
    acc[key] = acc[key] || []
    acc[key].push(component)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="text-xs font-semibold uppercase text-muted-foreground">Components</div>
      <div className="flex flex-col gap-3">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-foreground/70">{category}</div>
            <div className="grid grid-cols-1 gap-2">
              {items.map((component) => (
                <Button
                  key={component.type}
                  variant="outline"
                  size="sm"
                  className="justify-start cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("component-type", component.type)
                    e.dataTransfer.effectAllowed = "copy"
                  }}
                  onClick={() => onAdd(component.type)}
                >
                  {component.displayName}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

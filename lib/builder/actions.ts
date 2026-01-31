import type { ActionDefinition, ActionID, RuntimeContext } from "@/types/builder"

type ActionMap = Record<ActionID, ActionDefinition>

class ActionRegistry {
  private actions: Partial<ActionMap> = {}

  register(action: ActionDefinition) {
    this.actions[action.id] = action
  }

  get(id: ActionID) {
    return this.actions[id]
  }

  list() {
    return Object.values(this.actions).filter(Boolean) as ActionDefinition[]
  }
}

export const actionRegistry = new ActionRegistry()

const emptyPayloadSchema = {
  type: "object",
  additionalProperties: true,
}

export function registerCoreActions() {
  if (actionRegistry.list().length > 0) {
    return
  }

  const makeHandler = (label: string) => async (payload: Record<string, unknown>, context: RuntimeContext) => {
    console.info(`[Action] ${label}`, { payload, context })
  }

  actionRegistry.register({
    id: "ADD_TO_CART",
    label: "Add To Cart",
    payloadSchema: emptyPayloadSchema,
    handler: makeHandler("ADD_TO_CART"),
  })

  actionRegistry.register({
    id: "BUY_NOW",
    label: "Buy Now",
    payloadSchema: emptyPayloadSchema,
    handler: makeHandler("BUY_NOW"),
  })

  actionRegistry.register({
    id: "SELECT_VARIANT",
    label: "Select Variant",
    payloadSchema: emptyPayloadSchema,
    handler: makeHandler("SELECT_VARIANT"),
  })

  actionRegistry.register({
    id: "SET_DELIVERY_MODE",
    label: "Set Delivery Mode",
    payloadSchema: emptyPayloadSchema,
    handler: makeHandler("SET_DELIVERY_MODE"),
  })

  actionRegistry.register({
    id: "APPLY_DISCOUNT",
    label: "Apply Discount",
    payloadSchema: emptyPayloadSchema,
    handler: makeHandler("APPLY_DISCOUNT"),
  })

  actionRegistry.register({
    id: "OPEN_DRAWER",
    label: "Open Drawer",
    payloadSchema: emptyPayloadSchema,
    handler: makeHandler("OPEN_DRAWER"),
  })

  actionRegistry.register({
    id: "NAVIGATE",
    label: "Navigate",
    payloadSchema: emptyPayloadSchema,
    handler: makeHandler("NAVIGATE"),
  })
}

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"])

export function resolveBindingPath(path: string, context: Record<string, unknown>) {
  if (!path || typeof path !== "string") {
    return undefined
  }

  const tokens = parsePath(path)
  if (!tokens.length) {
    return undefined
  }

  let current: unknown = context
  for (const token of tokens) {
    if (current == null) {
      return undefined
    }

    if (typeof token === "string") {
      if (FORBIDDEN_KEYS.has(token)) {
        return undefined
      }
      if (typeof current !== "object") {
        return undefined
      }
      current = (current as Record<string, unknown>)[token]
    } else {
      if (!Array.isArray(current)) {
        return undefined
      }
      current = current[token]
    }
  }

  return current
}

export function resolveBindings(
  bindings: Record<string, string>,
  context: Record<string, unknown>
) {
  const resolved: Record<string, unknown> = {}
  Object.entries(bindings || {}).forEach(([key, path]) => {
    const value = resolveBindingPath(path, context)
    if (value !== undefined) {
      resolved[key] = value
    }
  })
  return resolved
}

function parsePath(path: string) {
  const tokens: Array<string | number> = []
  const regex = /([^.[\]]+)|\[(\d+)\]/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(path))) {
    if (match[1]) {
      tokens.push(match[1])
    } else if (match[2]) {
      tokens.push(Number(match[2]))
    }
  }

  return tokens
}

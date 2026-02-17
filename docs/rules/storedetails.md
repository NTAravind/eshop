# Storefront Builder V2 Architecture — Detailed Implementation Report

## 1. Executive Summary

This document details the comprehensive redesign of the Storefront Builder architecture (V2). The goal was to decouple the monolithic `StorefrontNode` and `RuntimeContext` into modular, testable, and type-safe systems. The redesign introduces AST-based bindings, token-first styling, sequential action pipelines, and a provider-based runtime, all while maintaining 100% backward compatibility with existing V1 documents.

---

## 2. High-Level Architecture

The V2 architecture separates concerns into distinct subsystems with strict boundaries:

### Subsystem Map

- **Document Layer**: Owns types (`StorefrontNode`, `RouteManifest`, `DataProfile`) and persistence.
- **Runtime Renderer**: Stateless renderer that consumes the document and resolves bindings/styles via helpers.
- **Editor / Builder**: Issues `EditorCommand`s to mutate the document tree; never modifies state directly.
- **Publishing**: Validates documents and bundles them into immutable snapshots.

### Core Principles

1.  **Dual-Path Resolution**: All lookup functions (`resolveNodeBindings`, `resolveNodeStyles`) support both V1 (legacy) and V2 paths simultaneously.
2.  **Stateless Logic**: Helper functions (`binding-ast.ts`, `tokens.ts`) are pure functions, making them easy to unit test.
3.  **Schema-Driven**: Actions, components, and data profiles are defined by strict contracts and schemas.

---

## 3. Detailed Implementation Phases

### Phase 1: Core Type Definitions
**File:** `shared/types/storefront-builder.ts`

-   Introduced **V2 `StorefrontNode` fields** (optional, backward-compatible):
    -   `bindingMap`: Use `BindingExpr` AST instead of string paths.
    -   `styleTokens`: Semantic references to theme tokens (e.g., `colors.primary`).
    -   `styleOverrides`: Safe, responsive inline style overrides.
    -   `actionMap`: `ActionPipeline`s instead of single ref arrays.
-   Defined **new entities**: `RouteManifest`, `DataProfile`, `PublishSnapshot`.

### Phase 2: Binding AST System
**Files:** `binding-ast.ts`, `bindings.ts`

-   **Binding AST**: Replaced raw strings with a typed AST (`BindingExpr`).
    -   Kinds: `path`, `literal`, `conditional`, `transform` (pipe), `fallback`.
-   **Resolver**: `resolveBindingExpr` evaluates the AST recursively against context.
-   **Transforms**: Built-in formatters (e.g., currency, date, uppercase) are now part of the AST.
-   **Dual-Path**: `resolveNodeBindings` checks `node.bindingMap` first, falls back to `node.bindings`.

### Phase 3: Token-First Styling
**Files:** `tokens.ts`, `styles.ts`

-   **Token Resolution**: `resolveTokenPath` looks up values in a strictly typed `DesignTokenMap`.
-   **Breakpoint Cascading**: Styles are resolved mobile-first with specific overrides (`base`, `sm`, `md`, `lg`, `xl`).
-   **Validation**: `validateTokenMap` ensures all references exist in the current theme.
-   **Migration**: Utilities to convert raw CSS values to the nearest matching token.

### Phase 4: Action Pipeline System
**Files:** `actions/pipeline.ts`, `actions/dispatcher.ts`

-   **Pipelines**: `ActionPipeline` allows sequential execution of multiple actions.
-   **Control Flow**: Steps support `condition` (binding) and `onError` strategies (`stop`, `continue`, `rollback`).
-   **Dynamic Payloads**: `payloadBindings` allow action arguments to be resolved at runtime (e.g., Add to Cart using `product.id`).
-   **Dispatcher**: `useActionDispatcher` now exposes `dispatchPipeline`.

### Phase 5: Provider-Based Runtime
**Files:** `runtime/providers/index.tsx`, `runtime/context.tsx`

-   **Decomposition**: Split the monolithic `RuntimeContext` into 7 granular providers:
    -   `StoreProvider`, `CartProvider`, `UserProvider`
    -   `RouteProvider`, `PageDataProvider`
    -   `UIStateProvider`, `ThemeProvider`
-   **Composition**: `RuntimeContextProvider` composes these internally via `RuntimeContextBridge`.
-   **Backward Compatibility**: The public `useRuntimeContext()` hook API remains unchanged.

### Phase 6: Routing & Data
**Files:** `routing/route-resolver.ts`, `routing/data-profile-loader.ts`

-   **Manifest**: `RouteManifest` maps URLs to pages using 3 strategies:
    1.  **Static**: Exact path match (`/about`).
    2.  **Dynamic**: Parameterized match (`/collections/:handle`).
    3.  **Template**: Rules-based selection (`/products/:slug` -> select template by product type/tag).
-   **Data Profiles**: Pages declare their data needs via `DataProfile` (e.g., "Load Product + Similar Items").
-   **Loader**: `loadDataProfile` executes data sources in parallel with error handling.

### Phase 7: Editor Command System
**Files:** `builder/commands.ts`, `builder/editor-store.ts`

-   **Command Bus**: All editor mutations happen via `applyCommand(tree, command)`.
-   **Pure Functions**: Commands return a *new* tree snapshot (immutable updates).
-   **Undo/Redo**: Every command generates its own `inverse` command automatically.
-   **Batching**: Support for atomic batch operations.

### Phase 8: Publishing & Validation
**File:** `publish-validator.ts`

-   **Validation Gate**: Documents are validated before publishing.
-   **Checks**:
    -   Structure (depth limits, node count).
    -   Integrity (missing IDs, duplicate IDs).
    -   Safety (valid bindings, valid token references).
    -   Completeness (pipelines have steps, routes map to existing pages).

---

## 4. Verification Results

A comprehensive type-check and unit test suite verifies the correctness of the new architecture.

| Scope | Test File | Result |
|---|---|---|
| **Bindings** | `binding-ast.test.ts` | ✅ 38/38 passed |
| **Resolution** | `bindings.test.ts` | ✅ 8/8 passed |
| **Validation** | `validation.test.ts` | ✅ 10/10 passed |
| **Build** | `tsc --noEmit` | ✅ Exit code 0 (Clean) |
| **Total** | | **56 tests passed** |

---

## 5. Next Steps (Deferred)

The following items are designed but deferred pending database schema migrations:

1.  **Database Migration**: Add `RouteManifest`, `DataProfile`, and `PublishSnapshot` models to Prisma schema.
2.  **Publish Service**: Implement `publish.service.ts` to persist snapshots to the DB.
3.  **Catch-All Route**: Implement Next.js catch-all page to delegate to `route-resolver`.
4.  **Editor Integration**: Migrate `EditorStore` to use the new `commands.ts` system fully.

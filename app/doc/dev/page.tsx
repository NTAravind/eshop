import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function BuilderDevDocPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Developers</Badge>
          <Badge variant="outline">Registry-first</Badge>
          <Badge variant="outline">Safe bindings</Badge>
          <Badge variant="outline">Actions + Zod</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Storefront builder</p>
          <h1 className="text-3xl font-semibold">Developer reference</h1>
          <p className="text-muted-foreground max-w-3xl">
            How the builder is structured, how documents are stored, how the
            renderer works, and how to add new components, bindings, and actions.
          </p>
        </div>
      </header>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Architecture</CardTitle>
          <CardDescription>Documents, theme, runtime, editor</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Documents</h3>
            <p>
              Prisma model StorefrontDocument(kind: LAYOUT | PAGE | TEMPLATE |
              PREFAB, key, status, tree JSON). Unique per store/kind/key/status.
              Templates use keys like PDP:&lt;productSchemaId&gt; with PDP:default fallback.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Theme</h3>
            <p>
              StorefrontTheme(status: DRAFT | PUBLISHED) stores CSS vars for shadcn
              tokens. Injected in app/store/[slug]/layout.tsx scoped to storefront
              root.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Runtime</h3>
            <p>
              Renderer loads published docs + theme, builds RuntimeContext
              (store/user/cart/product/collection/facets/orders/uiState), resolves
              bindings safely, applies styles, and executes declarative actions via
              server handlers.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Editor</h3>
            <p>
              Admin-only builder with palette + layers + canvas + inspector + undo/
              redo. Edits draft docs; publish flow promotes to live. Uses same
              renderer in editor mode with selection overlays.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registry contract</CardTitle>
          <CardDescription>What each component definition must expose</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Node shape</h3>
            <p>
              {"{ id, type, props, styles, bindings, actions, children }"}. Strict
              type key; no arbitrary components.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Props & Styles</h3>
            <p>
              propsSchema (inspector), styleSchema (whitelisted CSS props, base +
              breakpoints + states). Keep components pure and prop-driven.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Bindings</h3>
            <p>
              Safe paths only: a.b.c or a.b[0].c. No expressions. Binding resolver
              blocks proto keys, never executes code, returns undefined when
              missing.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Actions</h3>
            <p>
              Declarative slots mapped to actionIds. Zod-validated payloads. Server
              handlers enforce store isolation and auth.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Constraints</h3>
            <p>
              Slot only in layouts (exactly one). Spacer/Divider no children. Prefab
              instances reference existing prefabs. LayoutRefs ordered.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Repeater scope</h3>
            <p>
              Components like ProductsGrid, CartItems, OrdersPage provide scope
              variables (item, index) for descendant bindings.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions (built-ins)</CardTitle>
          <CardDescription>Server-validated behaviors</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Commerce</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{"ADD_TO_CART { variantId?, quantity?, openCart? }"}</li>
              <li>{"BUY_NOW { variantId?, quantity? } -> add then checkout"}</li>
              <li>{"SELECT_VARIANT { variantId } -> uiState.selectedVariantId"}</li>
              <li>{"SET_DELIVERY_MODE { mode }"}</li>
              <li>{"APPLY_DISCOUNT { code }"}</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">UI / Navigation</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{"OPEN_CART_SIDEBAR { open }"}</li>
              <li>{"NAVIGATE { href, replace? }"}</li>
            </ul>
            <p>
              Attach actions to explicit slots (onClick/onSubmit). payloadBindings let
              you read from context (e.g., selectedVariantId).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & bindings</CardTitle>
          <CardDescription>What contexts are available</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Context roots</h3>
            <p>
              store, settings, user, cart, route, uiState, collection, facets,
              product, similarProducts, orders. PDP templates also get
              productSchema/variant schema awareness for field pickers.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Schema-aware</h3>
            <p>
              ProductCard blocks and SchemaField expose product.customData field
              pickers based on productSchemaId. VariantSelector uses variant schema
              tied to the product type. Bindings remain simple paths.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Extending the registry</CardTitle>
          <CardDescription>Steps to add a new component</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-2 pl-5">
            <li>Create a pure renderer (no fetch) and add it to the registry map.</li>
            <li>Define propsSchema, styleSchema, defaults, constraints, bindingHints.</li>
            <li>Expose palette metadata so it appears in the builder Components tab.</li>
            <li>Update inspector forms to surface new props/bindings/actions.</li>
            <li>Add validation to document save/publish if the component has special constraints.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation & safety</CardTitle>
          <CardDescription>Prevent bad docs from going live</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Document checks</h3>
            <p>
              Node type must exist; layout must have one Slot; Spacer/Divider no
              children; prefab instances reference existing prefabs; layoutRefs exist
              and ordered.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Actions & payloads</h3>
            <p>Zod-validate payloads; server enforces store isolation and auth.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Bindings</h3>
            <p>Safe resolver forbids proto keys; returns undefined, never throws.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Theme</h3>
            <p>Draft/publish; inject scoped CSS vars to avoid admin bleed.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where to dive deeper</CardTitle>
          <CardDescription>Source-of-truth docs in /rules</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Architecture & flow</h3>
            <p>
              See `rules/storefront-builder-claude.md` for full architecture, phases,
              and acceptance criteria.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Registry specs</h3>
            <p>
              See `rules/storefront-builder-component-specs.md` for component/action
              contracts and default documents. Dev how-to is in
              `rules/storefront-builder-dev-guide.md`.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

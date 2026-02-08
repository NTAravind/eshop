import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function DocPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Path-based storefront</Badge>
          <Badge variant="outline">Framer-like editor</Badge>
          <Badge variant="outline">Shadcn components</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Storefront builder</p>
          <h1 className="text-3xl font-semibold">How the Storefront Builder works</h1>
          <p className="text-muted-foreground max-w-3xl">
            Compose layouts, pages, product templates, and prefabs with editable
            shadcn UI blocks. Bind data safely, attach actions like add-to-cart,
            and publish when ready.
          </p>
        </div>
      </header>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>For store owners</CardTitle>
            <CardDescription>Visual editing and publishing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Edit drafts in the builder (palette + layers + inspector). Publish to
                make changes live.
              </li>
              <li>
                Use the inspector tabs: Props (labels/toggles), Styles (spacing,
                layout, colors), Bindings (which data to show), Actions (what happens
                on click).
              </li>
              <li>
                Theme editor adjusts brand tokens (tweakcn-style). Preview, then
                publish the theme to apply site-wide.
              </li>
              <li>
                PDP templates are per product type; schema-aware fields let you drop
                custom data (e.g., material, size guide) into cards or detail pages.
              </li>
              <li>
                Cart, Checkout, Orders, Profile, Login are editable pages; Cart
                Sidebar lives in the global layout.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>For developers</CardTitle>
            <CardDescription>Registry, actions, and data bindings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Documents live in Prisma as StorefrontDocument (LAYOUT | PAGE |
                TEMPLATE | PREFAB) with draft/published status. Templates key to
                productSchemaId (PDP:&lt;schemaId&gt;).
              </li>
              <li>
                Registry components are pure and prop-driven. Provide propsSchema,
                styleSchema, constraints, defaults, bindingHints.
              </li>
              <li>
                Bindings are safe paths (e.g., product.customData.material);
                resolver blocks proto access and never executes code.
              </li>
              <li>
                Actions are declarative (ADD_TO_CART, BUY_NOW, SELECT_VARIANT,
                SET_DELIVERY_MODE, APPLY_DISCOUNT, OPEN_CART_SIDEBAR, NAVIGATE) with
                Zod-validated payloads and store-scoped handlers.
              </li>
              <li>
                Layouts must contain exactly one Slot; multiple layouts can wrap a
                page. PrefabInstance nodes reference PREFAB docs and allow overrides.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Concepts at a glance</CardTitle>
            <CardDescription>How pages are composed</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Layouts</h3>
              <p>
                Reusable wrappers (e.g., Global layout with navbar/footer/cart
                sheet). Must include one Slot. Pages/templates render inside.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Pages</h3>
              <p>Home, Collection, Cart, Checkout, Orders, Profile, Login.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Templates</h3>
              <p>
                PDP per product type (PDP:&lt;schemaId&gt;). Fallback to PDP:default when
                no specific template exists.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Prefabs</h3>
              <p>Reusable blocks you can drop anywhere; instances can be overridden or detached.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Bindings</h3>
              <p>
                Safe data paths: product fields, schema fields via customData, cart
                totals, user info, selected variant, delivery mode, filters.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">Theme</h3>
              <p>Draft/publish CSS vars for shadcn tokens; preview before publishing.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions & data</CardTitle>
            <CardDescription>Attach behavior safely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Add-to-cart and buy-now use selectedVariantId (binding) and validated
                payloads.
              </li>
              <li>Variant selector writes uiState.selectedVariantId.</li>
              <li>Delivery mode selector writes uiState.deliveryMode.</li>
              <li>Navigation action for links/cards/buttons.</li>
              <li>All actions are executed via server handlers with store isolation.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Where to read more</CardTitle>
          <CardDescription>Deep dives for owners and developers</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">For owners</h3>
            <p>
              See `rules/storefront-builder-user-guide.md` for a step-by-step tour of
              editing, binding product schema fields, theme tweaks, and publishing.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">For developers</h3>
            <p>
              See `rules/storefront-builder-dev-guide.md` and the registry/action
              contract in `rules/storefront-builder-component-specs.md` for adding
              components, actions, and validations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

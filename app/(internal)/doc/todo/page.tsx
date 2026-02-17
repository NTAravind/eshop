import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const todos = [
  {
    title: "Enforce login across storefront",
    detail:
      "Require auth on cart, checkout, profile, orders; add /store/[slug]/profile route; keep storefront login doc as branded wrapper to /login.",
  },
  {
    title: "Store-relative navigation",
    detail:
      "Prefix NAVIGATE, Link/NavItem/Navbar/ProductCard hrefs with /store/[slug]; fix default docs links.",
  },
  {
    title: "PDP template selection",
    detail:
      "Pick PDP:<schemaId> first (match productSchemaId), fallback PDP:default in products/[productId]/page.tsx.",
  },
  {
    title: "Cart lifecycle (login-only)",
    detail:
      "Load cart server-side for user; actions pass userId; refresh cart after add/update; remove guest/session logic.",
  },
  {
    title: "Theme var mapping",
    detail:
      "Map ThemeVars to --kebab vars (e.g., cardForeground -> --card-foreground) for runtime + builder preview.",
  },
  {
    title: "Seed + route completeness",
    detail:
      "Seed CART page; ensure profile route exists; verify every seeded doc has a matching route and vice versa.",
  },
  {
    title: "Inspector completeness",
    detail:
      "Registry-driven props/actions/bindings UI with schema-aware field picker; allow adding/editing actions and bindings.",
  },
  {
    title: "Facets & filters end-to-end",
    detail:
      "Provide facets data to collection page; sync URL query; apply filters in product query; keep store-scoped.",
  },
  {
    title: "Prefabs + multi-layout stacking",
    detail:
      "Implement PrefabInstance expansion; support layoutRefs stacking with single Slot validation per layout.",
  },
  {
    title: "Actions hardening",
    detail:
      "Zod-validate payloads (already); add RBAC/auth checks in server actions; return redirect hint when unauthorized.",
  },
  {
    title: "Tests",
    detail:
      "Add unit tests for binding resolver, doc validation (Slot/constraints), action payloads; smoke tests for publish/render.",
  },
];

export default function TodoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Builder</Badge>
          <Badge variant="outline">Path-based</Badge>
          <Badge variant="outline">Auth required</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Storefront builder</p>
          <h1 className="text-3xl font-semibold">Implementation TODO</h1>
          <p className="text-muted-foreground max-w-3xl">
            High-priority tasks to finish the storefront builder and runtime for production with login-required stores.
          </p>
        </div>
      </header>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {todos.map((item) => (
          <Card key={item.title} className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

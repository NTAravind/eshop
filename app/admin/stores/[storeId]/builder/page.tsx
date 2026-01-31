import { Editor } from "@/components/builder/Editor"
import { getLayout } from "@/services/layout.service"
import type { LayoutRoot } from "@/types/builder"

export default async function BuilderPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params

  const existingLayout = await getLayout(storeId, "HOME", false)
  const initialLayout: LayoutRoot | null = existingLayout
    ? {
      storeId,
      version: "1.0",
      page: existingLayout.page as LayoutRoot["page"],
      tree: existingLayout.tree as unknown as LayoutRoot["tree"]
    }
    : null

  return <Editor storeId={storeId} initialLayout={initialLayout} />
}

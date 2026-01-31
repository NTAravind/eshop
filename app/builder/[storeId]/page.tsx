import { Editor } from "@/components/builder/Editor"

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params
  return <Editor storeId={storeId} />
}

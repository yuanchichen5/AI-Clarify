import { NoteEditor } from "@/components/editor/NoteEditor";

export const dynamic = "force-dynamic";

export default async function NoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <NoteEditor noteId={id} />;
}

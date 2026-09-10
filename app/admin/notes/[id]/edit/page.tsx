import { notFound } from "next/navigation";
import { NoteService } from "@/server/services/note-service";
import { NoteForm } from "@/components/admin/note-form";

interface EditNotePageProps {
  params: {
    id: string;
  };
}

export default async function EditNotePage({ params }: EditNotePageProps) {
  const note = await NoteService.getNoteById(params.id);

  if (!note) {
    notFound();
  }

  const categoryDoc = note.categoryId as unknown as { _id?: { toString(): string }; name?: string } | undefined;
  const tagDocs = (note.tagIds || []) as unknown as Array<{ _id?: { toString(): string }; name?: string } | string>;
  const imageDocs = (note.imageIds || []) as unknown as Array<{
    _id?: { toString(): string };
    url?: string;
    altText?: string;
    caption?: string;
  } | string>;
  const pdfDoc = note.pdfMediaId as unknown as { _id?: { toString(): string }; url?: string } | undefined;

  const categoryId = categoryDoc && typeof categoryDoc === "object" && categoryDoc._id
    ? { _id: categoryDoc._id.toString(), name: categoryDoc.name || "" }
    : undefined;

  const tagIds = tagDocs.map((t) => {
    if (typeof t === "object" && t !== null && t._id) {
      return { _id: t._id.toString(), name: t.name || "" };
    }
    return { _id: String(t), name: "" };
  });

  const imageIds = imageDocs.map((img) => {
    if (typeof img === "object" && img !== null && img._id) {
      return {
        _id: img._id.toString(),
        url: img.url || "",
        altText: img.altText,
        caption: img.caption,
      };
    }
    return { _id: String(img), url: "" };
  });

  const pdfMediaId = pdfDoc && typeof pdfDoc === "object" && pdfDoc._id
    ? { _id: pdfDoc._id.toString(), url: pdfDoc.url || "" }
    : undefined;

  const initialData = {
    _id: note._id.toString(),
    title: note.title,
    slug: note.slug,
    subject: note.subject,
    content: note.content,
    categoryId,
    tagIds,
    imageIds,
    pdfMediaId,
    source: note.source,
    status: note.status,
  };

  return <NoteForm initialData={initialData} isEdit={true} />;
}

"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { useState, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  CodeXml,
  Undo,
  Redo,
} from "lucide-react";
import clsx from "clsx";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [isSourceView, setIsSourceView] = useState(false);
  const [sourceCode, setSourceCode] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] p-4 focus:outline-none prose prose-slate max-w-none text-slate-800 leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setSourceCode(html);
      onChange(html);
    },
  });

  // Sync external content update
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
      setSourceCode(content || "");
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="min-h-[360px] border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
        Loading editor...
      </div>
    );
  }

  const handleSourceChange = (newHtml: string) => {
    setSourceCode(newHtml);
    onChange(newHtml);
    editor.commands.setContent(newHtml);
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL (or paste image link):");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
      {/* Toolbar */}
      <div className="bg-slate-50/90 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1 text-slate-700 select-none">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-30 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={clsx(
            "p-1.5 rounded text-xs font-bold transition-colors flex items-center gap-0.5",
            editor.isActive("heading", { level: 2 })
              ? "bg-amber-500 text-slate-950 font-extrabold"
              : "hover:bg-slate-200"
          )}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={clsx(
            "p-1.5 rounded text-xs font-bold transition-colors flex items-center gap-0.5",
            editor.isActive("heading", { level: 3 })
              ? "bg-amber-500 text-slate-950 font-extrabold"
              : "hover:bg-slate-200"
          )}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={clsx(
            "p-1.5 rounded text-xs font-bold transition-colors flex items-center gap-0.5",
            editor.isActive("heading", { level: 4 })
              ? "bg-amber-500 text-slate-950 font-extrabold"
              : "hover:bg-slate-200"
          )}
          title="Heading 4"
        >
          <Heading4 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("bold") ? "bg-amber-500 text-slate-950 font-bold" : "hover:bg-slate-200"
          )}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("italic") ? "bg-amber-500 text-slate-950" : "hover:bg-slate-200"
          )}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("strike") ? "bg-amber-500 text-slate-950" : "hover:bg-slate-200"
          )}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("bulletList") ? "bg-amber-500 text-slate-950" : "hover:bg-slate-200"
          )}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("orderedList") ? "bg-amber-500 text-slate-950" : "hover:bg-slate-200"
          )}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("blockquote") ? "bg-amber-500 text-slate-950" : "hover:bg-slate-200"
          )}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("codeBlock") ? "bg-amber-500 text-slate-950" : "hover:bg-slate-200"
          )}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Link & Image */}
        <button
          type="button"
          onClick={setLink}
          className={clsx(
            "p-1.5 rounded transition-colors",
            editor.isActive("link") ? "bg-amber-500 text-slate-950" : "hover:bg-slate-200"
          )}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded hover:bg-slate-200 transition-colors"
          title="Insert Image (Media Library in Batch 5)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Source Code Toggle */}
        <button
          type="button"
          onClick={() => setIsSourceView(!isSourceView)}
          className={clsx(
            "px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors",
            isSourceView
              ? "bg-slate-900 text-amber-400 border border-slate-700"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
          )}
          title="Toggle HTML Source View"
        >
          <CodeXml className="w-3.5 h-3.5" />
          <span>{isSourceView ? "Visual Editor" : "HTML Source"}</span>
        </button>
      </div>

      {/* Editor Body or HTML Source */}
      {isSourceView ? (
        <textarea
          value={sourceCode}
          onChange={(e) => handleSourceChange(e.target.value)}
          className="w-full min-h-[360px] p-4 font-mono text-xs bg-slate-950 text-slate-100 focus:outline-none resize-y"
          placeholder="Enter or paste raw HTML here..."
        />
      ) : (
        <EditorContent editor={editor} className="flex-1" />
      )}
    </div>
  );
}

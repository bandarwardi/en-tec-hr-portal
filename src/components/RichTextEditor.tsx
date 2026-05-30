import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Undo2, Redo2, Quote, Minus,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = 220 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-accent underline" } }),
      Image,
      Placeholder.configure({ placeholder: placeholder || "اكتب هنا..." }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        dir: "rtl",
        class: cn(
          "prose prose-sm max-w-none rounded-b-md border border-t-0 border-input bg-background p-3 focus:outline-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5",
          "[&_blockquote]:border-r-4 [&_blockquote]:border-accent [&_blockquote]:pr-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_a]:text-accent [&_a]:underline",
          "[&_p]:my-2 [&_hr]:my-3",
        ),
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const tbBtn = (active: boolean) =>
    cn("h-8 w-8 p-0", active ? "bg-accent/15 text-accent" : "text-foreground");

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("رابط:", prev);
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("رابط الصورة:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className={cn("rounded-md", className)}>
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-input bg-muted/40 p-1">
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="sm" className={tbBtn(editor.isActive("link"))} onClick={setLink}><LinkIcon className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(false)} onClick={addImage}><ImageIcon className="h-4 w-4" /></Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="ghost" size="sm" className={tbBtn(false)} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Button>
        <Button type="button" variant="ghost" size="sm" className={tbBtn(false)} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
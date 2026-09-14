import { Button, Label } from "@medusajs/ui"
import Image from "@tiptap/extension-image"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useRef } from "react"
import { uploadImage } from "../lib/upload-image"

// The toolbar is deliberately limited to what the storefront's sanitize-html
// allowlist keeps (apps/storefront/src/utils/sanitize.ts): headings, emphasis,
// lists, links, quotes and images. Heading 1 is excluded — the <h1> of the
// public page is the article title itself.
const CONTENT_CLASS = [
  "min-h-[320px] w-full bg-ui-bg-field px-3 py-2 text-ui-fg-base outline-none",
  "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold",
  "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold",
  "[&_p]:my-2",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-ui-border-strong [&_blockquote]:pl-3 [&_blockquote]:italic",
  "[&_a]:text-ui-fg-interactive [&_a]:underline",
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
].join(" ")

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <Button
      size="small"
      type="button"
      variant={active ? "primary" : "transparent"}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null)

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Adresse du lien", previous ?? "https://")
    if (url === null) return
    const chain = editor.chain().focus().extendMarkRange("link")
    if (url === "") {
      chain.unsetLink().run()
      return
    }
    // Only send the reader away in a new tab for links leaving the site.
    const external = /^https?:\/\//i.test(url)
    chain
      .setLink(
        external ? { href: url, target: "_blank", rel: "noopener" } : { href: url }
      )
      .run()
  }

  const insertImage = async (file: File) => {
    const url = await uploadImage(file)
    if (!url) return
    const alt = window.prompt("Décrivez l'image (texte alternatif)", "") ?? ""
    editor.chain().focus().setImage({ src: url, alt }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-ui-border-base px-2 py-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) insertImage(file)
        }}
      />
      <ToolbarButton
        label="Titre 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      />
      <ToolbarButton
        label="Titre 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      />
      <ToolbarButton
        label="Paragraphe"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      />
      <ToolbarButton
        label="Gras"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italique"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Liste à puces"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Liste numérotée"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="Citation"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="Lien"
        active={editor.isActive("link")}
        onClick={setLink}
      />
      <ToolbarButton label="Image" onClick={() => fileRef.current?.click()} />
      <ToolbarButton
        label="Annuler"
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        label="Rétablir"
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  )
}

export function RichTextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: false },
      }),
      Image,
    ],
    content: value || "",
    editorProps: { attributes: { class: CONTENT_CLASS } },
    // An empty document serializes to "<p></p>"; store an empty string instead
    // so the storefront's "no content" checks keep working.
    onUpdate: ({ editor }) =>
      onChange(editor.isEmpty ? "" : editor.getHTML()),
  })

  // One-way sync: only push an outside change back into the editor when the
  // user is not typing, otherwise the caret jumps on every keystroke.
  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? "" : editor.getHTML()
    if (value !== current && !editor.isFocused) {
      editor.commands.setContent(value || "", { emitUpdate: false })
    }
  }, [editor, value])

  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small" weight="plus">
        {label}
      </Label>
      <div className="overflow-hidden rounded-lg border border-ui-border-base">
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

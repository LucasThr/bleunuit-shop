import { Button, Input, Label, Text } from "@medusajs/ui"
import { useRef, useState } from "react"
import { uploadImage } from "../lib/upload-image"

// Image picker storing the uploaded file's public URL as a plain string, so the
// CMS models and the storefront keep reading a URL. Manual URL entry stays
// available behind a link: seed data and some brands point to external images.
export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [manual, setManual] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    const url = await uploadImage(file)
    setUploading(false)
    if (url) onChange(url)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small" weight="plus">
        {label}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Reset so picking the same file twice still fires a change.
          e.target.value = ""
          if (file) upload(file)
        }}
      />

      {value ? (
        <div className="flex flex-col gap-y-2 rounded-lg border border-ui-border-base p-3">
          <img
            src={value}
            alt=""
            className="h-40 w-full rounded-md object-contain"
          />
          <div className="flex items-center gap-x-2">
            <Button
              size="small"
              variant="secondary"
              type="button"
              isLoading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              Remplacer
            </Button>
            <Button
              size="small"
              variant="transparent"
              type="button"
              disabled={uploading}
              onClick={() => onChange("")}
            >
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files?.[0]
            if (file) upload(file)
          }}
          className="flex h-40 w-full flex-col items-center justify-center gap-y-1 rounded-lg border border-dashed border-ui-border-strong bg-ui-bg-field text-ui-fg-subtle transition-colors hover:bg-ui-bg-field-hover"
        >
          <Text size="small">
            {uploading
              ? "Envoi en cours…"
              : "Glissez une image ou cliquez pour choisir"}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted">
            JPG, PNG ou WebP · 5 Mo maximum
          </Text>
        </button>
      )}

      {manual ? (
        <Input
          value={value ?? ""}
          placeholder="https://…"
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <button
          type="button"
          className="self-start text-xs text-ui-fg-muted hover:text-ui-fg-subtle"
          onClick={() => setManual(true)}
        >
          ou coller une adresse
        </button>
      )}
    </div>
  )
}

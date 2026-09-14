import { toast } from "@medusajs/ui"
import { sdk } from "./sdk"

const MAX_BYTES = 5 * 1024 * 1024

/**
 * Uploads one image to the configured file provider and returns its public URL.
 * Returns null when the file is rejected or the upload fails, after telling the
 * user why.
 */
export async function uploadImage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    toast.error("Seules les images sont acceptées (JPG, PNG, WebP…)")
    return null
  }
  if (file.size > MAX_BYTES) {
    toast.error("Image trop lourde : 5 Mo maximum")
    return null
  }

  try {
    const { files } = await sdk.admin.upload.create({ files: [file] })
    return files[0].url
  } catch (e: any) {
    toast.error(e?.message || "Échec de l'envoi de l'image")
    return null
  }
}

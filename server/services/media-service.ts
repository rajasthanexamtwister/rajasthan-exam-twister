import { MediaRepository, MediaFilterOptions } from "@/server/repositories/media";
import { validateUploadedFile } from "@/server/lib/media-validation";
import { getMediaStorageProvider } from "@/server/lib/media-storage";
import { IMedia } from "@/server/models/Media";
import { UpdateMediaInput } from "@/server/validation/media";

export class MediaService {
  static async uploadFile(
    buffer: Buffer,
    filename: string,
    declaredMimeType: string,
    altText?: string,
    caption?: string
  ): Promise<{ success: boolean; media?: IMedia; error?: string }> {
    const validation = validateUploadedFile(buffer, declaredMimeType);
    if (!validation.valid || !validation.detectedMime) {
      return {
        success: false,
        error: validation.error || "Invalid file format or size",
      };
    }

    try {
      const storageProvider = getMediaStorageProvider();
      const uploadResult = await storageProvider.upload(
        buffer,
        filename,
        validation.detectedMime
      );

      const media = await MediaRepository.create({
        url: uploadResult.url,
        altText: altText?.trim() || filename.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
        caption: caption?.trim(),
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        width: uploadResult.width,
        height: uploadResult.height,
      });

      return {
        success: true,
        media,
      };
    } catch (err) {
      console.error("Storage upload error:", err);
      return {
        success: false,
        error: "Failed to upload file to storage provider",
      };
    }
  }

  static async listMedia(options: MediaFilterOptions = {}) {
    return MediaRepository.list(options);
  }

  static async getMediaById(id: string) {
    return MediaRepository.findById(id);
  }

  static async updateMedia(
    id: string,
    input: UpdateMediaInput
  ): Promise<{ success: boolean; media?: IMedia; error?: string }> {
    const existing = await MediaRepository.findById(id);
    if (!existing) {
      return { success: false, error: "Media item not found" };
    }

    const updateData: Partial<IMedia> = {};
    if (input.altText !== undefined) {
      updateData.altText = input.altText.trim();
    }
    if (input.caption !== undefined) {
      updateData.caption = input.caption?.trim() || undefined;
    }

    const updated = await MediaRepository.update(id, updateData);
    if (!updated) {
      return { success: false, error: "Failed to update media item" };
    }

    return { success: true, media: updated };
  }

  static async deleteMedia(id: string): Promise<{ success: boolean; error?: string; status: number }> {
    const refs = await MediaRepository.countReferences(id);
    if (refs.inUse) {
      const parts: string[] = [];
      if (refs.blogCoverCount > 0) {
        parts.push(`${refs.blogCoverCount} blog cover image(s)`);
      }
      if (refs.noteImageCount > 0) {
        parts.push(`${refs.noteImageCount} note infographic image(s)`);
      }
      if (refs.notePdfCount > 0) {
        parts.push(`${refs.notePdfCount} note PDF handbook(s)`);
      }

      return {
        success: false,
        error: `Cannot delete media: currently referenced by ${parts.join(", ")}. Please remove or replace references before deleting.`,
        status: 409,
      };
    }

    const deleted = await MediaRepository.delete(id);
    if (!deleted) {
      return { success: false, error: "Media item not found", status: 404 };
    }

    return { success: true, status: 200 };
  }
}

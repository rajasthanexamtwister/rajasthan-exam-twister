import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

export interface UploadResult {
  url: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface IMediaStorageProvider {
  upload(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<UploadResult>;
}

// Local Disk Storage Provider (Dev / Fallback)
export class LocalDiskStorageProvider implements IMediaStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  async upload(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<UploadResult> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const ext = path.extname(originalFilename) || this.getExtensionFromMime(mimeType);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(filePath, fileBuffer);

    return {
      url: `/uploads/${uniqueName}`,
      fileSize: fileBuffer.length,
      mimeType,
    };
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime) {
      case "image/jpeg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "application/pdf":
        return ".pdf";
      default:
        return "";
    }
  }
}

// Cloudinary Storage Provider (Production on Vercel / Remote Storage)
export class CloudinaryStorageProvider implements IMediaStorageProvider {
  constructor(cloudinaryUrl?: string) {
    if (cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl.trim(),
      });
    }
  }

  async upload(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<UploadResult> {
    const isPdf = mimeType === "application/pdf";
    const resourceType: "image" | "raw" = isPdf ? "raw" : "image";
    const baseName = path.parse(originalFilename).name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = `ret_${baseName}_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          public_id: publicId,
          folder: "rajasthan_exam_twister",
          overwrite: false,
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            return reject(new Error(error?.message || "Cloudinary upload failed"));
          }

          resolve({
            url: result.secure_url || result.url,
            fileSize: result.bytes || fileBuffer.length,
            mimeType,
            width: result.width,
            height: result.height,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  }
}

// Factory to resolve provider based on MEDIA_PROVIDER env variable
export function getMediaStorageProvider(): IMediaStorageProvider {
  const provider = (process.env.MEDIA_PROVIDER || "local").toLowerCase();

  if (provider === "cloudinary" && process.env.CLOUDINARY_URL) {
    try {
      return new CloudinaryStorageProvider(process.env.CLOUDINARY_URL);
    } catch (err) {
      console.warn("Falling back to local storage due to invalid CLOUDINARY_URL:", err);
    }
  }

  return new LocalDiskStorageProvider();
}

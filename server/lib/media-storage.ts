import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

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

// Cloudinary Storage Provider
export class CloudinaryStorageProvider implements IMediaStorageProvider {
  private apiKey: string;
  private apiSecret: string;
  private cloudName: string;

  constructor(cloudinaryUrl: string) {
    const match = cloudinaryUrl.trim().match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (!match) {
      throw new Error("Invalid CLOUDINARY_URL format. Expected: cloudinary://<api_key>:<api_secret>@<cloud_name>");
    }
    this.apiKey = match[1];
    this.apiSecret = match[2];
    this.cloudName = match[3];
  }

  async upload(fileBuffer: Buffer, originalFilename: string, mimeType: string): Promise<UploadResult> {
    const timestamp = Math.round(Date.now() / 1000);
    const signatureStr = `timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    formData.append("file", blob, originalFilename);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    const resourceType = mimeType === "application/pdf" ? "raw" : "image";
    const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(err.error?.message || `Cloudinary upload failed with status ${res.statusText}`);
    }

    const data = (await res.json()) as {
      secure_url?: string;
      url: string;
      bytes?: number;
      width?: number;
      height?: number;
    };

    return {
      url: data.secure_url || data.url,
      fileSize: data.bytes || fileBuffer.length,
      mimeType,
      width: data.width,
      height: data.height,
    };
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

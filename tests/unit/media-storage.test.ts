import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getMediaStorageProvider,
  LocalDiskStorageProvider,
  CloudinaryStorageProvider,
} from "@/server/lib/media-storage";
import { v2 as cloudinary } from "cloudinary";

describe("Media Storage Providers & Runtime Factory", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should return LocalDiskStorageProvider when MEDIA_PROVIDER is not set or set to 'local'", () => {
    delete process.env.MEDIA_PROVIDER;
    delete process.env.CLOUDINARY_URL;

    const provider = getMediaStorageProvider();
    expect(provider).toBeInstanceOf(LocalDiskStorageProvider);
  });

  it("should return CloudinaryStorageProvider when MEDIA_PROVIDER=cloudinary and CLOUDINARY_URL is present", () => {
    process.env.MEDIA_PROVIDER = "cloudinary";
    process.env.CLOUDINARY_URL = "cloudinary://123456789:abcdefghijk@sample_cloud_name";

    const provider = getMediaStorageProvider();
    expect(provider).toBeInstanceOf(CloudinaryStorageProvider);
  });

  it("should fall back to LocalDiskStorageProvider if MEDIA_PROVIDER=cloudinary but CLOUDINARY_URL is missing", () => {
    process.env.MEDIA_PROVIDER = "cloudinary";
    delete process.env.CLOUDINARY_URL;

    const provider = getMediaStorageProvider();
    expect(provider).toBeInstanceOf(LocalDiskStorageProvider);
  });

  it("should call cloudinary uploader upload_stream with correct options on upload", async () => {
    const provider = new CloudinaryStorageProvider("cloudinary://123456789:abcdefghijk@sample_cloud_name");

    const mockUploadResult = {
      secure_url: "https://res.cloudinary.com/sample_cloud_name/image/upload/v1234567890/rajasthan_exam_twister/ret_map_123.jpg",
      bytes: 2048,
      width: 800,
      height: 600,
    };

    const uploadStreamSpy = vi
      .spyOn(cloudinary.uploader, "upload_stream")
      .mockImplementation(((options: any, callback: any) => {
        expect(options.folder).toBe("rajasthan_exam_twister");
        expect(options.resource_type).toBe("image");
        setTimeout(() => callback(null, mockUploadResult), 10);
        return {
          end: vi.fn(),
        };
      }) as any);

    const fileBuffer = Buffer.from("fake-image-bytes");
    const result = await provider.upload(fileBuffer, "rajasthan_map.jpg", "image/jpeg");

    expect(uploadStreamSpy).toHaveBeenCalled();
    expect(result.url).toBe(mockUploadResult.secure_url);
    expect(result.fileSize).toBe(2048);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("should specify resource_type 'raw' when uploading PDF documents to Cloudinary", async () => {
    const provider = new CloudinaryStorageProvider("cloudinary://123456789:abcdefghijk@sample_cloud_name");

    const mockUploadResult = {
      secure_url: "https://res.cloudinary.com/sample_cloud_name/raw/upload/v1234567890/rajasthan_exam_twister/ret_handbook_123.pdf",
      bytes: 10240,
    };

    const uploadStreamSpy = vi
      .spyOn(cloudinary.uploader, "upload_stream")
      .mockImplementation(((options: any, callback: any) => {
        expect(options.folder).toBe("rajasthan_exam_twister");
        expect(options.resource_type).toBe("raw");
        setTimeout(() => callback(null, mockUploadResult), 10);
        return {
          end: vi.fn(),
        };
      }) as any);

    const fileBuffer = Buffer.from("%PDF-1.5 fake pdf content");
    const result = await provider.upload(fileBuffer, "handbook.pdf", "application/pdf");

    expect(uploadStreamSpy).toHaveBeenCalled();
    expect(result.url).toBe(mockUploadResult.secure_url);
    expect(result.fileSize).toBe(10240);
    expect(result.mimeType).toBe("application/pdf");
  });
});

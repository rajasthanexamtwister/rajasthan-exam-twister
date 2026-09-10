import { describe, it, expect } from "vitest";
import {
  detectMimeTypeFromBuffer,
  validateUploadedFile,
  MAX_IMAGE_SIZE,
  MAX_PDF_SIZE,
} from "@/server/lib/media-validation";

describe("Media Validation & File Signature Checks (Magic Bytes)", () => {
  it("should correctly detect JPEG magic bytes (FF D8 FF)", () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detectMimeTypeFromBuffer(jpegBuffer)).toBe("image/jpeg");
  });

  it("should correctly detect PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)", () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(detectMimeTypeFromBuffer(pngBuffer)).toBe("image/png");
  });

  it("should correctly detect WebP magic bytes (RIFF...WEBP)", () => {
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x00, 0x00, 0x00, 0x00, // size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    expect(detectMimeTypeFromBuffer(webpBuffer)).toBe("image/webp");
  });

  it("should correctly detect PDF magic bytes (%PDF)", () => {
    const pdfBuffer = Buffer.from([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35, 0x0a, 0x25, 0xd0, 0xd4,
    ]); // %PDF-1.5
    expect(detectMimeTypeFromBuffer(pdfBuffer)).toBe("application/pdf");
  });

  it("should reject malicious/fake mime type (e.g. text file disguised as image/jpeg)", () => {
    const fakeImageBuffer = Buffer.from("<html><script>alert(1)</script></html>", "utf-8");
    const result = validateUploadedFile(fakeImageBuffer, "image/jpeg");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file signature");
  });

  it("should reject image file exceeding 5MB limit", () => {
    // 6MB buffer with JPEG header
    const oversizedImage = Buffer.alloc(6 * 1024 * 1024);
    oversizedImage[0] = 0xff;
    oversizedImage[1] = 0xd8;
    oversizedImage[2] = 0xff;
    oversizedImage[3] = 0xe0;

    const result = validateUploadedFile(oversizedImage, "image/jpeg");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("maximum limit of 5MB");
  });

  it("should reject PDF file exceeding 15MB limit", () => {
    // 16MB buffer with PDF header
    const oversizedPdf = Buffer.alloc(16 * 1024 * 1024);
    oversizedPdf[0] = 0x25;
    oversizedPdf[1] = 0x50;
    oversizedPdf[2] = 0x44;
    oversizedPdf[3] = 0x46;

    const result = validateUploadedFile(oversizedPdf, "application/pdf");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("maximum limit of 15MB");
  });

  it("should pass valid JPEG file under limit", () => {
    const validJpeg = Buffer.alloc(1024);
    validJpeg[0] = 0xff;
    validJpeg[1] = 0xd8;
    validJpeg[2] = 0xff;
    validJpeg[3] = 0xe0;

    const result = validateUploadedFile(validJpeg, "image/jpeg");
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/jpeg");
  });
});

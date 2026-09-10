export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB

export type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

export const ALLOWED_MIME_TYPES: SupportedMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export function detectMimeTypeFromBuffer(buffer: Buffer): SupportedMimeType | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WEBP: "RIFF" at 0..3 and "WEBP" at 8..11
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
  if (isRiff && isWebp) {
    return "image/webp";
  }

  // PDF: %PDF (25 50 44 46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  return null;
}

export function validateUploadedFile(
  buffer: Buffer,
  declaredMimeType: string
): { valid: boolean; error?: string; detectedMime?: SupportedMimeType } {
  const detected = detectMimeTypeFromBuffer(buffer);

  if (!detected || !ALLOWED_MIME_TYPES.includes(detected)) {
    return {
      valid: false,
      error: `Invalid file signature. Allowed types: JPEG, PNG, WEBP, PDF.`,
    };
  }

  const isPdf = detected === "application/pdf";
  const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
  const limitName = isPdf ? "15MB" : "5MB";

  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${limitName}.`,
    };
  }

  return {
    valid: true,
    detectedMime: detected,
  };
}

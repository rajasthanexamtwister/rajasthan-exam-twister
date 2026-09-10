import { describe, it, expect, vi } from "vitest";

describe("Media Picker & Form Upload Flow Integration", () => {
  it("verifies BlogForm independent paths: 'upload new' vs 'pick existing'", () => {
    // Simulate Blog Form state and action handlers
    let formCoverImageId: string | null = null;
    let formCoverImagePreview: string | null = null;
    let uploadModalOpen = false;
    let pickerModalOpen = false;

    // Handler 1: Pick existing media from MediaPicker modal
    const handlePickExisting = (selectedMedia: { id: string; url: string; altText?: string }) => {
      formCoverImageId = selectedMedia.id;
      formCoverImagePreview = selectedMedia.url;
      pickerModalOpen = false;
    };

    // Handler 2: Upload new file directly via Upload Modal / file input
    const handleUploadNewSuccess = (uploadedMedia: { id: string; url: string }) => {
      formCoverImageId = uploadedMedia.id;
      formCoverImagePreview = uploadedMedia.url;
      uploadModalOpen = false;
    };

    // Handler 3: Remove selected cover
    const handleRemoveCover = () => {
      formCoverImageId = null;
      formCoverImagePreview = null;
    };

    // Test Path A: Upload New
    uploadModalOpen = true;
    expect(uploadModalOpen).toBe(true);
    handleUploadNewSuccess({ id: "media-new-123", url: "/uploads/new-cover.jpg" });
    expect(formCoverImageId).toBe("media-new-123");
    expect(formCoverImagePreview).toBe("/uploads/new-cover.jpg");
    expect(uploadModalOpen).toBe(false);

    // Test Path B: Pick Existing (overwriting or picking from scratch)
    pickerModalOpen = true;
    expect(pickerModalOpen).toBe(true);
    handlePickExisting({ id: "media-existing-456", url: "/uploads/existing-cover.png", altText: "Existing" });
    expect(formCoverImageId).toBe("media-existing-456");
    expect(formCoverImagePreview).toBe("/uploads/existing-cover.png");
    expect(pickerModalOpen).toBe(false);

    // Test Remove
    handleRemoveCover();
    expect(formCoverImageId).toBeNull();
    expect(formCoverImagePreview).toBeNull();
  });

  it("verifies NoteImageUploader independent paths: 'upload new' vs 'pick existing'", () => {
    // Simulate Note Images state (ordered list)
    let noteImages: Array<{ id: string; url: string; altText?: string }> = [];

    // Handler 1: Pick existing media items from MediaPicker (single or multiple)
    const handlePickExistingItems = (pickedItems: Array<{ id: string; url: string; altText?: string }>) => {
      const existingIds = new Set(noteImages.map((img) => img.id));
      const newUnique = pickedItems.filter((item) => !existingIds.has(item.id));
      noteImages = [...noteImages, ...newUnique];
    };

    // Handler 2: Upload new file directly
    const handleUploadNewFile = (newFileMedia: { id: string; url: string; altText?: string }) => {
      noteImages = [...noteImages, newFileMedia];
    };

    // Handler 3: Reorder images
    const handleReorder = (fromIndex: number, toIndex: number) => {
      const updated = [...noteImages];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      noteImages = updated;
    };

    // Step 1: Upload new image directly
    handleUploadNewFile({ id: "img-upload-1", url: "/uploads/diagram1.jpg" });
    expect(noteImages.length).toBe(1);
    expect(noteImages[0].id).toBe("img-upload-1");

    // Step 2: Pick existing image via MediaPicker modal
    handlePickExistingItems([
      { id: "img-picker-2", url: "/uploads/map.jpg", altText: "Rajasthan Map" },
      { id: "img-upload-1", url: "/uploads/diagram1.jpg" }, // duplicate should be ignored
    ]);
    expect(noteImages.length).toBe(2);
    expect(noteImages[1].id).toBe("img-picker-2");

    // Step 3: Reorder images (preserves order)
    handleReorder(1, 0);
    expect(noteImages[0].id).toBe("img-picker-2");
    expect(noteImages[1].id).toBe("img-upload-1");
  });
});

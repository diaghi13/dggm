/**
 * Removes white background via perceived luminance.
 * White (255,255,255) → alpha=0 (transparent)
 * Black ink (0,0,0) → alpha=255 (opaque)
 * Already transparent pixels (alpha=0) are preserved as-is.
 */
export async function removeWhiteBackground(source: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Skip already transparent pixels to avoid turning them black
        if (data[i + 3] === 0) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i + 3] = Math.round(255 * (1 - lum / 255));
      }

      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Canvas toBlob failed")),
        "image/png",
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
}

/**
 * Crops an image (given as a URL/data-URL) to the specified pixel area.
 * Returns a PNG Blob.
 */
export async function getCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );

      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Canvas toBlob failed")),
        "image/png",
      );
    };

    img.onerror = () => reject(new Error("Image load failed"));
    img.src = imageSrc;
  });
}

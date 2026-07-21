/** Max height for images embedded in the EPUB (downscale only). */
export const EPUB_IMAGE_MAX_HEIGHT = 500;

/** JPEG quality when re-encoding resized EPUB images. */
export const EPUB_IMAGE_JPEG_QUALITY = 0.82;

export async function fetchBlobAndConvertToBase64(blobUrl) {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error fetching or converting blob:", error);
    return null;
  }
}

function dataUrlToArrayBuffer(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    throw new Error("Invalid data URL");
  }

  const base64 = dataUrl.slice(commaIndex + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export async function fetchImageAsArrayBuffer(url) {
  if (url.startsWith("data:")) {
    return dataUrlToArrayBuffer(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  return response.arrayBuffer();
}

/**
 * Downscale an image buffer to EPUB_IMAGE_MAX_HEIGHT (preserving aspect ratio).
 * Images already at or below that height are returned unchanged.
 */
export async function resizeImageBuffer(
  buffer,
  maxHeight = EPUB_IMAGE_MAX_HEIGHT,
  quality = EPUB_IMAGE_JPEG_QUALITY
) {
  if (!buffer || maxHeight <= 0) {
    return buffer;
  }

  try {
    const blob = new Blob([buffer]);
    const bitmap = await createImageBitmap(blob);

    if (bitmap.height <= maxHeight) {
      bitmap.close();
      return buffer;
    }

    const scale = maxHeight / bitmap.height;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = maxHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return buffer;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const resizedBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Failed to encode resized image")),
        "image/jpeg",
        quality
      );
    });

    return resizedBlob.arrayBuffer();
  } catch (error) {
    console.warn("Could not resize image for EPUB; using original bytes.", error);
    return buffer;
  }
}

export async function fetchImageForEpub(url) {
  const buffer = await fetchImageAsArrayBuffer(url);
  return resizeImageBuffer(buffer);
}

export async function prepareCoverImageForEpub(dataUrl) {
  const buffer = dataUrlToArrayBuffer(dataUrl);
  return resizeImageBuffer(buffer);
}

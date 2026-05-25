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

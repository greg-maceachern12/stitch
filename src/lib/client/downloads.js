function epubFilename(title) {
  const slug =
    (title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled";

  return `Stitch_${slug}.epub`;
}

function clickDownloadLink(href, download) {
  const link = document.createElement("a");
  link.href = href;
  link.download = download;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
export function downloadEpubBlob(epubBlob, title) {
  const url = URL.createObjectURL(epubBlob);
  clickDownloadLink(url, epubFilename(title));
  URL.revokeObjectURL(url);
}

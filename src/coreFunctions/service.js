import {
  parseEpubFile,
  flattenToc,
  extractStoryChapters,
  runImagePipeline,
} from "./bookLogic";
import { buildEpub } from "./buildEpub";
import { fetchBlobAndConvertToBase64 } from "../utils/epubUtils.js";
import {
  STITCH_STATUS,
  createParsingProgress,
  createChapterProgress,
  setStitchingProgress,
  createErrorProgress,
  createCompleteProgress,
} from "../lib/generationProgress";

export const handleDownloadSampleBook = () => {
  const link = document.createElement("a");
  link.href = "/The_Crystal_Throne.epub";
  link.download = "The_Crystal_Throne.epub";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleFileChange = (file, setEpubFile, setFileError) => {
  if (file) {
    if (file.type === "application/epub+zip") {
      setEpubFile(file);
      setFileError("");
    } else {
      setEpubFile(null);
      setFileError("Please select a valid EPUB file.");
    }
  } else {
    setEpubFile(null);
    setFileError("No file selected.");
  }
};

function epubFilename(title) {
  const slug =
    (title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled";
  return `Visuai_${slug}.epub`;
}

export function downloadEpubBlob(epubBlob, title) {
  const url = URL.createObjectURL(epubBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = epubFilename(title);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const handleParseAndGenerateImage = async (
  epubFile,
  setIsLoading,
  setProgress,
  { imageStyle, imageModel } = {}
) => {
  setIsLoading(true);
  let progress = createParsingProgress();
  setProgress(progress);

  if (!epubFile) {
    setProgress(
      createErrorProgress("No EPUB file selected. Please select a file.")
    );
    setIsLoading(false);
    return null;
  }

  try {
    const { epubReader, metadata, toc } = await parseEpubFile(epubFile);

    let coverBase64 = null;
    try {
      const coverBlob = await epubReader.coverUrl();
      if (coverBlob) {
        const base64 = await fetchBlobAndConvertToBase64(coverBlob);
        coverBase64 = `data:image/png;base64,${base64}`;
      }
    } catch (error) {
      console.error("Error processing cover image:", error);
    }

    const bookMeta = {
      title: metadata.title || "Untitled",
      author: metadata.creator || "Unknown",
      cover: coverBase64 || "https://i.imgur.com/c4VGri2.jpeg",
    };

    const allChapters = flattenToc(toc);
    const storyChapters = extractStoryChapters(allChapters);

    progress = createChapterProgress(bookMeta.title, storyChapters);
    setProgress(progress);

    const chapters = await runImagePipeline({
      allChapters,
      storyChapters,
      epubReader,
      bookTitle: bookMeta.title,
      concurrency: 4,
      imageStyle,
      imageModel,
      onProgress: (update) => {
        progress = update;
        setProgress(update);
      },
    });

    progress = setStitchingProgress(
      progress,
      STITCH_STATUS.ACTIVE,
      "Assembling illustrated EPUB…"
    );
    setProgress(progress);

    const epubBlob = await buildEpub({
      title: bookMeta.title,
      author: bookMeta.author,
      cover: bookMeta.cover,
      chapters,
    });

    progress = setStitchingProgress(
      progress,
      STITCH_STATUS.ACTIVE,
      "Starting download…"
    );
    setProgress(progress);
    downloadEpubBlob(epubBlob, bookMeta.title);

    progress = createCompleteProgress(bookMeta.title, progress);
    setProgress(progress);

    return { title: bookMeta.title };
  } catch (error) {
    console.error("Error while processing EPUB:", error);
    setProgress(
      createErrorProgress(
        error.message || "Error while processing EPUB.",
        progress
      )
    );
    return null;
  } finally {
    setIsLoading(false);
  }
};

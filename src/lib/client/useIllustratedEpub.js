"use client";

import { useRef, useState } from "react";
import { DEFAULT_IMAGE_MODEL, getImageModel } from "@/lib/imageModels";
import { DEFAULT_IMAGE_STYLE } from "@/lib/imageStyles";
import {
  STITCH_STATUS,
  createReadyProgress,
  createCompleteProgress,
  createErrorProgress,
  createParsingProgress,
  setStitchingProgress,
} from "@/lib/generationProgress";
import { downloadEpubBlob } from "@/lib/client/downloads";
import { fetchBlobAndConvertToBase64 } from "@/lib/epub/assets";
import { buildEpub } from "@/lib/epub/buildEpub";
import {
  extractStoryChapters,
  flattenToc,
  parseEpubFile,
} from "@/lib/epub/chapters";
import { runImagePipeline } from "@/lib/epub/imagePipeline";

const FALLBACK_COVER = "https://i.imgur.com/c4VGri2.jpeg";
const PIPELINE_CONCURRENCY = 4;

function isEpubFile(file) {
  return file?.type === "application/epub+zip";
}

async function readBookCover(epubReader) {
  try {
    const coverBlob = await epubReader.coverUrl();
    if (!coverBlob) {
      return null;
    }

    const base64 = await fetchBlobAndConvertToBase64(coverBlob);
    return base64 ? `data:image/png;base64,${base64}` : null;
  } catch (error) {
    console.error("Error processing cover image:", error);
    return null;
  }
}

function formatMetadataValue(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join(", ");
    return joined || null;
  }
  return String(value);
}

function bookMetaFrom(metadata, cover, storyChapters) {
  return {
    title: metadata.title || "Untitled",
    author: metadata.creator || "Unknown",
    cover: cover || FALLBACK_COVER,
    chapterCount: storyChapters.length,
    language: formatMetadataValue(metadata.language),
    publisher: formatMetadataValue(metadata.publisher),
  };
}

async function loadParsedBook(epubFile) {
  const { epubReader, metadata, toc } = await parseEpubFile(epubFile);
  const cover = await readBookCover(epubReader);
  const allChapters = flattenToc(toc);
  const storyChapters = extractStoryChapters(allChapters);
  const bookMeta = bookMetaFrom(metadata, cover, storyChapters);

  return { epubReader, bookMeta, allChapters, storyChapters };
}

export function useIllustratedEpub() {
  const [epubFile, setEpubFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [imageStyle, setImageStyle] = useState(DEFAULT_IMAGE_STYLE);
  const [imageModel, setImageModelState] = useState(DEFAULT_IMAGE_MODEL);
  const setImageModel = (modelId) => {
    setImageModelState(getImageModel(modelId).id);
  };
  const [bookPreview, setBookPreview] = useState(null);
  const [completedDownload, setCompletedDownload] = useState(null);
  const parsedBookRef = useRef(null);
  const parseGenerationRef = useRef(0);

  function clearParsedBook() {
    parsedBookRef.current = null;
    setBookPreview(null);
    setProgress(null);
    setCompletedDownload(null);
  }

  function redownload() {
    if (completedDownload) {
      downloadEpubBlob(completedDownload.blob, completedDownload.title);
    }
  }

  async function selectFile(file) {
    if (!file) {
      setEpubFile(null);
      setFileError("No file selected.");
      clearParsedBook();
      return;
    }

    if (!isEpubFile(file)) {
      setEpubFile(null);
      setFileError("Please select a valid EPUB file.");
      clearParsedBook();
      return;
    }

    const parseGeneration = ++parseGenerationRef.current;

    setEpubFile(file);
    setFileError("");
    setBookPreview(null);
    setIsParsing(true);
    setProgress(createParsingProgress());

    try {
      const parsed = await loadParsedBook(file);
      if (parseGeneration !== parseGenerationRef.current) {
        return;
      }

      parsedBookRef.current = parsed;
      setBookPreview(parsed.bookMeta);
      setProgress(
        createReadyProgress(parsed.bookMeta.title, parsed.storyChapters)
      );
    } catch (error) {
      if (parseGeneration !== parseGenerationRef.current) {
        return;
      }
      console.error("Error while reading EPUB:", error);
      parsedBookRef.current = null;
      setBookPreview(null);
      setFileError(error.message || "Error while reading EPUB.");
      setProgress(
        createErrorProgress(
          error.message || "Error while reading EPUB.",
          createParsingProgress()
        )
      );
    } finally {
      setIsParsing(false);
    }
  }

  function dismissBook() {
    if (isLoading) {
      return;
    }

    parseGenerationRef.current += 1;
    setEpubFile(null);
    setFileError("");
    setIsParsing(false);
    clearParsedBook();
  }

  async function generateIllustratedEpub() {
    const parsed = parsedBookRef.current;

    if (!epubFile) {
      setProgress(
        createErrorProgress("No EPUB file selected. Please select a file.")
      );
      return null;
    }

    if (!parsed) {
      setProgress(
        createErrorProgress(
          "EPUB is still loading. Wait for chapters to appear, then try again."
        )
      );
      return null;
    }

    setIsLoading(true);
    setCompletedDownload(null);
    let currentProgress = progress;

    try {
      const { epubReader, bookMeta, allChapters, storyChapters } = parsed;
      const selectedImageModel = getImageModel(imageModel).id;

      const chapters = await runImagePipeline({
        allChapters,
        storyChapters,
        epubReader,
        bookTitle: bookMeta.title,
        concurrency: PIPELINE_CONCURRENCY,
        imageStyle,
        imageModel: selectedImageModel,
        initialProgress: currentProgress,
        onProgress: (update) => {
          currentProgress = update;
          setProgress(update);
        },
      });

      currentProgress = setStitchingProgress(
        currentProgress,
        STITCH_STATUS.ACTIVE,
        "Assembling illustrated EPUB…"
      );
      setProgress(currentProgress);

      const epubBlob = await buildEpub({
        title: bookMeta.title,
        author: bookMeta.author,
        cover: bookMeta.cover,
        chapters,
      });

      setCompletedDownload({ blob: epubBlob, title: bookMeta.title });

      currentProgress = setStitchingProgress(
        currentProgress,
        STITCH_STATUS.ACTIVE,
        "Starting download…"
      );
      setProgress(currentProgress);
      downloadEpubBlob(epubBlob, bookMeta.title);

      currentProgress = createCompleteProgress(bookMeta.title, currentProgress);
      setProgress(currentProgress);

      return { title: bookMeta.title };
    } catch (error) {
      console.error("Error while processing EPUB:", error);
      setProgress(
        createErrorProgress(
          error.message || "Error while processing EPUB.",
          currentProgress
        )
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    epubFile,
    fileError,
    isParsing,
    isLoading,
    progress,
    bookPreview,
    imageStyle,
    imageModel,
    selectFile,
    dismissBook,
    generateIllustratedEpub,
    setImageStyle,
    setImageModel,
    completedDownload,
    redownload,
  };
}

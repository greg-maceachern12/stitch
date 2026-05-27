"use client";

import { useRef, useState } from "react";
import { DEFAULT_IMAGE_MODEL, getImageModel } from "@/lib/imageModels";
import { DEFAULT_IMAGE_STYLE } from "@/lib/imageStyles";
import {
  DEFAULT_ILLUSTRATION_MODE,
  getIllustrationMode,
  ILLUSTRATION_MODES,
  shouldUseSectionArt,
} from "@/lib/illustrationModes";
import {
  MAX_ILLUSTRATED_CHAPTERS,
  STITCH_STATUS,
  applyFullBookUnlock,
  applyFullBookLock,
  createReadyProgress,
  createCompleteProgress,
  createErrorProgress,
  createParsingProgress,
  PHASES,
  setStitchingProgress,
  withReadyPlacement,
} from "@/lib/generationProgress";
import { isFullBookPasscodeValid } from "@/lib/fullBookUnlock";
import { downloadEpubBlob } from "@/lib/client/downloads";
import { fetchBlobAndConvertToBase64 } from "@/lib/epub/assets";
import { buildEpub } from "@/lib/epub/buildEpub";
import {
  extractStoryChapters,
  flattenToc,
  parseEpubFile,
} from "@/lib/epub/chapters";
import { logGenerationStart } from "@/lib/client/generationLog";
import { runImagePipeline } from "@/lib/epub/imagePipeline";
import { extractBookIdentity } from "@/lib/storyAtlas/metadata";
import { shouldGenerateStoryAtlas } from "@/lib/storyAtlas/enabled";
import { prepareStoryAtlasForEpub } from "@/lib/storyAtlas/prepareStoryAtlas";
import { runStoryAtlasPipeline } from "@/lib/storyAtlas/atlasPipeline";

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

function bookMetaFrom(metadata, cover, storyChapters, fullBookUnlocked = false) {
  const chapterCount = storyChapters.length;
  return {
    title: metadata.title || "Untitled",
    author: metadata.creator || "Unknown",
    cover: cover || FALLBACK_COVER,
    chapterCount,
    illustratedChapterCount: fullBookUnlocked
      ? chapterCount
      : Math.min(MAX_ILLUSTRATED_CHAPTERS, chapterCount),
    fullBookUnlocked,
    language: formatMetadataValue(metadata.language),
    publisher: formatMetadataValue(metadata.publisher),
  };
}

async function loadParsedBook(epubFile, fullBookUnlocked = false) {
  const { epubReader, metadata, packageMetadata, toc } =
    await parseEpubFile(epubFile);
  const cover = await readBookCover(epubReader);
  const allChapters = flattenToc(toc);
  const storyChapters = extractStoryChapters(allChapters);
  const bookMeta = bookMetaFrom(metadata, cover, storyChapters, fullBookUnlocked);
  const bookIdentity = extractBookIdentity(metadata, packageMetadata);

  return { epubReader, bookMeta, bookIdentity, allChapters, storyChapters };
}

export function useIllustratedEpub() {
  const [epubFile, setEpubFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [imageStyle, setImageStyle] = useState(DEFAULT_IMAGE_STYLE);
  const [imageModel, setImageModelState] = useState(DEFAULT_IMAGE_MODEL);
  const [illustrationMode, setIllustrationModeState] = useState(
    DEFAULT_ILLUSTRATION_MODE
  );
  const setImageModel = (modelId) => {
    setImageModelState(getImageModel(modelId).id);
  };
  const [bookPreview, setBookPreview] = useState(null);
  const [completedDownload, setCompletedDownload] = useState(null);
  const [proUnlocked, setProUnlocked] = useState(false);
  const [proUnlockError, setProUnlockError] = useState("");
  const [fullBookUnlocked, setFullBookUnlocked] = useState(false);
  const [storyAtlasEnabled, setStoryAtlasEnabled] = useState(false);
  const setIllustrationMode = (mode) => {
    const resolved = getIllustrationMode(mode);
    if (resolved === ILLUSTRATION_MODES.SECTION_ART && !proUnlocked) {
      setIllustrationModeState(DEFAULT_ILLUSTRATION_MODE);
      return;
    }
    setIllustrationModeState(resolved);
    setProgress((current) =>
      withReadyPlacement(
        current,
        shouldUseSectionArt(proUnlocked, resolved)
      )
    );
  };
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
    setIllustrationModeState(DEFAULT_ILLUSTRATION_MODE);
    setIsParsing(true);
    setProgress(createParsingProgress());

    try {
      const parsed = await loadParsedBook(file, fullBookUnlocked);
      if (parseGeneration !== parseGenerationRef.current) {
        return;
      }

      parsedBookRef.current = parsed;
      setProUnlockError("");
      setBookPreview(parsed.bookMeta);
      setProgress(
        createReadyProgress(
          parsed.bookMeta.title,
          parsed.storyChapters,
          fullBookUnlocked,
          false,
          storyAtlasEnabled && proUnlocked
        )
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

  function unlockPro(passcode) {
    if (!isFullBookPasscodeValid(passcode)) {
      setProUnlockError("Invalid passcode. Please try again.");
      return false;
    }

    setProUnlocked(true);
    setProUnlockError("");
    setIllustrationModeState(DEFAULT_ILLUSTRATION_MODE);
    return true;
  }

  function setFullBookEnabled(enabled) {
    if (!proUnlocked) return;

    setFullBookUnlocked(enabled);

    if (bookPreview) {
      setBookPreview({
        ...bookPreview,
        fullBookUnlocked: enabled,
        illustratedChapterCount: enabled
          ? bookPreview.chapterCount
          : Math.min(MAX_ILLUSTRATED_CHAPTERS, bookPreview.chapterCount),
      });
    }

    if (progress?.phase === PHASES.READY) {
      setProgress(
        enabled
          ? applyFullBookUnlock(progress, progress.sectionArtEnabled)
          : applyFullBookLock(progress, progress.sectionArtEnabled)
      );
    }
  }

  function setStoryAtlasEnabledState(enabled) {
    if (!proUnlocked) return;
    setStoryAtlasEnabled(enabled);

    if (progress?.phase === PHASES.READY && parsedBookRef.current?.storyChapters) {
      setProgress((current) =>
        createReadyProgress(
          bookPreview?.title ?? current.bookTitle,
          parsedBookRef.current.storyChapters,
          current.fullBookUnlocked,
          current.sectionArtEnabled,
          enabled
        )
      );
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
    setProUnlocked(false);
    setProUnlockError("");
    setFullBookUnlocked(false);
    setStoryAtlasEnabled(false);
    setIllustrationModeState(DEFAULT_ILLUSTRATION_MODE);
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
      const effectiveImageModel = proUnlocked
        ? imageModel
        : DEFAULT_IMAGE_MODEL;
      const selectedImageModel = getImageModel(effectiveImageModel).id;

      const effectiveFullBook = proUnlocked && fullBookUnlocked;
      const useSectionArt = shouldUseSectionArt(proUnlocked, illustrationMode);
      const generateAtlas = shouldGenerateStoryAtlas(
        proUnlocked,
        storyAtlasEnabled
      );

      logGenerationStart({
        bookMeta,
        storyChapters,
        allChapters,
        imageStyle,
        imageModel: selectedImageModel,
        useSectionArt,
        proUnlocked,
        fullBookUnlocked: effectiveFullBook,
        storyAtlasEnabled: generateAtlas,
        concurrency: PIPELINE_CONCURRENCY,
      });

      let storyAtlas = null;
      if (generateAtlas) {
        const atlasResult = await runStoryAtlasPipeline({
          bookIdentity: parsed.bookIdentity,
          imageStyle,
          imageModel: selectedImageModel,
          initialProgress: {
            ...(currentProgress ?? {}),
            bookTitle: bookMeta.title,
            fullBookUnlocked: effectiveFullBook,
            sectionArtEnabled: useSectionArt,
            storyAtlasEnabled: true,
          },
          onProgress: (update) => {
            currentProgress = update;
            setProgress(update);
          },
        });

        if (atlasResult?.plan) {
          storyAtlas = prepareStoryAtlasForEpub(
            atlasResult.plan,
            atlasResult.portraits,
            bookMeta.title
          );
        }
      }

      const chapters = await runImagePipeline({
        allChapters,
        storyChapters,
        epubReader,
        bookTitle: bookMeta.title,
        concurrency: PIPELINE_CONCURRENCY,
        imageStyle,
        imageModel: selectedImageModel,
        useSectionArt,
        initialProgress: {
          ...(currentProgress ?? {}),
          sectionArtEnabled: useSectionArt,
          fullBookUnlocked: effectiveFullBook,
        },
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
        storyAtlas,
        chapters,
      });

      setCompletedDownload({
        blob: epubBlob,
        title: bookMeta.title,
        cover: bookMeta.cover,
      });

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
    illustrationMode,
    selectFile,
    dismissBook,
    generateIllustratedEpub,
    setImageStyle,
    setImageModel,
    setIllustrationMode,
    completedDownload,
    redownload,
    proUnlocked,
    proUnlockError,
    unlockPro,
    clearProUnlockError: () => setProUnlockError(""),
    fullBookUnlocked,
    setFullBookEnabled,
    storyAtlasEnabled,
    setStoryAtlasEnabled: setStoryAtlasEnabledState,
  };
}

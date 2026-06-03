"use client";

import { useRef } from "react";
import { UploadCloud, Wand2 } from "lucide-react";
import BookPreview, {
  BookPreviewParsing,
  DismissButton,
} from "@/components/BookPreview";
import OptionsPill from "@/components/OptionsPill";
const FileUpload = ({
  onFileChange,
  fileError,
  onGenerate,
  epubFile,
  isParsing,
  isLoading,
  canVisualize,
  imageStyle,
  onImageStyleChange,
  imageModel,
  onImageModelChange,
  illustrationMode,
  onIllustrationModeChange,
  proUnlocked,
  onProUnlock,
  proUnlockError,
  onClearProUnlockError,
  fullBookUnlocked,
  onFullBookChange,
  storyAtlasEnabled,
  onStoryAtlasChange,
  bookPreview,
  onDismissBook,
}) => {
  const fileInputRef = useRef(null);
  const hasFile = Boolean(epubFile);
  const showUploadZone = !hasFile;
  const showBookSlot = hasFile;

  const handleInputChange = (event) => {
    const file = event.target.files[0];
    onFileChange(file);
    event.target.value = "";
  };

  const openFilePicker = () => {
    if (!isLoading && !isParsing) {
      fileInputRef.current?.click();
    }
  };

  const canDismiss = !isLoading;

  const cardContent = (
    <>
      <div className="space-y-2">
        <div className="relative flex items-center justify-between gap-3 overflow-visible">
          <span className="font-display-semibold text-sm text-foreground">
            {showUploadZone ? "Your EPUB file" : "Your book"}
          </span>
          <OptionsPill
            imageStyle={imageStyle}
            onImageStyleChange={onImageStyleChange}
            imageModel={imageModel}
            onImageModelChange={onImageModelChange}
            illustrationMode={illustrationMode}
            onIllustrationModeChange={onIllustrationModeChange}
            proUnlocked={proUnlocked}
            onProUnlock={onProUnlock}
            proUnlockError={proUnlockError}
            onClearProUnlockError={onClearProUnlockError}
            fullBookUnlocked={fullBookUnlocked}
            onFullBookChange={onFullBookChange}
            storyAtlasEnabled={storyAtlasEnabled}
            onStoryAtlasChange={onStoryAtlasChange}
            disabled={isLoading || isParsing}
          />
        </div>

        {showUploadZone && (
          <label
            htmlFor="file-upload"
            className="group flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed border-border bg-background px-6 py-10 transition-colors hover:border-foreground/25 hover:bg-hover-surface/50"
          >
            <UploadCloud className="h-8 w-8 text-muted transition-colors group-hover:text-foreground" />
            <span className="text-center text-sm text-muted">
              Click to choose an EPUB or drag and drop
            </span>
          </label>
        )}

        {showBookSlot && isParsing && (
          <BookPreviewParsing
            onDismiss={onDismissBook}
            dismissDisabled={!canDismiss}
          />
        )}

        {showBookSlot && bookPreview && !isParsing && (
          <BookPreview
            book={bookPreview}
            onDismiss={onDismissBook}
            dismissDisabled={!canDismiss}
          />
        )}

        {showBookSlot && !isParsing && !bookPreview && (
          <div className="relative space-y-3 rounded-md border border-border bg-background p-6 pr-10">
            {onDismissBook && (
              <DismissButton
                onDismiss={onDismissBook}
                disabled={!canDismiss}
              />
            )}
            <p className="text-sm text-muted">
              {fileError || "This EPUB could not be loaded."}
            </p>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isLoading}
              className="text-sm text-foreground underline-offset-4 hover:underline disabled:opacity-40"
            >
              Choose another file
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept=".epub"
          onChange={handleInputChange}
          className="sr-only"
        />
        {fileError && showUploadZone && (
          <p className="text-sm text-danger" role="alert">
            {fileError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading || isParsing || !hasFile || !canVisualize}
          className="btn-primary"
        >
          <Wand2 className="h-4 w-4" />
          <span>
            {isLoading
              ? "Processing…"
              : isParsing
                ? "Reading EPUB…"
                : "Visualize"}
          </span>
        </button>
      </div>
    </>
  );

  if (proUnlocked) {
    return (
      <div className="pro-gradient-ring pro-gradient-ring--animate-in w-full overflow-visible rounded-md">
        <div className="pro-gradient-ring-inner space-y-6 overflow-visible bg-surface p-6 shadow-card">
          {cardContent}
        </div>
      </div>
    );
  }

  return <div className="form-card w-full space-y-6">{cardContent}</div>;
};

export default FileUpload;

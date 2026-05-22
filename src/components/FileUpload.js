"use client";

import { useState } from "react";
import { UploadCloud, Wand2 } from "lucide-react";
import OptionsPill from "@/components/OptionsPill";

const FileUpload = ({
  handleFileChange,
  fileError,
  handleParseAndGenerateImage,
  epubFile,
  isLoading,
  imageStyle,
  onImageStyleChange,
  imageModel,
  onImageModelChange,
}) => {
  const [fileName, setFileName] = useState("No file chosen");

  const onFileChange = (event) => {
    const file = event.target.files[0];
    setFileName(file ? file.name : "No file chosen");
    handleFileChange(event);
  };

  const hasFile = Boolean(epubFile);

  return (
    <div className="form-card w-full space-y-6">
      <div className="space-y-2">
        <div className="relative flex items-center justify-between gap-3 overflow-visible">
          <label htmlFor="file-upload" className="text-sm font-medium text-foreground">
            Your EPUB file
          </label>
          <OptionsPill
            imageStyle={imageStyle}
            onImageStyleChange={onImageStyleChange}
            imageModel={imageModel}
            onImageModelChange={onImageModelChange}
            disabled={isLoading}
          />
        </div>
        <label
          htmlFor="file-upload"
          className="group flex cursor-pointer flex-col items-center gap-3 rounded-md border-2 border-dashed border-border bg-background px-6 py-10 transition-colors hover:border-foreground/25 hover:bg-hover-surface/50"
        >
          <UploadCloud className="h-8 w-8 text-muted transition-colors group-hover:text-foreground" />
          <span className="text-center text-sm text-muted">
            {fileName === "No file chosen"
              ? "Click to choose an EPUB or drag and drop"
              : fileName}
          </span>
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".epub"
          onChange={onFileChange}
          className="sr-only"
        />
        {fileError && (
          <p className="text-sm text-danger" role="alert">
            {fileError}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleParseAndGenerateImage}
        disabled={isLoading || !hasFile}
        className="btn-primary"
      >
        <Wand2 className="h-4 w-4" />
        <span>{isLoading ? "Processing…" : "Visualize"}</span>
      </button>
    </div>
  );
};

export default FileUpload;

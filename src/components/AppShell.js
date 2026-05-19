"use client";

import { useState } from "react";
import SiteChrome from "@/components/SiteChrome";
import FileUpload from "@/components/FileUpload";
import Loading from "@/components/Loading";
import AccessCode from "@/components/AccessCode";
import {
  handleFileChange,
  handleParseAndGenerateImage,
  handleDownloadSampleBook,
} from "@/coreFunctions/service";

export default function AppShell() {
  const [epubFile, setEpubFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isAccessGranted, setIsAccessGranted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleAccessGranted = () => setIsAccessGranted(true);

  const handleFileChangeWrapper = (event) => {
    handleFileChange(event.target.files[0], setEpubFile, setFileError);
  };

  const handleParseAndGenerateImageWrapper = async () => {
    await handleParseAndGenerateImage(epubFile, setIsLoading, setProgress);
  };

  return (
    <SiteChrome variant="form">
      <header className="mb-10 w-full space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Turn words into worlds
        </h1>
        <p className="mx-auto max-w-md text-base text-muted">
          Upload an EPUB and Visuai will add AI illustrations to each chapter — free for a
          limited time.
        </p>
      </header>

      <div className="w-full space-y-6">
        {isAccessGranted ? (
          <FileUpload
            handleFileChange={handleFileChangeWrapper}
            fileError={fileError}
            handleParseAndGenerateImage={handleParseAndGenerateImageWrapper}
            epubFile={epubFile}
            isLoading={isLoading}
          />
        ) : (
          <AccessCode onAccessGranted={handleAccessGranted} />
        )}

        <Loading isLoading={isLoading} progress={progress} />
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
        <a
          href="https://buymeacoffee.com/gregmac"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Buy me a coffee
        </a>
        <span className="hidden text-border sm:inline" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={handleDownloadSampleBook}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Try the sample book
        </button>
      </footer>
    </SiteChrome>
  );
}

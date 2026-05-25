"use client";

import { useState } from "react";
import SiteChrome from "@/components/SiteChrome";
import FileUpload from "@/components/FileUpload";
import Loading from "@/components/Loading";
import CompleteCard from "@/components/CompleteCard";
import AccessCode from "@/components/AccessCode";
import { useIllustratedEpub } from "@/lib/client/useIllustratedEpub";
import { canStartVisualization, PHASES } from "@/lib/generationProgress";

export default function AppShell() {
  const [isAccessGranted, setIsAccessGranted] = useState(true);
  const epubWorkflow = useIllustratedEpub();

  const handleAccessGranted = () => setIsAccessGranted(true);
  const isComplete = epubWorkflow.progress?.phase === PHASES.COMPLETE;

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
        {isComplete ? (
          <CompleteCard
            bookTitle={epubWorkflow.completedDownload?.title}
            onRedownload={epubWorkflow.redownload}
          />
        ) : isAccessGranted ? (
          <FileUpload
            onFileChange={epubWorkflow.selectFile}
            onDismissBook={epubWorkflow.dismissBook}
            fileError={epubWorkflow.fileError}
            onGenerate={epubWorkflow.generateIllustratedEpub}
            epubFile={epubWorkflow.epubFile}
            isParsing={epubWorkflow.isParsing}
            isLoading={epubWorkflow.isLoading}
            canVisualize={canStartVisualization(
              epubWorkflow.progress,
              epubWorkflow.isParsing
            )}
            imageStyle={epubWorkflow.imageStyle}
            onImageStyleChange={epubWorkflow.setImageStyle}
            imageModel={epubWorkflow.imageModel}
            onImageModelChange={epubWorkflow.setImageModel}
            bookPreview={epubWorkflow.bookPreview}
          />
        ) : (
          <AccessCode onAccessGranted={handleAccessGranted} />
        )}

        {!isComplete && (
          <Loading
            isLoading={epubWorkflow.isLoading}
            isParsing={epubWorkflow.isParsing}
            progress={epubWorkflow.progress}
            imageModel={epubWorkflow.imageModel}
          />
        )}
      </div>

      <footer className="mt-12 text-center text-sm text-muted">
        <a
          href="https://buymeacoffee.com/gregmac"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Buy me a coffee
        </a>
      </footer>
    </SiteChrome>
  );
}

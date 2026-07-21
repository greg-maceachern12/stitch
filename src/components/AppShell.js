"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import FileUpload from "@/components/FileUpload";
import Loading from "@/components/Loading";
import CompleteCard from "@/components/CompleteCard";
import AccessCode from "@/components/AccessCode";
import VisuaiProChiclet, { useVisuaiProModal } from "@/components/VisuaiProChiclet";
import { useIllustratedEpub } from "@/lib/client/useIllustratedEpub";
import {
  canStartVisualization,
  CHAPTER_STATUS,
  PHASES,
} from "@/lib/generationProgress";

export default function AppShell() {
  const [isAccessGranted, setIsAccessGranted] = useState(true);
  const epubWorkflow = useIllustratedEpub();
  const proModal = useVisuaiProModal();

  const handleAccessGranted = () => setIsAccessGranted(true);
  const isComplete = epubWorkflow.progress?.phase === PHASES.COMPLETE;
  const illustratedCount = isComplete
    ? epubWorkflow.progress?.chapters?.filter(
        (chapter) => chapter.status === CHAPTER_STATUS.DONE
      ).length
    : null;

  return (
    <SiteChrome variant="form">
      <header className="mb-10 w-full space-y-3 text-center">
        <h1 className="flex flex-col items-center gap-3 text-3xl font-semibold text-foreground md:text-4xl">
          <span
            className="flex items-center justify-center gap-3 text-4xl md:gap-4 md:text-5xl"
            aria-hidden="true"
          >
            <span>📖</span>
            <ArrowRight
              className="h-7 w-7 shrink-0 text-muted md:h-8 md:w-8"
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>🌄</span>
          </span>
          Turn words into worlds
        </h1>
        <p className="mx-auto max-w-md text-base text-muted">
          Upload an EPUB and Visuai will create illustation for each chapter.
        </p>
        <div className="flex justify-center pt-1">
          <VisuaiProChiclet modalControl={proModal} />
        </div>
      </header>

      <div className="w-full space-y-6">
        {isComplete ? (
          <CompleteCard
            bookTitle={epubWorkflow.completedDownload?.title}
            cover={epubWorkflow.completedDownload?.cover}
            illustratedCount={illustratedCount}
            onRedownload={epubWorkflow.redownload}
            showProUpsell={!epubWorkflow.proUnlocked}
            onOpenPro={proModal.openModal}
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
            illustrationMode={epubWorkflow.illustrationMode}
            onIllustrationModeChange={epubWorkflow.setIllustrationMode}
            proUnlocked={epubWorkflow.proUnlocked}
            onProUnlock={epubWorkflow.unlockPro}
            onProUnlockWithOpenRouterKey={epubWorkflow.unlockProWithOpenRouterKey}
            onClearOpenRouterKeyUnlock={epubWorkflow.clearOpenRouterKeyUnlock}
            proUnlockError={epubWorkflow.proUnlockError}
            onClearProUnlockError={epubWorkflow.clearProUnlockError}
            fullBookUnlocked={epubWorkflow.fullBookUnlocked}
            onFullBookChange={epubWorkflow.setFullBookEnabled}
            storyAtlasEnabled={epubWorkflow.storyAtlasEnabled}
            onStoryAtlasChange={epubWorkflow.setStoryAtlasEnabled}
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
            illustrationMode={epubWorkflow.illustrationMode}
            proUnlocked={epubWorkflow.proUnlocked}
            fullBookUnlocked={epubWorkflow.fullBookUnlocked}
            storyAtlasEnabled={epubWorkflow.storyAtlasEnabled}
            onOpenPro={proModal.openModal}
          />
        )}
      </div>
    </SiteChrome>
  );
}

import { handlePost } from "@/lib/api/handleRoute";
import { selectIllustrationSections } from "@/lib/api/sectionSelection";

export async function POST(request) {
  return handlePost(
    request,
    async ({ bookTitle, chapterTitle, imageStyle, targetCount, candidates }) => {
      const sections = await selectIllustrationSections({
        bookTitle,
        chapterTitle,
        imageStyle,
        targetCount,
        candidates,
      });
      return Response.json({ sections });
    },
    "POST /api/select-illustration-sections"
  );
}

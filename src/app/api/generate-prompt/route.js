import { handlePost } from "@/lib/api/handleRoute";
import { generateImagePrompt } from "@/lib/api/promptGeneration";

export async function POST(request) {
  return handlePost(
    request,
    async ({ bookTitle, chapterTitle, imageStyle }) => {
      const response = await generateImagePrompt(
        bookTitle,
        chapterTitle,
        imageStyle
      );
      return Response.json({ response });
    },
    "POST /api/generate-prompt"
  );
}

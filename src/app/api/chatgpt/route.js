import { handlePost } from "@/lib/api/handleRoute";
import { generateImagePrompt } from "@/lib/api/chatgpt";

export async function POST(request) {
  return handlePost(
    request,
    async ({ bookTitle, chapterTitle }) => {
      const response = await generateImagePrompt(bookTitle, chapterTitle);
      return Response.json({ response });
    },
    "POST /api/chatgpt"
  );
}

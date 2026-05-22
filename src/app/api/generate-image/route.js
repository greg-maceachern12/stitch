import { handlePost } from "@/lib/api/handleRoute";
import { generateImage } from "@/lib/api/imageGeneration";

export async function POST(request) {
  return handlePost(
    request,
    async ({ prompt, imageStyle, imageModel }) => {
      const result = await generateImage(prompt, imageStyle, imageModel);
      return Response.json({ result });
    },
    "POST /api/generate-image"
  );
}

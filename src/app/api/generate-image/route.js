import { handlePost } from "@/lib/api/handleRoute";
import { generateImage } from "@/lib/api/imageGeneration";

export async function POST(request) {
  return handlePost(
    request,
    async ({ prompt, cheapModel }) => {
      const result = await generateImage(prompt, cheapModel);
      return Response.json({ result });
    },
    "POST /api/generate-image"
  );
}

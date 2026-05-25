import { handlePost } from "@/lib/api/handleRoute";
import { generateImage } from "@/lib/api/imageGeneration";
import { getImageModel } from "@/lib/imageModels";

export async function POST(request) {
  return handlePost(
    request,
    async ({ prompt, imageStyle, imageModel }) => {
      const { id: resolvedModel } = getImageModel(imageModel);
      const result = await generateImage(prompt, imageStyle, resolvedModel);
      return Response.json({ result });
    },
    "POST /api/generate-image"
  );
}

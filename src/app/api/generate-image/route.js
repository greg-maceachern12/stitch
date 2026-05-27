import { handlePost } from "@/lib/api/handleRoute";
import { generateImage } from "@/lib/api/imageGeneration";
import { getImageModel } from "@/lib/imageModels";

export async function POST(request) {
  return handlePost(
    request,
    async ({ prompt, imageStyle, imageModel, portrait }) => {
      const { id: resolvedModel } = getImageModel(imageModel);
      const result = await generateImage(prompt, imageStyle, resolvedModel, {
        portrait: Boolean(portrait),
      });
      return Response.json({ result });
    },
    "POST /api/generate-image"
  );
}

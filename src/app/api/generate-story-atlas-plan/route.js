import { handlePost } from "@/lib/api/handleRoute";
import { generateStoryAtlasPlan } from "@/lib/api/storyAtlasPlan";

export async function POST(request) {
  return handlePost(
    request,
    async (body) => {
      const plan = await generateStoryAtlasPlan(body);
      return Response.json({ plan });
    },
    "POST /api/generate-story-atlas-plan"
  );
}

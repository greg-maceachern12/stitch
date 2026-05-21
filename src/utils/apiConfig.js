const apiBase = process.env.NEXT_PUBLIC_APP_URL || "";

export const generatePromptApi = `${apiBase}/api/generate-prompt`;
export const generateImageApi = `${apiBase}/api/generate-image`;

const apiBase = process.env.NEXT_PUBLIC_APP_URL || "";

export const OpenAiChatAPI = `${apiBase}/api/chatgpt`;
export const SDimageAPI = `${apiBase}/api/stable-diffusion`;

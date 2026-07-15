import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null | undefined;

function getGeminiClient(): GoogleGenAI | null {
  if (client !== undefined) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  return client;
}

export function isGeminiConfigured(): boolean {
  return getGeminiClient() !== null;
}

export async function generateStructuredJson<T>({
  systemInstruction,
  prompt,
  timeoutMs = 30_000,
}: {
  systemInstruction: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<T | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[Gemini] Generation failed:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

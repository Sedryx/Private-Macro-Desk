import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

let client: GoogleGenAI | null | undefined;

function getGeminiClient(): GoogleGenAI | null {
  if (client !== undefined) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  return client;
}

export type GroundedTextResult = { text: string; grounded: boolean };

// Uses Gemini's built-in Google Search tool so answers are checked against live web results
// instead of relying on the model's training data, which is what makes this safe to use for
// filling in factual data points (e.g. a specific economic release's reported value).
export async function generateGroundedText({
  prompt,
  timeoutMs = 30_000,
}: {
  prompt: string;
  timeoutMs?: number;
}): Promise<GroundedTextResult | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        abortSignal: AbortSignal.timeout(timeoutMs),
      },
    });

    const text = response.text;
    if (!text) return null;

    const grounded = (response.candidates?.[0]?.groundingMetadata?.groundingChunks?.length ?? 0) > 0;
    return { text: text.trim(), grounded };
  } catch (error) {
    console.error("[Gemini] Grounded lookup failed:", error instanceof Error ? error.message : "Unknown error");
    return null;
  }
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

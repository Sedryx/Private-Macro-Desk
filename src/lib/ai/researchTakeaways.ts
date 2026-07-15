import { generateStructuredJson } from "@/lib/ai/gemini";

const MAX_SOURCE_CHARS = 12_000;

type TakeawaysPayload = { takeaways?: unknown };

export async function generateKeyTakeaways(title: string, fullText: string): Promise<string[] | null> {
  const payload = await generateStructuredJson<TakeawaysPayload>({
    systemInstruction:
      "You are a macro analyst writing for a private two-trader desk. " +
      "Given the full text of a real central bank statement, extract 3 to 6 short key takeaways a trader needs. " +
      "Never invent figures or claims not present in the source text. " +
      'Return ONLY JSON matching {"takeaways": string[]}.',
    prompt: `Title: ${title}\n\nStatement text:\n${fullText.slice(0, MAX_SOURCE_CHARS)}`,
  });

  const takeaways = payload?.takeaways;
  if (!Array.isArray(takeaways)) return null;

  const cleaned = takeaways.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return cleaned.length > 0 ? cleaned : null;
}

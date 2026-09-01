import { GoogleGenAI, Type, Schema } from '@google/genai';

// Resilient fallback ladder ordered by availability and performance
export const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface FallbackContentOptions {
  systemInstruction?: string;
  contents: any[];
  config?: any;
}

/**
 * Execute Gemini requests with an automated fallback ladder to catch 503, 429, 404, 500
 */
export async function generateContentWithFallback(options: FallbackContentOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          ...options.config,
        },
      });

      const text = response.text || '';
      return { text, modelUsed: modelName };
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed: ${lastError?.message || 'Unknown error'}`);
}

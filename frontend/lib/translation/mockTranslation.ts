"use client";

export type BridgeLanguage = "en" | "es" | "hi";

export interface TranslationResult {
  text: string;
  isDemo: boolean;
}

export class TranslationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslationError";
  }
}

export const MOCK_TRANSLATION_ENABLED =
  process.env.NEXT_PUBLIC_USE_MOCK_TRANSLATION === "true";

const DEMO_TRANSLATIONS: Record<Exclude<BridgeLanguage, "en">, Record<string, string>> = {
  es: {
    "necesito ayuda con mi solicitud de vivienda":
      "I need help with my housing application.",
    "que documentos necesito": "What documents do I need?",
    "puedo corregir esta información": "Can I correct this information?",
    "no entiendo esta pregunta": "I do not understand this question.",
  },
  hi: {
    "मुझे अपने आवास आवेदन में मदद चाहिए":
      "I need help with my housing application.",
    "मुझे कौन से दस्तावेज़ चाहिए": "What documents do I need?",
    "क्या मैं यह जानकारी सही कर सकता हूँ": "Can I correct this information?",
    "मुझे यह सवाल समझ नहीं आ रहा है": "I do not understand this question.",
  },
};

/**
 * Demo-only translation boundary. Replace this module with a backend client
 * when a reviewed translation endpoint is available; never add provider keys
 * to the browser.
 */
export async function translateToEnglish(
  text: string,
  language: BridgeLanguage
): Promise<TranslationResult> {
  const normalized = text.trim();
  if (!normalized) throw new TranslationError("Enter or record a message first.");
  if (language === "en") return { text: normalized, isDemo: false };
  if (!MOCK_TRANSLATION_ENABLED) {
    throw new TranslationError(
      "Demo translation is disabled. You can type the English text manually."
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 350));
  const translation = DEMO_TRANSLATIONS[language][normalized.toLowerCase()];
  if (!translation) {
    throw new TranslationError(
      "This demo does not recognize that phrase yet. Please type the English translation manually."
    );
  }
  return { text: translation, isDemo: true };
}

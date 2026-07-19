"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Languages, Mic, MicOff, Volume2 } from "lucide-react";
import { useSpeechRecognition, type SpeechLanguage, type SpeechStatus } from "@/lib/a11y/useSpeechRecognition";
import { useAnnounce } from "@/lib/a11y/AnnouncerContext";
import {
  MOCK_TRANSLATION_ENABLED,
  translateToEnglish,
  type BridgeLanguage,
} from "@/lib/translation/mockTranslation";
import { Button } from "@/components/ui/Button";

const INSTRUCTIONS =
  "Choose your language, type or record your message, then review and confirm the English translation before using it.";

const LANGUAGES: Array<{
  value: BridgeLanguage;
  speech: SpeechLanguage;
  label: string;
}> = [
  { value: "en", speech: "en-US", label: "English" },
  { value: "es", speech: "es-ES", label: "Spanish" },
  { value: "hi", speech: "hi-IN", label: "Hindi" },
];

const STATUS_LABELS: Record<SpeechStatus, string> = {
  ready: "Ready",
  listening: "Listening",
  processing: "Processing",
  stopped: "Stopped",
};

const STATUS_STYLES: Record<SpeechStatus, string> = {
  ready: "border-teal/30 bg-teal/10 text-teal",
  listening: "border-clay/40 bg-clay/10 text-clay",
  processing: "border-gold/50 bg-gold/20 text-[#8A5A00]",
  stopped: "border-line bg-paper text-muted",
};

export function LanguageBridge() {
  const { announce } = useAnnounce();
  const [language, setLanguage] = useState<BridgeLanguage>("en");
  const [sourceText, setSourceText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [translationConfirmed, setTranslationConfirmed] = useState(false);
  const [translationBusy, setTranslationBusy] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const selectedLanguage = useMemo(
    () => LANGUAGES.find((item) => item.value === language) ?? LANGUAGES[0],
    [language]
  );

  const translate = useCallback(
    async (text: string) => {
      setTranslationError(null);
      setTranslationConfirmed(false);
      setTranslationBusy(true);
      try {
        const result = await translateToEnglish(text, language);
        setEnglishText(result.text);
        announce(
          result.isDemo
            ? "A demo English translation is ready to review."
            : "The English text is ready to review."
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Translation is unavailable. You can type the English text manually.";
        setTranslationError(message);
        setEnglishText("");
        announce(message, "assertive");
      } finally {
        setTranslationBusy(false);
      }
    },
    [announce, language]
  );

  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      setSourceText(transcript);
      setEnglishText("");
      setTranslationConfirmed(false);
      if (isFinal) return translate(transcript);
    },
    [translate]
  );

  const speech = useSpeechRecognition({
    language: selectedLanguage.speech,
    onTranscript: handleTranscript,
  });

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function handleLanguageChange(nextLanguage: BridgeLanguage) {
    speech.stop();
    setLanguage(nextLanguage);
    setSourceText("");
    setEnglishText("");
    setTranslationError(null);
    setTranslationConfirmed(false);
  }

  function handleSourceChange(value: string) {
    setSourceText(value);
    setEnglishText("");
    setTranslationError(null);
    setTranslationConfirmed(false);
  }

  function handleStart() {
    if (!speech.supported) {
      const message = "Microphone is not supported here. You can type your message instead.";
      setTranslationError(message);
      announce(message, "assertive");
      return;
    }
    speech.start();
    announce(`Listening in ${selectedLanguage.label}.`);
  }

  function handleStop() {
    speech.stop();
    announce("Recording stopped.");
  }

  function handleReadInstructions() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      announce("Read aloud is not supported in this browser.", "assertive");
      return;
    }
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(INSTRUCTIONS);
    utterance.lang = "en-US";
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    setIsReading(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function handleConfirm() {
    if (!englishText.trim()) return;
    setTranslationConfirmed(true);
    announce("English translation confirmed and ready to use.");
  }

  const isListening = speech.status === "listening";
  const displayedStatus = translationBusy ? "processing" : speech.status;
  const statusLabel = STATUS_LABELS[displayedStatus];

  return (
    <section
      aria-labelledby="language-bridge-heading"
      className="space-y-5 rounded-card border border-line bg-paper p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-clay" aria-hidden="true" />
            <h2 id="language-bridge-heading" className="text-xl">
              Language Bridge
            </h2>
          </div>
          <p className="mt-1 max-w-prose text-muted">
            Use your preferred language to share a message. Review and confirm
            the English text before it is used.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleReadInstructions}
          aria-pressed={isReading}
          className="shrink-0"
        >
          <Volume2 className="h-4 w-4" aria-hidden="true" />
          {isReading ? "Stop reading" : "Read instructions aloud"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="language-bridge-language" className="block text-sm font-medium text-ink">
            Your language
          </label>
          <select
            id="language-bridge-language"
            value={language}
            onChange={(event) => handleLanguageChange(event.target.value as BridgeLanguage)}
            className="mt-1 min-h-[44px] w-full rounded-card border border-line bg-paper px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span
            className={`inline-flex min-h-[32px] items-center rounded-full border px-3 py-1 text-sm font-medium ${STATUS_STYLES[displayedStatus]}`}
            role="status"
            aria-live="polite"
          >
            <span className="mr-2 h-2 w-2 rounded-full bg-current" aria-hidden="true" />
            {statusLabel}
          </span>
          <span className="text-sm text-muted">{selectedLanguage.label}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={handleStart}
          disabled={isListening || speech.status === "processing" || translationBusy}
          aria-label={`Start recording in ${selectedLanguage.label}`}
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Start Recording
        </Button>
        <Button
          variant="secondary"
          onClick={handleStop}
          disabled={!isListening}
          aria-label="Stop recording"
        >
          <MicOff className="h-4 w-4" aria-hidden="true" />
          Stop Recording
        </Button>
        {!speech.supported && (
          <p className="flex items-center text-sm text-muted">
            Microphone unavailable. Type below instead.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="language-bridge-original" className="block text-sm font-medium text-ink">
            Original message ({selectedLanguage.label})
          </label>
          <textarea
            id="language-bridge-original"
            value={sourceText}
            onChange={(event) => handleSourceChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void translate(sourceText);
              }
            }}
            placeholder="Type here if you prefer not to use the microphone."
            rows={6}
            className="mt-1 w-full resize-y rounded-card border border-line bg-paper px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            aria-describedby="language-bridge-keyboard-help"
          />
          <p id="language-bridge-keyboard-help" className="mt-1 text-xs text-muted">
            Press Ctrl+Enter or Command+Enter to translate.
          </p>
          <Button
            variant="secondary"
            onClick={() => void translate(sourceText)}
            disabled={!sourceText.trim() || translationBusy}
            className="mt-2"
          >
            Translate to English
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="language-bridge-english" className="block text-sm font-medium text-ink">
              English translation
            </label>
            {language !== "en" && (
              <span className="text-xs font-medium text-muted">
                {MOCK_TRANSLATION_ENABLED ? "Demo translation" : "Manual fallback"}
              </span>
            )}
          </div>
          <textarea
            id="language-bridge-english"
            value={englishText}
            onChange={(event) => {
              setEnglishText(event.target.value);
              setTranslationConfirmed(false);
            }}
            placeholder="Your English translation will appear here. You can edit it."
            rows={6}
            className="mt-1 w-full resize-y rounded-card border border-line bg-paper px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!englishText.trim() || translationConfirmed}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {translationConfirmed ? "Translation confirmed" : "Use this translation"}
            </Button>
            {translationConfirmed && (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-teal" role="status">
                <Check className="h-4 w-4" aria-hidden="true" />
                Ready to use
              </span>
            )}
          </div>
        </div>
      </div>

      {(speech.error || translationError) && (
        <div
          className="rounded-card border border-danger/40 bg-[#F8E4E3] p-3 text-sm text-danger"
          role="alert"
          aria-live="assertive"
        >
          {speech.error ?? translationError}
        </div>
      )}

      <p className="text-sm text-muted" aria-live="polite">
        Language Bridge translates your words only. It never decides eligibility.
      </p>
    </section>
  );
}

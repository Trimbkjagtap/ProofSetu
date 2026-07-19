"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechLanguage = "en-US" | "es-ES" | "hi-IN";
export type SpeechStatus = "ready" | "listening" | "processing" | "stopped";

interface SpeechAlternative {
  transcript: string;
}

interface SpeechResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechAlternative;
}

interface SpeechResultList {
  readonly length: number;
  [index: number]: SpeechResult;
}

interface SpeechEvent {
  resultIndex: number;
  results: SpeechResultList;
}

interface SpeechErrorEvent {
  error?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null
  );
}

function speechErrorMessage(code?: string): string {
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Microphone permission was denied. You can type your message instead.";
  }
  return "We couldn’t hear that. You can try again or type your message instead.";
}

interface UseSpeechRecognitionOptions {
  language: SpeechLanguage;
  onTranscript: (transcript: string, isFinal: boolean) => void | Promise<void>;
}

/** Push-to-talk browser speech recognition. Audio is never stored. */
export function useSpeechRecognition({
  language,
  onTranscript,
}: UseSpeechRecognitionOptions) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>("ready");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const processingRef = useRef(false);
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;

  useEffect(() => {
    setSupported(getSpeechRecognitionConstructor() !== null);
  }, []);

  const stop = useCallback(() => {
    processingRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("stopped");
  }, []);

  const start = useCallback(() => {
    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor || recognitionRef.current) return;

    const recognition = new Constructor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    processingRef.current = false;
    setError(null);
    setStatus("listening");

    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        transcript += result[0]?.transcript ?? "";
        isFinal = isFinal || result.isFinal;
      }
      if (!transcript.trim()) return;

      if (isFinal) {
        processingRef.current = true;
        setStatus("processing");
      }
      const callbackResult = callbackRef.current(transcript.trim(), isFinal);
      if (isFinal && callbackResult instanceof Promise) {
        void callbackResult.finally(() => {
          if (processingRef.current) setStatus("ready");
        });
      } else if (isFinal) {
        setStatus("ready");
      }
    };

    recognition.onerror = (event) => {
      processingRef.current = false;
      recognitionRef.current = null;
      const message = speechErrorMessage(event.error);
      setError(message);
      setStatus("stopped");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!processingRef.current) setStatus("stopped");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setError("Microphone could not start. You can type your message instead.");
      setStatus("stopped");
    }
  }, [language]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { supported, status, error, start, stop };
}

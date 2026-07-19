"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Send, Trash2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/useFocusTrap";
import { BotFace } from "./BotFace";
import {
  answerFor,
  questionsForPath,
  type ChatMessage,
} from "./helpContent";

/**
 * Floating help assistant ("Setu"). A gradient button opens a slide-in panel
 * with page-specific suggested questions and local mock answers. No AI/live
 * service is used — this is a demo help assistant.
 */
export function HelpAssistant() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const panelRef = useFocusTrap<HTMLDivElement>(open, () => setOpen(false));

  const questions = useMemo(() => questionsForPath(pathname), [pathname]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "bot", text: answerFor(q) },
    ]);
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    ask(input);
    setInput("");
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open help assistant. Need a hand?"
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#623B55_0%,#A6534F_55%,#E7B66B_100%)] py-2 pl-2 pr-2 text-white shadow-clay transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(166,83,79,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 sm:pr-4"
      >
        <span className="relative flex h-11 w-11 items-center justify-center">
          <span className="motion-safe:animate-wave [transform-origin:65%_70%]">
            <BotFace className="h-7 w-7" />
          </span>
          {/* Apricot notification dot */}
          <span
            className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-apricot"
            aria-hidden="true"
          />
        </span>
        <span className="hidden pr-1 text-sm font-semibold sm:inline">
          Need a hand?
        </span>
      </button>

      {/* Slide-in panel */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-navy/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="absolute right-0 top-0 flex h-full w-[26rem] max-w-[92vw] flex-col bg-paper shadow-raised motion-safe:animate-slide-in-right"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 bg-[linear-gradient(135deg,#623B55_0%,#A6534F_55%,#E7B66B_100%)] p-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                  <BotFace className="h-7 w-7" />
                </span>
                <div>
                  <p id="help-title" className="font-serif text-lg font-semibold">
                    Hi, I’m Setu
                  </p>
                  <p className="text-sm text-white/85">
                    I can help you understand this page.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close help"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card text-white/90 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="help-gradient flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="inline-flex items-center rounded-full border border-indigo/30 bg-white px-2.5 py-0.5 text-xs font-medium text-indigo">
                  Demo help assistant
                </span>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-navy focus-visible:outline-none"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Clear
                  </button>
                )}
              </div>

              {/* Conversation */}
              <div
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
                role="log"
                aria-live="polite"
                aria-label="Help conversation"
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user" ? "flex justify-end" : "flex justify-start"
                    }
                  >
                    <p
                      className={[
                        "max-w-[85%] rounded-card px-3 py-2 text-sm shadow-card",
                        m.role === "user"
                          ? "bg-navy text-white"
                          : "border border-line bg-white text-ink",
                      ].join(" ")}
                    >
                      {m.text}
                    </p>
                  </div>
                ))}

                {/* Suggested questions */}
                <div className="pt-1">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {messages.length === 0 ? "Try asking" : "More questions"}
                  </p>
                  <div className="flex flex-col gap-2">
                    {questions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => ask(q)}
                        className="rounded-full border border-line bg-white px-4 py-2 text-left text-sm text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-clay hover:bg-clay/10 focus-visible:outline-none"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input */}
              <form
                onSubmit={onSend}
                className="flex items-center gap-2 border-t border-line bg-white p-3"
              >
                <label htmlFor="help-input" className="sr-only">
                  Ask a question
                </label>
                <input
                  id="help-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about this page…"
                  className="min-h-[44px] w-full rounded-card border border-line bg-white px-3 py-2 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-primary-gradient text-white shadow-card transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

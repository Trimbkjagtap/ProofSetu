export interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

/** The one required answer for any eligibility / qualification question. */
const ELIGIBILITY_ANSWER =
  "ProofSetu can explain your information and the published rule, but it cannot decide whether you qualify. A housing professional makes that decision.";

const GENERIC_ANSWER =
  "I can help with this page. Try one of the suggested questions, or ask about your documents, the calculation, or your packet. Remember: a housing professional makes the final decision.";

/** Page-specific suggested questions, keyed by route prefix. */
const QUESTIONS: Record<string, string[]> = {
  "/consent": [
    "What happens to my information?",
    "Does ProofSetu decide eligibility?",
    "Can I delete everything?",
  ],
  "/profile": [
    "Which documents can I add?",
    "How do I correct a detail?",
    "Why do I need to confirm every field?",
  ],
  "/fit-check": [
    "How was my income calculated?",
    "Where does this limit come from?",
    "Am I eligible?",
  ],
  "/readiness": [
    "What does Missing mean?",
    "What does Expired mean?",
    "How can I fix a document?",
  ],
  "/packet": [
    "What will be included?",
    "Can I leave out a document?",
    "Who reviews my packet?",
  ],
};

/** Simple, natural mock answers keyed by exact suggested question. */
const ANSWERS: Record<string, string> = {
  "What happens to my information?":
    "Your information stays in your browser for this visit only, and it’s removed when you choose “Delete everything.” This prototype uses synthetic documents, never real personal data.",
  "Does ProofSetu decide eligibility?": ELIGIBILITY_ANSWER,
  "Can I delete everything?":
    "Yes. Use “Delete everything” in the header at any time to clear your whole session and start over.",
  "Which documents can I add?":
    "You can add a synthetic pay stub, benefit letter, bank statement, or photo identification. Accepted formats are PDF, JPG, and PNG.",
  "How do I correct a detail?":
    "Choose “Change” on any detail, type the correct value, then choose “Save change.” It will be marked Corrected.",
  "Why do I need to confirm every field?":
    "Confirming makes sure the information is right before it’s used in the calculation and your packet. Nothing is used until you confirm it.",
  "How was my income calculated?":
    "We take the monthly income you confirmed and multiply it by 12 months to get an annual figure. For example, $2,650 × 12 = $31,800.",
  "Where does this limit come from?":
    "The published 2026 LIHTC program rule. You can see the source, section, and effective date in the citation card.",
  "Am I eligible?": ELIGIBILITY_ANSWER,
  "What does Missing mean?":
    "Missing means we don’t have that document yet. Use “Fix this” to add it on the documents step.",
  "What does Expired mean?":
    "Expired means the document is on file but past its valid date. Add a current version to replace it.",
  "How can I fix a document?":
    "Select “Fix this” on the item to return to the documents step, then add or replace the document.",
  "What will be included?":
    "Only the information you confirmed, plus the documents you keep selected. Nothing you didn’t confirm is included.",
  "Can I leave out a document?":
    "Yes. Uncheck any document in the “Documents to include” list to leave it out of your packet.",
  "Who reviews my packet?":
    "A qualified housing professional reviews it and makes the final decision. ProofSetu only helps you prepare.",
};

function stepKey(pathname: string): string {
  return (
    Object.keys(QUESTIONS).find((p) => pathname.startsWith(p)) ?? "/consent"
  );
}

export function questionsForPath(pathname: string): string[] {
  return QUESTIONS[stepKey(pathname)];
}

const ELIGIBILITY_PATTERN =
  /eligib|qualif|approv|denie|reject|accept|will i (get|be)|do i (get|qualify)/i;

export function answerFor(question: string): string {
  if (ELIGIBILITY_PATTERN.test(question)) return ELIGIBILITY_ANSWER;
  return ANSWERS[question] ?? GENERIC_ANSWER;
}

import type { ProofSetuApi } from "./types";
import { mockClient } from "./mockClient";
import { liveClient } from "./liveClient";

/**
 * API mode. Mock is the DEFAULT (hackathon demo). Live mode requires an explicit
 * NEXT_PUBLIC_API_MODE=live. The legacy NEXT_PUBLIC_USE_MOCKS=false also selects
 * live mode, for backward compatibility.
 */
function resolveMode(): "mock" | "live" {
  if (process.env.NEXT_PUBLIC_API_MODE === "live") return "live";
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "false") return "live";
  return "mock";
}

export const API_MODE = resolveMode();
export const IS_MOCK = API_MODE === "mock";

/**
 * The single API entry point for the whole app. Components import `apiClient`
 * and never call `fetch` themselves.
 */
export const apiClient: ProofSetuApi = IS_MOCK ? mockClient : liveClient;

export { ApiError } from "./types";
export type { ProofSetuApi } from "./types";

import type { ProofSetuApi } from "./types";
import { mockClient } from "./mockClient";
import { liveClient } from "./liveClient";

/** Mock mode is the default; live mode requires an explicit opt-out. */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

/**
 * The single API entry point for the whole app. Components import `apiClient`
 * and never call `fetch` themselves. Flip NEXT_PUBLIC_USE_MOCKS to switch modes.
 */
export const apiClient: ProofSetuApi = USE_MOCKS ? mockClient : liveClient;

export { ApiError } from "./types";
export type { ProofSetuApi } from "./types";

import Exa from "exa-js";

export function hasExaKey(): boolean {
  return Boolean(process.env.EXA_API_KEY);
}

export function isForcedDemoMode(): boolean {
  return process.env.BIDSIGNAL_DEMO_MODE === "1";
}

let cached: Exa | null = null;

export function getExa(): Exa {
  const key = process.env.EXA_API_KEY;
  if (!key) {
    throw new Error(
      "EXA_API_KEY is not set. Add it to .env.local — get a key at https://dashboard.exa.ai/api-keys",
    );
  }
  if (!cached) cached = new Exa(key);
  return cached;
}

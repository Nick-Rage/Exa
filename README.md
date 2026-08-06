# CaptureBrief

Federal identity/cyber pursuit intelligence built on Exa.

A capture manager starts with a known SAM.gov notice. CaptureBrief retrieves the
live notice, researches agency strategy, budget context, and acquisition history,
then produces a cited capture brief for a human bid/no-bid gate. Pursued
opportunities can be watched for amendments and related signals.

## Product flow

1. Paste a SAM.gov or official federal notice URL.
2. Exa Contents live-fetches the notice and extracts a deterministic snapshot.
3. The user confirms the correct opportunity before deeper research begins.
4. Controlled Exa Search workstreams collect official strategy, budget, and award
   evidence.
5. Exa Agent synthesizes one bounded capture brief while streaming real research
   activity.
6. Application code derives readiness from hard gates. The human chooses Pursue,
   Hold, or Pass.
7. Exa Answer handles quick grounded questions; an Agent continuation handles
   deeper research.
8. Exa Monitors detect amendments, deadline changes, attachments, and award
   signals through a signed webhook.

## Trust model

- Facts are labeled `verified`, `inference`, or `unknown`.
- `.gov`, `.mil`, SAM.gov, USAspending, CISA, NIST, GSA, and other official
  sources are visually distinguished.
- The model does not make the final bid decision.
- A failed hard gate can never produce a `ready` disposition.
- Incumbency, contract value, and funding are never presented as confirmed
  without public award or budget evidence.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set:

```bash
EXA_API_KEY=...
BIDSIGNAL_DEMO_MODE=0
APP_URL=https://your-public-demo.example
```

`APP_URL` is only required for live Monitor webhooks. Without a key, or with
`BIDSIGNAL_DEMO_MODE=1`, the app replays the captured federal golden path.

## Verification and capture

```bash
npm run typecheck
npm test
npm run build
npm run capture
npm run capture -- --save
```

The saved live capture is written to `.data/federal-golden-path.json` and is
excluded from version control. It includes the Contents snapshot, Search
evidence, Agent event trace, structured brief, grounding, and run statistics.

## Main implementation

- `src/lib/intake.ts` — Contents live notice intake.
- `src/lib/search.ts` — controlled Search workstreams and Agent stream.
- `src/lib/schema.ts` — bounded capture-brief schema and prompt.
- `src/lib/normalize.ts` — source authority, grounding, and gate-derived
  readiness.
- `src/app/api/capture/answer/route.ts` — grounded quick questions.
- `src/app/api/capture/monitor/route.ts` — structured Monitor creation.
- `src/app/api/capture/monitor/webhook/route.ts` — HMAC verification and
  deduplicated update ingestion.
- `src/lib/pursuitStore.ts` — small local persistent pursuit store.

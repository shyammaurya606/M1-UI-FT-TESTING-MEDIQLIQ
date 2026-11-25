# MediQliq — ABDM M1 UI Functional Testing

A local, human-in-the-loop Playwright workspace for the **complete 100-case M1 Identity UI test catalogue**.

> This is a test harness and evidence workspace. It is not an NHA certification, an ABDM approval, or a declaration that MediQliq has passed M1.

## What is included

- The complete 100-case catalogue, preserving source IDs, markings, descriptions, pass criteria and API references.
- Code-review UI mapping notes for the MediQliq M1 components inspected for this workspace.
- A visible Chromium runner. A human tester operates the app and enters each verdict.
- Fresh per-run result files and `manifest.json`, optional screenshots, selected gateway `REQUEST-ID` capture, and report generation.
- A strict private-entity gate for applicable mandatory cases. Screenshot capture alone can never set a case to PASS.

## Requirements

- Node.js 20 or newer
- npm
- A reachable MediQliq sandbox/staging UI and matching backend
- ABDM sandbox configuration and approved NHA sandbox test identities
- Chromium installed by Playwright

## Quick start — Windows PowerShell

```powershell
git clone https://github.com/shyammaurya606/M1-UI-FT-TESTING-MEDIQLIQ.git
cd M1-UI-FT-TESTING-MEDIQLIQ
npm install
npx playwright install chromium
Copy-Item .env.example .env
notepad .env
npm run preflight
npm run test:ui
```

Set `BASE_URL` to the MediQliq UI you intend to test. Set `ABDM_ENV=sandbox`. Do not place Aadhaar numbers, OTPs, mobile numbers, patient data, passwords, client secrets or tokens in `.env`.

For local MediQliq frontend use, set `BASE_URL=http://localhost:5173`. Ensure its backend points to ABDM sandbox, not production.

## Quick start — macOS/Linux

```bash
git clone https://github.com/shyammaurya606/M1-UI-FT-TESTING-MEDIQLIQ.git
cd M1-UI-FT-TESTING-MEDIQLIQ
npm install
npx playwright install chromium
cp .env.example .env
# Edit .env and set BASE_URL / TESTER_NAME. Keep ABDM_ENV=sandbox.
npm run preflight
npm run test:ui
```

## Running selected tests

```bash
npm run test:ui
node scripts/run-m1-ui.mjs --case-id CRT_ABHA_101
node scripts/run-m1-ui.mjs --section "1. ABHA creation through Aadhaar OTP"
```

The runner is always headed. It does not automate Aadhaar/OTP entry, call UIDAI directly, mock ABDM, or fabricate gateway responses. The operator uses the visible browser and records the observed result against the exact pass criteria.

## Reporting

```bash
npm run report
node scripts/report.mjs --run-id YOUR_RUN_ID
```

The report prints a fresh run summary and evaluates the private-entity mandatory gate. A case can pass only when the tester has entered the observed expected outcome and a non-empty evidence reference. N/A on mandatory cases requires a written reason and approver. The report always includes a disclaimer that a local gate result is not official certification.

## Evidence and privacy

- Run output is written under `runs/<run-id>/`.
- `runs/` is ignored by Git. Do not commit raw screenshots, patient records, API payloads, OTPs, Aadhaar/mobile numbers, or tokens.
- Screenshot capture requires a separate explicit confirmation that the current screen contains no unmasked personal or authentication data.
- Page text is not captured by default.
- The runner records only selected request-ID response headers, HTTP status, host and a sanitized route. It does not store request or response bodies, cookies, authorization headers, or query strings.
- Use only approved ABDM sandbox demo identities. Use synthetic or sandbox test patient records. Do not use real patient data.
- Confirm that the target and backend are in sandbox before every write-capable flow.

## Source and interpretation

The uploaded catalogue says it contains 100 M1 Identity cases across 17 sections. The source wording and case markings are preserved in `sources/m1-catalogue-source.txt` and `catalogue/m1-cases.json`.

The `privateEntityApplicability` field is an initial interpretation of the exact source marking, not an NHA ruling. Review all conditional and `review` cases before formal testing. A conditional exception must not be assumed. The UI mapping is a code-review hypothesis from selected MediQliq files, not proof that a UI flow works.

The ABDM MCP was unavailable (HTTP 404) during initial preparation. This workspace is derived from the user-uploaded catalogue, not represented as a live MCP export.

## Commands

| Command | Purpose |
|---|---|
| `npm run preflight` | Verify Node, env, Playwright and sandbox guard |
| `npm run test:ui` | Start visible human-in-the-loop runner |
| `npm run report` | Summarize latest run / evaluate private mandatory gate |

See `docs/TEST_EXECUTION_GUIDE.md` and `docs/CASE_MAPPING_NOTES.md`.

# Test execution guide

## 1. Prepare a safe environment

1. Deploy or run the MediQliq frontend and backend with ABDM sandbox settings.
2. Open `.env` and set `BASE_URL` to the target UI.
3. Keep `ABDM_ENV=sandbox`.
4. Sign in through the application using a test operator account.
5. Obtain the currently approved NHA sandbox demo identities and their fixed OTP procedure from the official sandbox documentation. Do not use real Aadhaar/mobile data.
6. Make sure the test patient records are sandbox records. Do not use real patient charts.
7. Confirm that any create, verify, link, profile-update or share action will write only to sandbox systems.

The runner will refuse to start unless `ABDM_ENV=sandbox`. This environment check is a local safety guard, not proof that the backend is really connected to sandbox. The operator must verify backend configuration and the actual gateway host independently.

## 2. Start the visible runner

```bash
npm run test:ui
```

A Chromium window opens. Log in manually. For each case, the terminal displays the official M1 case ID and section, source marking and private-applicability interpretation, source test description, source pass criteria, and MediQliq screen mapping note.

Follow the source steps on the visible UI. Use the exact test method and approved test identity. Do not substitute a mock service or a manually fabricated response.

## 3. Record the result

- `PASS`: every applicable pass criterion was observed. Enter the observation and a non-empty evidence reference. Screenshot alone is never sufficient.
- `FAIL`: expected behavior did not occur. Record actual behavior and evidence.
- `BLOCKED`: test could not be completed. Record the exact blocker.
- `NOT APPLICABLE`: enter rationale. For a mandatory case, also enter the approving test lead.
- `NOT RUN`: leave pending or skip.

The runner saves progress after every case.

## 4. Evidence capture

The runner can store a screenshot only after the tester explicitly confirms the visible screen has no unmasked personal or authentication data. Optional sanitized page text requires a second confirmation and is not captured by default. Selected response metadata includes timestamp, status, host, sanitized route and UUID from request-id/correlation-id response headers.

The runner does not store request or response bodies, cookies, authorization headers, query strings, or form values. It does not guarantee that every sensitive value can be detected. If in doubt, do not capture screenshot or page text. Do not commit `runs/`.

## 5. Review and report

```bash
npm run report
node scripts/report.mjs --run-id YOUR_RUN_ID
```

The report shows all 100 cases, statuses and private mandatory gate. Missing cases remain NOT RUN. Conditional applicability must be approved explicitly; do not mark a requirement N/A simply because the UI is absent.

## 6. Limits

This is a manual UI harness and result ledger. It does not execute all 100 test steps autonomously, operate the PHR app, verify patient database contents, or prove the sandbox environment. Those checks require the human tester, application logs, backend records and approved external app/device. The workbook and report are evidence organizers, not NHA-issued certificates.

The uploaded catalogue's Share Profile cases describe a PHR app scanning a facility QR and sharing profile information with a HIP. An external PHR app and actual callback path may be required; a facility QR being visible is not sufficient.

## 7. Troubleshooting

- Invalid BASE_URL: set a full `http://` or `https://` URL in `.env`.
- Browser does not launch: run `npx playwright install chromium`.
- UI cannot load: verify frontend host, VPN/network and browser console manually.
- No REQUEST-ID: the gateway may not return one or CORS may hide it. Do not invent one; record that it is not exposed and retain server audit logs separately.
- Sandbox guard blocks: set `ABDM_ENV=sandbox` only after verifying the deployed backend is configured for sandbox. Never bypass the guard for production.

## 8. Resolve the conditional private-entity marking

One catalogue row is marked mandatory for Private/Government but optional for an integrated program using demo authentication because a default ABHA address is generated. The local gate blocks closure until the test lead records the applicable decision in `catalogue/m1-cases.json`. Keep the original `officialMarking` unchanged and record the test lead's rationale. Do not guess.

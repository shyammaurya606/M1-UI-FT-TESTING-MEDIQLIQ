# MediQliq UI mapping notes

These are source-code inspection notes, not test results. They were drafted from the following selected MediQliq source files:

- `mediqliq_hospital/src/pages/dashboard/abdm/m1-identity.jsx`
- `mediqliq_hospital/src/components/abha/ABHARegistrationPanel.jsx`
- `mediqliq_hospital/src/components/abha/ABHAAdvancedFlowsPanel.jsx`
- `mediqliq_hospital/src/components/abha/ResendOtpControl.jsx`
- `mediqliq_hospital/src/api/abhaApi.js`
- `mediqliq_hospital/src/pages/dashboard/abdm/scan-share.jsx`

## Confirmed UI code surfaces

- M1 Identity page provides an enrollment tab, an advanced-auth tab, and a patient picker.
- `ABHARegistrationPanel` contains Aadhaar OTP state, mobile-search state, ABHA address suggestions and profile/card-related UI logic.
- `ABHAAdvancedFlowsPanel` exposes alternative login modes, ABHA address login, driving-licence enrolment, and biometric enrollment/login operations.
- `ResendOtpControl` has a 60-second cooldown and two-resend local counter. The actual gateway behavior and reset/retry semantics still require live testing.
- Scan & Share page displays a facility HIP ID and `FacilityABDMQR`. Its page header labels the flow as Milestone 2, even though the uploaded M1 catalogue contains Share Profile cases. The source cases must still be tested as catalogued and mapped to the real cross-app workflow.

## Potential coverage gaps to verify

1. Demo authentication / offline-mode enrollment — no dedicated UI was confirmed in the inspected component files.
2. Find ABHA for benefit — no matching workflow was confirmed in the inspected components.
3. Profile update — profile display is present, but no complete update flow was confirmed in the inspected M1 components.
4. QR reading — QR generation/display is visible, but inbound QR scanning and field population were not confirmed.
5. Unique-patient mapping — UI duplicate-comparison code is present; prove the unique constraint and duplicate prevention in persisted backend data.
6. PHR Scan & Share — facility QR display alone does not prove that PHR consent, `on-share` callback, token creation, matching, returning-patient behavior and queue handling work end to end.

## Critical warning about the old runner

The earlier `abdm-ft/interactive_ui_capture.js` in the MediQliq application used a manually composed step array whose case descriptions were not consistently aligned with the official case IDs. For example, the old array associated `CRT_ABHA_106` with address suggestions and `CRT_ABHA_107` with address confirmation, whereas the uploaded M1 catalogue defines those IDs as OTP resend and OTP-based Aadhaar authentication. Do not reuse the old runner's step mapping or its historical outputs.

## Mapping rule

The mapping column in `catalogue/m1-cases.json` is a starting point. During test preparation, open the live build, locate the exact control/route, confirm it implements the official case steps, and update the mapping note if needed. A missing feature is a potential failure or blocker, not an automatic `NOT APPLICABLE`.

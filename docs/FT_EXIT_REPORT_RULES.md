# FT exit report rules

The local report is intentionally conservative:

1. The complete catalogue remains 100 cases.
2. The private mandatory gate is derived from the source case markings preserved in `catalogue/m1-cases.json`.
3. `Mandatory`, `Mandatory for Private`, and the `Mandatory for Private /Government` conditional row are initially treated as mandatory for the private entity. The conditional demo-auth exception must be explicitly reviewed; do not assume it.
4. Rows whose source marking says Government alternative / Private optional are initially optional for the private entity. They remain in the full inventory and appear in the ledger.
5. Any row marked `review` blocks the gate until an applicability decision is made in the catalogue and documented.
6. A mandatory case is not considered passed from navigation or a screenshot alone. The tester must record an observed outcome and evidence reference.
7. Mandatory N/A requires both written rationale and named test-lead approval. A reviewer must validate this before formal use.
8. This report is not an NHA-produced certification report and should not be labelled as one.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--run-id') out.runId = argv[++i];
  return out;
}
function latestRunId() {
  const root = 'runs';
  if (!fs.existsSync(root)) return null;
  return fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory())
    .map(d => d.name).sort().reverse()
    .find(id => fs.existsSync(path.join(root, id, 'results.json'))) || null;
}
function esc(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }

const args = parseArgs(process.argv.slice(2));
const runId = args.runId || latestRunId();
if (!runId) { console.error('No run found. Start with: npm run test:ui'); process.exit(1); }
const catalogue = JSON.parse(fs.readFileSync('catalogue/m1-cases.json', 'utf8'));
const file = path.join('runs', runId, 'results.json');
if (!fs.existsSync(file)) { console.error(`Run results not found: ${file}`); process.exit(1); }
const run = JSON.parse(fs.readFileSync(file, 'utf8'));
const outcomes = run.outcomes || {};
const statusCounts = { PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT APPLICABLE': 0, 'NOT RUN': 0 };
const mandatory = catalogue.cases.filter(c => c.privateEntityApplicability === 'mandatory');
const unresolvedApplicability = catalogue.cases.filter(c => c.privateEntityApplicability === 'review' || (c.privateApplicabilityReviewRequired && !c.privateApplicabilityDecision));
const mandatoryNotPass = [];
const tableRows = [];

for (const c of catalogue.cases) {
  const result = outcomes[c.caseId] || { status: 'NOT RUN' };
  let status = statusCounts[result.status] === undefined ? 'NOT RUN' : result.status;
  if (['PASS', 'FAIL'].includes(status) && (!result.observedOutcome?.trim() || !result.evidenceReference?.trim())) status = 'NOT RUN';
  if (status === 'BLOCKED' && !result.reason?.trim()) status = 'NOT RUN';
  if (status === 'NOT APPLICABLE' && (!result.reason?.trim() || (c.privateEntityApplicability === 'mandatory' && !result.approvedBy?.trim()))) status = 'NOT RUN';
  statusCounts[status]++;
  if (c.privateEntityApplicability === 'mandatory' && status !== 'PASS') {
    const approvedNA = status === 'NOT APPLICABLE' && result.reason?.trim() && result.approvedBy?.trim();
    if (!approvedNA) mandatoryNotPass.push(c.caseId);
  }
  const observed = result.observedOutcome || result.reason || '';
  const refs = [result.evidenceReference, result.screenshot, ...(result.requestIds || []).map(x => (x.requestIds || []).join(', '))].filter(Boolean).join('; ');
  tableRows.push(`| ${esc(c.caseId)} | ${esc(c.section)} | ${esc(c.officialMarking)} | ${esc(c.privateEntityApplicability)} | ${status} | ${esc(observed)} | ${esc(refs)} |`);
}
const gatePass = mandatoryNotPass.length === 0 && unresolvedApplicability.length === 0;
const summary = [
  `# ABDM M1 UI Functional Test Run — ${runId}`, '',
  '> This is a locally generated test-run summary, not an NHA-issued certificate or official certification decision.', '',
  `- Tester: ${run.tester || 'Not recorded'}`,
  `- Started: ${run.startedAt || 'Not recorded'}`,
  `- Finished: ${run.finishedAt || 'Run incomplete'}`,
  `- Target origin: ${run.targetOrigin || 'Not recorded'}`,
  `- Environment: ${run.environment || 'Not recorded'}`,
  `- Build label: ${run.buildLabel || 'Not recorded'}`,
  `- Catalogue SHA-256: ${run.catalogueSha256 || 'Not recorded'}`, '',
  '## Run result counts', '', '| Status | Count |', '|---|---:|',
  ...Object.entries(statusCounts).map(([s,n]) => `| ${s} | ${n} |`),
  `| **Total in catalogue** | **${catalogue.caseCount}** |`, '',
  '## Private-entity mandatory gate', '',
  `- Mandatory cases in initial private-entity interpretation: ${mandatory.length}`,
  `- Mandatory cases not PASS or approved N/A: ${mandatoryNotPass.length}`,
  `- Cases needing applicability review: ${unresolvedApplicability.length}`,
  `- Result: **${gatePass ? 'LOCAL GATE MET' : 'NOT MET'}**`, '',
  gatePass ? 'All initially mandatory private-entity cases are PASS or have explicit approved N/A, and no applicability-review items remain. This does not imply NHA certification.'
    : `Outstanding mandatory cases: ${mandatoryNotPass.join(', ') || 'none'}.\nApplicability review required for: ${unresolvedApplicability.map(c => c.caseId).join(', ') || 'none'}.`,
  '', '## Case-by-case ledger', '',
  '| Case ID | Section | Official source marking | Private applicability | Status | Evidence / reason |',
  '|---|---|---|---|---|---|', ...tableRows, '',
  '## Evidence and limitations', '',
  '- PASS is a human-entered verdict; this tool does not independently validate every UI or persisted database condition.',
  '- Screenshots are optional and require an in-run confirmation that the screen contains no unmasked personal or authentication data.',
  '- The browser network observer stores only selected request-ID response headers, status, host and sanitized route. It does not store payloads or secrets.',
  '- BLOCKED, FAIL, NOT RUN and unapproved mandatory N/A cases remain visible and prevent the mandatory gate from being met.',
  '- Confirm the current official ABDM/NHA catalogue version and applicable entity rules before using this report for formal submission.', ''
].join('\n');
const out = path.join('runs', runId, 'FT_EXIT_REPORT_DRAFT.md');
fs.writeFileSync(out, summary, { mode: 0o600 });
console.log(summary);
console.log(`\nSaved: ${out}`);
if (!gatePass) process.exitCode = 2;

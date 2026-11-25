import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const runId = 'ci-smoke-report';
const dir = path.join('runs', runId);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const catalogue = JSON.parse(fs.readFileSync('catalogue/m1-cases.json','utf8'));
const fixture = {
  runId,
  startedAt: new Date().toISOString(),
  finishedAt: new Date().toISOString(),
  tester: 'CI synthetic smoke test',
  environment: 'synthetic fixture — NOT an ABDM test',
  targetOrigin: 'https://example.invalid',
  buildLabel: 'CI-only',
  catalogueSha256: 'synthetic-fixture',
  selectedCaseIds: [],
  outcomes: {}
};
fs.writeFileSync(path.join(dir,'results.json'), JSON.stringify(fixture,null,2));
try {
  const result = spawnSync(process.execPath, ['scripts/report.mjs','--run-id',runId], { encoding:'utf8' });
  const reportPath = path.join(dir,'FT_EXIT_REPORT_DRAFT.md');
  if (!fs.existsSync(reportPath)) throw new Error('Report generator did not create the Markdown draft.');
  const report = fs.readFileSync(reportPath,'utf8');
  if (!report.includes('ABDM M1 UI Functional Test Run') || !report.includes('NOT MET') || !report.includes('CRT_ABHA_101')) {
    throw new Error('Generated report is missing expected title, fail-closed gate, or case ledger.');
  }
  if (result.status !== 2) throw new Error('Expected fail-closed exit code 2 for a fixture with no test outcomes; got '+result.status+'. STDERR: '+result.stderr);
  console.log('Report smoke test passed: Markdown generated, 100-case ledger included, and empty fixture correctly failed the mandatory gate.');
  console.log('This is synthetic CI validation only; it is not a real FT execution or evidence.');
} finally {
  fs.rmSync(dir, { recursive:true, force:true });
}

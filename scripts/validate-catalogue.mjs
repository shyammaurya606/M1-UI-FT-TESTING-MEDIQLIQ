import fs from 'node:fs';
import process from 'node:process';

const file = 'catalogue/m1-cases.json';
if (!fs.existsSync(file)) throw new Error('Missing '+file);
const c = JSON.parse(fs.readFileSync(file,'utf8'));
const required = ['caseId','section','officialMarking','privateEntityApplicability','testDescription','passCriteria','apiReferences'];
const ids = new Set();
const problems = [];
for (const row of c.cases || []) {
  if (!row.caseId || ids.has(row.caseId)) problems.push('Missing/duplicate case ID: '+(row.caseId||'(blank)'));
  ids.add(row.caseId);
  for (const key of required) if (typeof row[key] !== 'string' || !row[key].trim()) problems.push(row.caseId+': missing '+key);
  if (!['mandatory','optional','review'].includes(row.privateEntityApplicability)) problems.push(row.caseId+': invalid privateEntityApplicability');
}
const sectionCount = new Set(c.cases.map(x=>x.section)).size;
if (c.caseCount !== 100 || c.cases.length !== 100 || ids.size !== 100) problems.push('Expected exactly 100 unique catalogue cases.');
if (c.sectionCount !== 17 || sectionCount !== 17) problems.push('Expected exactly 17 catalogue sections.');
const conditional = c.cases.find(x=>x.caseId==='CRT_ABHA_112');
if (!conditional || !conditional.privateApplicabilityReviewRequired || conditional.privateApplicabilityDecision) problems.push('CRT_ABHA_112 must remain flagged for explicit applicability review.');
const mandatory = c.cases.filter(x=>x.privateEntityApplicability==='mandatory').length;
if (mandatory !== 39) problems.push('Expected 39 initially classified private mandatory cases; found '+mandatory+'.');
if (problems.length) {
  console.error('Catalogue validation FAILED:\n- '+problems.join('\n- '));
  process.exit(1);
}
console.log('Catalogue validation passed: 100 unique cases, 17 sections, 39 initially mandatory private cases, and CRT_ABHA_112 flagged for review.');
console.log('This validates inventory structure only; it does not validate application behavior or FT results.');

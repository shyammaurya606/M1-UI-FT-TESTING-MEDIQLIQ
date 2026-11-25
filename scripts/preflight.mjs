import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const errors = [];
const warnings = [];
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 20) errors.push(`Node.js 20+ required; current version is ${process.versions.node}.`);

const baseUrl = process.env.BASE_URL;
if (!baseUrl) errors.push('BASE_URL is missing. Copy .env.example to .env and set the UI address.');
else {
  try {
    const u = new URL(baseUrl);
    if (!['http:', 'https:'].includes(u.protocol)) errors.push('BASE_URL must use http or https.');
    if (u.username || u.password) errors.push('Do not embed credentials in BASE_URL.');
  } catch { errors.push('BASE_URL is not a valid absolute URL.'); }
}
if (String(process.env.ABDM_ENV || '').toLowerCase() !== 'sandbox') errors.push('ABDM_ENV must be exactly "sandbox". Do not run this harness against production.');
if (!process.env.TESTER_NAME?.trim()) warnings.push('TESTER_NAME is not set; the runner will ask for it interactively.');
if (!fs.existsSync(path.resolve('catalogue/m1-cases.json'))) errors.push('catalogue/m1-cases.json is missing.');
try {
  if (!fs.existsSync(chromium.executablePath())) warnings.push('Playwright Chromium is not installed. Run: npx playwright install chromium');
} catch { warnings.push('Unable to locate Playwright Chromium. Run: npx playwright install chromium'); }

console.log('\nMediQliq ABDM M1 UI FT — preflight\n');
console.log(`Node: ${process.versions.node}\nABDM_ENV: ${process.env.ABDM_ENV || '(unset)'}\nBASE_URL: ${baseUrl || '(unset)'}`);
console.log(`Catalogue: ${fs.existsSync(path.resolve('catalogue/m1-cases.json')) ? 'found' : 'missing'}`);
for (const w of warnings) console.log(`WARNING: ${w}`);
for (const e of errors) console.error(`ERROR: ${e}`);
if (errors.length) { console.error('\nPreflight failed. Fix the errors before running UI tests.'); process.exit(1); }
console.log('\nPreflight checks passed. This does not independently prove that the target backend is using ABDM sandbox.');

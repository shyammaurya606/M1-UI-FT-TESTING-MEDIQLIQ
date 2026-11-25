import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chromium } from 'playwright';

const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
const ID_HEADERS = ['request-id','x-request-id','x-correlation-id','correlation-id','x-requestid'];
const rl = readline.createInterface({input, output});
const stamp = () => new Date().toISOString();
const safeId = () => stamp().replace(/[:.]/g,'-');
const write = (p,v) => fs.writeFileSync(p, JSON.stringify(v,null,2)+'\n',{mode:0o600});
function redact(s) {
  return String(s||'')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,'[AADHAAR REDACTED]')
    .replace(/\b\d{14}\b/g,'[ABHA NUMBER REDACTED]')
    .replace(/\b[6-9]\d{9}\b/g,'[MOBILE REDACTED]')
    .replace(/\b\d{6}\b/g,'[6-DIGIT VALUE REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[TOKEN REDACTED]')
    .replace(/\bBearer\s+\S+/gi,'Bearer [REDACTED]');
}
function safeRoute(raw) {
  try {
    const u=new URL(raw);
    return {host:u.host,route:u.pathname.replace(/[a-f0-9]{24}/gi,':id').replace(/\b\d{10,18}\b/g,':number')};
  } catch { return {host:'unknown',route:'/'}; }
}
function argsOf(a) {
  const o={};
  for(let i=0;i<a.length;i++){
    if(a[i]==='--case-id') o.caseId=a[++i];
    if(a[i]==='--section') o.section=a[++i];
    if(a[i]==='--help'||a[i]==='-h') o.help=true;
  }
  return o;
}
async function ask(q){return (await rl.question(q)).trim();}
async function main(){
  const args=argsOf(process.argv.slice(2));
  if(args.help){console.log('npm run test:ui [-- --case-id CASE_ID | --section SECTION]');return;}
  if(String(process.env.ABDM_ENV||'').toLowerCase()!=='sandbox') throw new Error('Safety stop: ABDM_ENV must be sandbox.');
  const base=process.env.BASE_URL;
  if(!base) throw new Error('BASE_URL is required in .env.');
  const target=new URL(base);
  if(!['http:','https:'].includes(target.protocol)||target.username||target.password) throw new Error('BASE_URL must be a credential-free HTTP(S) URL.');
  const catalogue=JSON.parse(fs.readFileSync('catalogue/m1-cases.json','utf8'));
  let cases=catalogue.cases;
  if(args.caseId) cases=cases.filter(c=>c.caseId===args.caseId);
  if(args.section) cases=cases.filter(c=>c.section===args.section);
  if(!cases.length) throw new Error('No cases matched the supplied filter.');
  if(args.caseId&&cases.length!==1) throw new Error('Case ID is missing or not unique.');
  console.log('\nMediQliq ABDM M1 — visible human-in-the-loop UI runner');
  console.log('Use only approved ABDM sandbox identities and synthetic test patients. Never enter real Aadhaar/mobile/patient data.');
  console.log('Target origin: '+target.origin);
  if(await ask('Verify frontend AND backend sandbox configuration. Type SANDBOX to continue: ')!=='SANDBOX') throw new Error('Sandbox confirmation missing.');
  const tester=(process.env.TESTER_NAME||await ask('Tester/team identifier: ')).trim();
  if(!tester) throw new Error('Tester identifier is required.');
  const build=(process.env.BUILD_LABEL||await ask('Application build/commit label (optional): ')).trim();
  const runId=safeId();
  const dir=path.resolve('runs',runId);
  fs.mkdirSync(path.join(dir,'evidence'),{recursive:true,mode:0o700});
  const sourceBytes=fs.readFileSync('catalogue/m1-cases.json');
  const run={runId,startedAt:stamp(),tester,buildLabel:build||null,environment:'sandbox (operator-confirmed; not independently attested)',targetOrigin:target.origin,catalogueSha256:crypto.createHash('sha256').update(sourceBytes).digest('hex'),selectedCaseIds:cases.map(c=>c.caseId),outcomes:{}};
  write(path.join(dir,'results.json'),run);
  let browser;
  const responseEvents=[];
  try {
    browser=await chromium.launch({headless:false});
    const context=await browser.newContext({viewport:{width:1440,height:950}});
    const page=await context.newPage();
    page.on('response',async response=>{
      try{
        const h=await response.allHeaders(), ids=[];
        for(const n of ID_HEADERS){const m=String(h[n]||'').match(UUID_RE);if(m)ids.push(m[0]);}
        if(ids.length){const s=safeRoute(response.url());responseEvents.push({capturedAt:stamp(),method:response.request().method(),host:s.host,route:s.route,status:response.status(),requestIds:[...new Set(ids)]});}
      }catch{/* best effort; never read bodies or secrets */}
    });
    console.log('Opening target. Sign in manually with an authorized test operator account.');
    try{await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});}catch(e){console.log('Navigation did not finish: '+e.message);}
    await ask('After manual sign-in and patient/environment checks, press ENTER: ');
    for(let i=0;i<cases.length;i++){
      const c=cases[i];
      console.log('\n'+ '='.repeat(78));
      console.log('['+(i+1)+'/'+cases.length+'] '+c.caseId+' — '+c.section);
      console.log('Official marking: '+c.officialMarking);
      console.log('Private applicability (initial interpretation): '+c.privateEntityApplicability);
      if(c.applicabilityException) console.log('Applicability note: '+c.applicabilityException);
      console.log('\nWHAT IS TESTED\n'+c.testDescription);
      console.log('\nPASS WHEN\n'+c.passCriteria);
      console.log('\nSOURCE API REFERENCES\n'+(c.apiReferences||'None'));
      console.log('\nMEDIQLIQ UI MAPPING HYPOTHESIS\n'+(c.mediqliqMapping||'Not mapped'));
      console.log('Mapping confidence: '+(c.mappingConfidence||'Not assessed'));
      if(await ask('Confirm sandbox-only data/operation for this case? Type YES: ')!=='YES'){
        run.outcomes[c.caseId]={status:'NOT RUN',recordedAt:stamp(),note:'Tester did not confirm sandbox-only operation.'};
        write(path.join(dir,'results.json'),run);continue;
      }
      const start=responseEvents.length;
      await ask('Perform the steps manually in Chromium; check the actual UI and required persisted/backend state. Press ENTER when complete: ');
      const ids=responseEvents.slice(start);
      const verdict=(await ask('Verdict [PASS / FAIL / BLOCKED / NOT APPLICABLE / NOT RUN]: ')).toUpperCase();
      let outcome;
      if(!['PASS','FAIL','BLOCKED','NOT APPLICABLE','NOT RUN'].includes(verdict)){
        outcome={status:'NOT RUN',recordedAt:stamp(),note:'Unknown verdict.'};
      }else if(verdict==='NOT RUN'){
        outcome={status:'NOT RUN',recordedAt:stamp(),note:'Tester left case unexecuted.'};
      }else if(verdict==='BLOCKED'||verdict==='NOT APPLICABLE'){
        const reason=await ask(verdict+' reason: ');
        const approvedBy=verdict==='NOT APPLICABLE'&&c.privateEntityApplicability==='mandatory'?await ask('Test lead approver (required for mandatory N/A): '):'';
        if(!reason||(verdict==='NOT APPLICABLE'&&c.privateEntityApplicability==='mandatory'&&!approvedBy)){
          outcome={status:'NOT RUN',recordedAt:stamp(),note:'Required reason/approver missing.'};
        }else{
          outcome={status:verdict,recordedAt:stamp(),reason:redact(reason),approvedBy:approvedBy||null,evidenceReference:await ask('Optional non-identifying evidence reference: ')||null,requestIds:ids,tester};
        }
      }else{
        const observed=await ask('Observed outcome (no personal/authentication data): ');
        const evidence=await ask('Evidence reference (non-identifying file/log/audit reference): ');
        if(!observed||!evidence){
          outcome={status:'NOT RUN',recordedAt:stamp(),note:'PASS/FAIL requires observed result and evidence reference.'};
        }else{
          let screenshot=null;
          if(String(process.env.CAPTURE_SCREENSHOTS||'true').toLowerCase()==='true'&&await ask('Confirm screen has NO unmasked personal/authentication data. Type YES to capture screenshot: ')==='YES'){
            const ed=path.join(dir,'evidence',c.caseId);fs.mkdirSync(ed,{recursive:true,mode:0o700});
            const file=path.join(ed,safeId()+'.png');await page.screenshot({path:file,fullPage:true});screenshot=path.relative(dir,file).split(path.sep).join('/');
          }
          outcome={status:verdict,recordedAt:stamp(),observedOutcome:redact(observed),evidenceReference:evidence,screenshot,requestIds:ids,tester};
        }
      }
      run.outcomes[c.caseId]=outcome;
      run.networkEvidenceCount=Object.values(run.outcomes).reduce((n,x)=>n+(x.requestIds?.length||0),0);
      write(path.join(dir,'results.json'),run);
      console.log('Saved '+c.caseId+': '+outcome.status);
    }
    run.finishedAt=stamp();write(path.join(dir,'results.json'),run);
    write(path.join(dir,'manifest.json'),{runId,generatedAt:stamp(),tester,buildLabel:build||null,targetOrigin:target.origin,environment:run.environment,catalogueSha256:run.catalogueSha256,cases:Object.entries(run.outcomes).map(([caseId,o])=>({caseId,status:o.status,screenshot:o.screenshot||null,evidenceReference:o.evidenceReference||null,requestIds:o.requestIds||[]}))});
    console.log('\nFresh run saved: '+path.relative(process.cwd(),path.join(dir,'results.json')));
    console.log('Generate draft: npm run report -- --run-id '+runId);
  } finally {
    if(browser) await browser.close();
    rl.close();
  }
}
main().catch(e=>{console.error('\nRUN STOPPED: '+e.message);process.exitCode=1;});

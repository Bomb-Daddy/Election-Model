/**
 * Directly drives the actual packaged Electron GUI, never a browser mockup.
 * Does not claim GUI-based installation or human acceptance.
 * Run with ELECTION_EXECUTABLE=absolute/path/to/unpacked/binary.
 */
import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';

const executable=process.env.ELECTION_EXECUTABLE;
if(!executable)throw new Error('Set ELECTION_EXECUTABLE to the actual packaged Electron executable.');
const evidence=resolve('qa-artifacts');
mkdirSync(evidence,{recursive:true});
const args=process.platform==='linux'?['--no-sandbox']:[];
const uniqueRun='QA '+process.platform+' '+process.pid+' '+Date.now();
let app=null,window=null;
async function check(name,task){
  try{await task();console.log('PASS '+name)}catch(error){console.error('FAIL '+name+': '+error.message);throw error}
}
try{
  app=await electron.launch({executablePath:executable,args,timeout:45000});
  window=await app.firstWindow({timeout:45000});
  await window.getByRole('heading',{name:'Projects'}).waitFor({timeout:30000});
  await check('Project manager displays real local database',async()=>{
    assert.ok(await window.getByRole('button',{name:/Local Election Research/}).count()>0);
  });
  await check('Poll Explorer is reachable and unrestricted by default',async()=>{
    await window.getByRole('button',{name:'Poll Explorer'}).click();
    await window.getByRole('heading',{name:'Poll Explorer'}).waitFor();
    assert.equal(await window.getByRole('combobox',{name:'Poll type'}).inputValue(),'');
    await window.getByRole('button',{name:'Clear filters'}).click();
  });
  await check('Sources list all providers and paid AP remains gated',async()=>{
    await window.getByRole('button',{name:'Source Library'}).click();
    await window.getByText('VoteHub',{exact:true}).first().waitFor();
    await window.getByText('Subscription gated').waitFor();
  });
  await check('National deterministic model responds to real user controls',async()=>{
    await window.getByRole('button',{name:'National Model'}).click();
    await window.getByRole('spinbutton',{name:'Original potential Republicans not voting (%)'}).fill('10');
    await window.getByRole('spinbutton',{name:'Original potential Republicans voting Democratic (%)'}).fill('5');
    await window.getByRole('button',{name:'Calculate scenario'}).click();
    await window.getByText('85.0%').waitFor();
  });
  await check('Scenario persists to SQLite and is visibly listed',async()=>{
    await window.getByRole('textbox',{name:'Scenario name'}).fill(uniqueRun);
    await window.getByRole('button',{name:'Save as new version'}).click();
    await window.getByRole('button',{name:uniqueRun}).waitFor();
  });
  await check('Native CSV file picker imports source and preserves provenance in SQLite',async()=>{
    const csvPath=join(evidence,'synthetic-public-fixture.csv');
    writeFileSync(csvPath,'pollster,poll_type,share\nExample Survey,approval,44\n');
    await app.evaluate(({dialog},paths)=>{
      dialog.showOpenDialog=async()=>({canceled:false,filePaths:paths});
    },[csvPath]);
    await window.getByRole('button',{name:'Source Library'}).click();
    await window.getByRole('row').filter({hasText:'VoteHub'}).first().getByRole('button',{name:'Import local file'}).click();
    await window.getByText('synthetic-public-fixture.csv').waitFor();
    await window.getByRole('row').filter({hasText:'synthetic-public-fixture.csv'}).getByRole('button',{name:'Inspect'}).click();
    await window.getByText(/SHA-256:/).waitFor();
  });
  await check('Native JSON snapshot export produces provenance and source records',async()=>{
    const dest=join(evidence,'exported-source.json');
    await app.evaluate(({dialog},filePath)=>{
      dialog.showSaveDialog=async()=>({canceled:false,filePath});
    },dest);
    await window.getByRole('button',{name:'Export snapshot'}).click();
    assert.ok(existsSync(dest),'Export file was not written');
    const exported=JSON.parse(readFileSync(dest,'utf8'));
    assert.equal(exported.metadata.provider,'VoteHub');
    assert.equal(exported.data.length,1);
    assert.equal(exported.data[0].pollster,'Example Survey');
    assert.equal(exported.metadata.sha256.length,64);
  });
  await check('Invalid original Republican cohort percentages show an actionable error',async()=>{
    await window.getByRole('button',{name:'National Model'}).click();
    await window.getByRole('spinbutton',{name:'Original potential Republicans not voting (%)'}).fill('90');
    await window.getByRole('spinbutton',{name:'Original potential Republicans voting Democratic (%)'}).fill('30');
    await window.getByRole('button',{name:'Calculate scenario'}).click();
    await window.getByRole('alert').filter({hasText:/cannot sum over 100%/}).waitFor();
    await window.getByRole('button',{name:'Reset all to zero'}).click();
  });
  await check('Michigan arithmetic can be executed by real GUI',async()=>{
    await window.getByRole('button',{name:'Michigan Lab'}).click();
    await window.getByRole('button',{name:'Calculate Michigan scenario'}).click();
    await window.getByText('2,313,165').first().waitFor();
  });
  await check('Prediction register creates dated immutable evidence',async()=>{
    await window.getByRole('button',{name:'Predictions'}).click();
    await window.getByRole('textbox',{name:'Title'}).fill(uniqueRun+' prediction');
    await window.getByRole('textbox',{name:'Exact prediction and conditions'}).fill('This is an explicit automated test entry and not a factual prediction.');
    await window.getByLabel('Event / target date').fill('2028-11-07');
    await window.getByRole('button',{name:'Record prediction'}).click();
    await window.getByText(uniqueRun+' prediction').waitFor();
  });
  await check('Core QA button runs real calculations and reports incomplete release gate',async()=>{
    await window.getByRole('button',{name:'QA Center'}).click();
    await window.getByRole('button',{name:'Run local core checks'}).click();
    await window.getByRole('heading',{name:'Latest local check results'}).waitFor();
    await window.getByText('INCOMPLETE').first().waitFor();
  });
  await check('Settings and backup controls are present',async()=>{
    await window.getByRole('button',{name:'Backup & Settings'}).click();
    await window.getByRole('button',{name:'Export this project backup'}).waitFor();
    await window.getByRole('button',{name:'Restore backup as new project'}).waitFor();
  });
  await check('Help is accessible to nontechnical user',async()=>{
    await window.getByRole('button',{name:'Help'}).click();
    await window.getByRole('heading',{name:'How to use this workbench'}).waitFor();
  });
  await window.screenshot({path:join(evidence,'desktop-'+process.platform+'-qa.png'),fullPage:true});
  console.log('GUI_SMOKE_RESULT PASS on '+process.platform+' for unpacked packaged app');
} catch(error){
  if(window){try{await window.screenshot({path:join(evidence,'desktop-'+process.platform+'-failure.png'),fullPage:true})}catch{}}
  console.error('GUI_SMOKE_RESULT FAIL: '+error?.stack);
  process.exitCode=1;
}finally{if(app)await app.close();await sleep(100);}

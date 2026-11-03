import {app,BrowserWindow,dialog,ipcMain,Menu,shell} from 'electron';
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {dirname,join,extname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {parse as parseCsv} from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import {ProjectStore} from '../packages/storage/project-store.mjs';
import {calculateScenario,calculateMichigan,normalizedTwoParty,SCENARIO_DEFAULT,MICHIGAN_REFERENCE,recordsToCsv} from '../packages/core/scenario.mjs';
import {VoteHubClient} from '../packages/connectors/src/votehub.ts';

const here=dirname(fileURLToPath(import.meta.url));
const providerList=Object.freeze([
 {id:'VoteHub',name:'VoteHub',kind:'Individual polls',access:'FREE_API',license:'CC BY 4.0',url:'https://votehub.com/polls/api/',detail:'Free public API. Fetch every available poll type; do not confuse individual surveys with aggregate averages.'},
 {id:'Silver Bulletin',name:'Silver Bulletin',kind:'Published polling averages',access:'LOCAL_IMPORT',url:'https://www.natesilver.net/',detail:'Authorized local imports only. Do not assume unrestricted programmatic access.'},
 {id:'RealClearPolling',name:'RealClearPolling (RCP)',kind:'Published polling averages',access:'LOCAL_IMPORT',url:'https://www.realclearpolling.com/',detail:'Free automatic feed not verified. Use a permitted local export.'},
 {id:'FiftyPlusOne',name:'FiftyPlusOne',kind:'Published polling averages',access:'LOCAL_IMPORT',url:'https://fiftyplusone.news/',detail:'Paid API subscriptions prohibited. Permitted free local imports only.'},
 {id:'Decision Desk HQ',name:'Decision Desk HQ',kind:'Published polling averages',access:'LOCAL_IMPORT',url:'https://decisiondeskhq.com/',detail:'Free automatic endpoint rights not independently verified for all races.'},
 {id:'Race to the WH',name:'Race to the WH',kind:'Averages and modeling',access:'LOCAL_IMPORT',url:'https://www.racetothewh.com/',detail:'Keep its published model outputs separate from raw poll results.'},
 {id:'Voter (provisional AP)',name:'Voter — AP The Voter Poll (provisional)',kind:'Voter crosstab survey',access:'ENTITLEMENT_REQUIRED',url:'https://developer.ap.org/ap-elections-api/docs/Voter_Poll.htm',detail:'No paid API or key will be used. Identity unconfirmed; authorized local file import only.'}
]);
let win=null;
let store=null;
let lastPolls=null;
let lastPollResponse=null;
const votehub=new VoteHubClient({cacheMs:60*60*1000,timeoutMs:20000});

function getStore(){if(!store)throw new Error('Local database is not ready.');return store}
function safeText(value,max=160){const text=String(value??'').trim();if(text.length>max)throw new Error('Input text exceeds length limit.');return text}
function authenticated(event){
 if(!win||event.sender.id!==win.webContents.id)throw new Error('Unknown application window.');
 const url=event.sender.getURL();
 if(!(url.startsWith('file://')|| (process.env.WORKBENCH_DEV_URL&&url.startsWith('http://127.0.0.1:5173'))))throw new Error('Unexpected application origin.');
}
function safeLink(url){const parsed=new URL(String(url));if(parsed.protocol!=='https:'||parsed.username||parsed.password||!parsed.hostname||parsed.hostname==='localhost')throw new Error('Only safe public HTTPS links may be opened.');return parsed.href}
async function importFile(projectId,provider,label){
 getStore().checkProject(projectId);
 const picked=await dialog.showOpenDialog(win,{title:'Import an authorized local polling/data file',properties:['openFile'],filters:[{name:'Supported data',extensions:['csv','json','xlsx']}]});
 if(picked.canceled||!picked.filePaths[0])return {canceled:true};
 const file=picked.filePaths[0];
 const size=statSync(file).size;
 if(size>30*1024*1024)throw new Error('File exceeds 30 MB limit.');
 const extension=extname(file).toLowerCase();
 let data;
 if(extension==='.json'){
  const parsed=JSON.parse(readFileSync(file,'utf8'));
  data=parsed&&parsed.data!==undefined?parsed.data:parsed;
  if(data===null||typeof data!=='object')throw new Error('JSON source must be an array or object.');
 }else if(extension==='.csv'){
  data=parseCsv(readFileSync(file,'utf8'),{columns:true,bom:true,skip_empty_lines:true,relax_column_count:true,max_record_size:100000});
  if(data.length>50000)throw new Error('CSV exceeds 50,000 rows.');
 }else if(extension==='.xlsx'){
  const workbook=new ExcelJS.Workbook();
  await workbook.xlsx.load(readFileSync(file));
  if(workbook.worksheets.length===0)throw new Error('Workbook has no worksheets.');
  const sheet=workbook.worksheets[0];
  if(sheet.rowCount>50001||sheet.columnCount>100)throw new Error('Workbook exceeds allowed row/column limits.');
  const headers=[];
  sheet.getRow(1).eachCell({includeEmpty:true},(cell,n)=>{headers[n-1]=String(cell.text||'column_'+n)});
  data=[];
  sheet.eachRow((row,index)=>{
   if(index===1)return;
   const record={};
   for(let c=1;c<=headers.length;c++)record[headers[c-1]]=row.getCell(c).text;
   data.push(record);
  });
 }else throw new Error('Supported formats are CSV, JSON and XLSX.');
 return getStore().saveSnapshot({projectId,provider:safeText(provider||'Local Import'),label:safeText(label||basename(file)),raw:data,category:'AUTHORIZED_LOCAL_IMPORT',sourceUrl:null,license:'User-provided; verify usage rights'});
}
async function exportSnapshot(id,format){
 const snap=getStore().getSnapshot(id);
 const isCsv=format==='csv';
 if(!isCsv&&format!=='json')throw new Error('Choose CSV or JSON.');
 const chosen=await dialog.showSaveDialog(win,{title:'Export source snapshot',defaultPath:'election_source_'+snap.id.slice(0,8)+(isCsv?'.csv':'.json'),filters:[isCsv?{name:'CSV',extensions:['csv']}:{name:'JSON',extensions:['json']}]});
 if(chosen.canceled||!chosen.filePath)return {canceled:true};
 const {raw,...metadata}=snap;
 let text;
 if(isCsv){
  let rows=Array.isArray(raw)?raw:Array.isArray(raw?.polls)?raw.polls:[raw];
  text=recordsToCsv(rows);
 }else text=JSON.stringify({metadata,data:raw},null,2);
 writeFileSync(chosen.filePath,text,'utf8');
 return {saved:true,path:chosen.filePath,rows:snap.row_count};
}
async function exportBackup(projectId){
 const selected=await dialog.showSaveDialog(win,{title:'Export complete local project backup',defaultPath:'election-workbench-backup.json',filters:[{name:'JSON backup',extensions:['json']}]});
 if(selected.canceled||!selected.filePath)return {canceled:true};
 const backup=getStore().exportProject(projectId);
 writeFileSync(selected.filePath,JSON.stringify(backup,null,2),'utf8');
 return {saved:true,path:selected.filePath};
}
async function importBackup(){
 const chosen=await dialog.showOpenDialog(win,{title:'Restore local project backup into a NEW project',properties:['openFile'],filters:[{name:'Election Workbench JSON backup',extensions:['json']}]});
 if(chosen.canceled||!chosen.filePaths[0])return {canceled:true};
 const file=chosen.filePaths[0];
 if(statSync(file).size>60*1024*1024)throw new Error('Backup exceeds 60 MB maximum.');
 const input=JSON.parse(readFileSync(file,'utf8'));
 return getStore().importProjectBackup(input);
}
function runSelfChecks(){
 const checks=[];
 function check(name,fn){
  try{fn();checks.push({name,status:'PASS'});}
  catch(e){checks.push({name,status:'FAIL',message:e instanceof Error?e.message:String(e)});}
 }
 function assert(cond,message){if(!cond)throw new Error(message);}
 check('Neutral two-party margin',()=>assert(calculateScenario(SCENARIO_DEFAULT).effectiveMargin===0,'Expected 0'));
 check('R original-cohort 10% abstain + 5% cross leaves 85%',()=>{const x=calculateScenario({...SCENARIO_DEFAULT,rAbstain:10,rCross:5});assert(x.originalRepublicanExample.republican===85,'Expected 85%');assert(Math.abs(x.rConservation)<1e-8,'Cohort mismatch')});
 check('Input rejects more than 100% R outcomes',()=>{let failed=false;try{calculateScenario({...SCENARIO_DEFAULT,rAbstain:90,rCross:30})}catch{failed=true}assert(failed,'Invalid data accepted')});
 check('Silver normalized two-party Senate',()=>assert(Math.abs(normalizedTwoParty(49.9,45.2).twoPartyMargin-4.942166)<0.0001,'Normalization error'));
 check('Silver normalized two-party Governor',()=>assert(Math.abs(normalizedTwoParty(51.8,42.4).twoPartyMargin-9.97876858)<0.0001,'Normalization error'));
 check('Michigan Nov 2 observed source total',()=>assert(calculateMichigan(MICHIGAN_REFERENCE).already===2313165,'Early count error'));
 check('Michigan final-Election-Day partition',()=>assert(calculateMichigan(MICHIGAN_REFERENCE).electionDay===2236294,'Election Day arithmetic error'));
 check('Already-voted ballots preserved under incremental stress',()=>assert(calculateMichigan({...MICHIGAN_REFERENCE,mode:'incremental'}).already===2313165,'Observed ballots changed'));
 check('Impossible senior totals rejected',()=>{let rejected=false;try{calculateMichigan({...MICHIGAN_REFERENCE,overall65:5})}catch{rejected=true}assert(rejected,'Invalid senior estimate accepted')});
 check('Local project persistence database responsive',()=>assert(getStore().listProjects().length>0,'No projects'));
 check('Offline provider licensing prevents paid Voter API',()=>assert(providerList.find(x=>x.id==='Voter (provisional AP)').access==='ENTITLEMENT_REQUIRED','Provider incorrectly accessible'));
 const report={ranAt:new Date().toISOString(),buildVersion:app.getVersion(),checks,passed:checks.filter(x=>x.status==='PASS').length,failed:checks.filter(x=>x.status==='FAIL').length,
 notTested:['Real VoteHub network availability','Installed Windows NSIS GUI launch','Installed Linux GUI .deb launch','All GUI controls human acceptance','Marist joint IPF empirical validation'],
 overall:'INCOMPLETE',note:'Self-check is local deterministic arithmetic and storage only; full application/release QA remains incomplete until installed-platform and user testing.'};
 getStore().saveQARun(report);
 return report;
}
async function handle(command,args={}){
 if(args===null||Array.isArray(args)||typeof args!=='object')throw new Error('Unexpected input format.');
 if(JSON.stringify(args).length>500000)throw new Error('Request exceeds allowed size.');
 switch(command){
 case 'system:status':return {version:app.getVersion(),localDataFolder:app.getPath('userData'),offlineCapable:true,cost:'$0 additional spend',platform:process.platform};
 case 'projects:list':return getStore().listProjects();
 case 'projects:create':return getStore().createProject(args.name);
 case 'providers:list':return providerList;
 case 'polls:refresh':{
  const result=await votehub.getPolls(args.filters||{},Boolean(args.force));
  lastPolls=result.data;
  lastPollResponse={retrievedAt:result.retrievedAt,cached:result.cached,stale:result.stale,source:result.source,license:result.license};
  return {polls:result.data,meta:lastPollResponse};
 }
 case 'polls:types':return (await votehub.getPollTypes()).data;
 case 'polls:pollsters':return (await votehub.getPollsters()).data;
 case 'polls:subjects':return (await votehub.getSubjects()).data;
 case 'polls:detail':return (await votehub.getPollById(safeText(args.id,100))).data;
 case 'polls:save':{
  if(!lastPolls||!lastPollResponse)throw new Error('Refresh VoteHub polls first; no fetched data to save.');
  return getStore().saveSnapshot({projectId:args.projectId,provider:'VoteHub',label:'VoteHub '+lastPollResponse.retrievedAt,raw:{polls:lastPolls.map(p=>p.raw)},category:'INDIVIDUAL_POLLS',sourceUrl:'https://votehub.com/polls/api/',license:'CC BY 4.0'});
 }
 case 'snapshots:list':return getStore().listSnapshots(args.projectId);
 case 'snapshots:detail':return getStore().getSnapshot(args.id);
 case 'snapshots:import':return importFile(args.projectId,args.provider,args.label);
 case 'snapshots:export':return exportSnapshot(args.id,args.format);
 case 'scenarios:list':return getStore().listScenarios(args.projectId);
 case 'scenarios:calculate':return calculateScenario(args.parameters||{});
 case 'scenarios:save':return getStore().saveScenario({projectId:args.projectId,name:args.name,parameters:args.parameters,result:calculateScenario(args.parameters),notes:args.notes,snapshotId:args.snapshotId});
 case 'michigan:calculate':return calculateMichigan(args.parameters||{});
 case 'predictions:list':return getStore().listPredictions(args.projectId);
 case 'predictions:create':return getStore().createPrediction({...args,projectId:args.projectId});
 case 'qa:run':return runSelfChecks();
 case 'qa:list':return getStore().listQARuns();
 case 'backup:export':return exportBackup(args.projectId);
 case 'backup:import':return importBackup();
 case 'system:openDataFolder':return {error:await shell.openPath(app.getPath('userData'))};
 case 'system:openLink':await shell.openExternal(safeLink(args.url));return {opened:true};
 default:throw new Error('Unsupported application command.');
 }
}
function createWindow(){
 win=new BrowserWindow({title:'Election Analysis Workbench',width:1366,height:850,minWidth:900,minHeight:600,show:false,webPreferences:{preload:join(here,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',event=>event.preventDefault());
 win.once('ready-to-show',()=>win.show());
 if(process.env.WORKBENCH_DEV_URL)win.loadURL(process.env.WORKBENCH_DEV_URL);
 else win.loadFile(join(here,'../dist/index.html'));
 const send=(page)=>{if(win&&!win.isDestroyed())win.webContents.send('workbench:navigate',page)};
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:'File',submenu:[{label:'Projects',click:()=>send('projects')},{label:'Import sources',click:()=>send('sources')},{label:'Export / Back up',click:()=>send('settings')},{type:'separator'},{role:'quit'}]},
  {label:'View',submenu:[{label:'Poll Explorer',click:()=>send('polls')},{label:'Michigan',click:()=>send('michigan')},{label:'National Model',click:()=>send('national')},{label:'Prediction Register',click:()=>send('predictions')},{type:'separator'},{role:'reload'}]},
  {label:'Help',submenu:[{label:'Instructions and source limitations',click:()=>send('help')},{label:'Run core QA',click:()=>send('qa')}]}]));
}
app.whenReady().then(()=>{
 try{
  store=new ProjectStore(join(app.getPath('userData'),'election-workbench.sqlite'));
  ipcMain.handle('workbench:invoke',async(event,command,args)=>{authenticated(event);return handle(command,args);});
  createWindow();
 }catch(error){dialog.showErrorBox('Application startup failed',String(error));app.quit();}
});
app.on('window-all-closed',()=>{if(store){try{store.close()}catch{}}app.quit()});

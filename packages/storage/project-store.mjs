import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

class ProjectStore{
  constructor(file){
    mkdirSync(dirname(file),{recursive:true});
    this.db=new DatabaseSync(file);
    this.db.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
    this.db.exec(`CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS snapshots(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES projects(id),provider TEXT NOT NULL,label TEXT NOT NULL,imported_at TEXT NOT NULL,fielded_at TEXT,category TEXT NOT NULL,source_url TEXT,license TEXT,sha256 TEXT NOT NULL,row_count INTEGER NOT NULL,payload TEXT NOT NULL,UNIQUE(project_id,provider,sha256));
CREATE TABLE IF NOT EXISTS scenarios(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES projects(id),name TEXT NOT NULL,created_at TEXT NOT NULL,parameters TEXT NOT NULL,result TEXT NOT NULL,snapshot_id TEXT,notes TEXT);
CREATE TABLE IF NOT EXISTS predictions(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES projects(id),created_at TEXT NOT NULL,target_date TEXT NOT NULL,title TEXT NOT NULL,statement TEXT NOT NULL,source_url TEXT,metrics TEXT,notes TEXT,amends_id TEXT);
CREATE TABLE IF NOT EXISTS qa_runs(id TEXT PRIMARY KEY,ran_at TEXT NOT NULL,results TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_snapshots_project ON snapshots(project_id,imported_at);
CREATE INDEX IF NOT EXISTS idx_scenarios_project ON scenarios(project_id,created_at);
CREATE INDEX IF NOT EXISTS idx_pred_project ON predictions(project_id,target_date);`);
    if(this.listProjects().length===0)this.createProject("Local Election Research");
  }
  close(){this.db.close()}
  listProjects(){return this.db.prepare("SELECT id,name,created_at FROM projects ORDER BY created_at ASC").all().map(x=>({...x}))}
  checkProject(id){if(typeof id!=="string"||!this.db.prepare("SELECT 1 FROM projects WHERE id=?").get(id))throw new Error("Select an existing local project.");return id}
  createProject(name){const n=String(name??"").trim();if(!n||n.length>100)throw new Error("Project name must contain 1–100 characters.");const entry={id:randomUUID(),name:n,created_at:new Date().toISOString()};this.db.prepare("INSERT INTO projects (id,name,created_at) VALUES(?,?,?)").run(entry.id,entry.name,entry.created_at);return entry}
  saveSnapshot(p){
    this.checkProject(p.projectId);
    const provider=String(p.provider||"Local import").slice(0,150),label=String(p.label||"Untitled source").slice(0,180);
    if(!provider.trim()||!label.trim())throw new Error("Source name and label are required.");
    const payload=JSON.stringify(p.raw);
    if(!payload||Buffer.byteLength(payload,"utf8")>30*1024*1024)throw new Error("Source data is empty or exceeds the 30 MB limit.");
    const sha256=createHash("sha256").update(payload).digest("hex");
    const old=this.db.prepare("SELECT id,imported_at FROM snapshots WHERE project_id=? AND provider=? AND sha256=?").get(p.projectId,provider,sha256);
    if(old)return {id:old.id,duplicate:true,sha256,imported_at:old.imported_at};
    const rowCount=Array.isArray(p.raw)?p.raw.length:Array.isArray(p.raw?.polls)?p.raw.polls.length:1;
    const item={id:randomUUID(),project_id:p.projectId,provider,label,imported_at:new Date().toISOString(),fielded_at:p.fieldedAt?String(p.fieldedAt).slice(0,40):null,category:String(p.category||"IMPORTED_SOURCE").slice(0,80),source_url:p.sourceUrl?String(p.sourceUrl).slice(0,1000):null,license:p.license?String(p.license).slice(0,500):null,sha256,row_count:rowCount};
    this.db.prepare("INSERT INTO snapshots (id,project_id,provider,label,imported_at,fielded_at,category,source_url,license,sha256,row_count,payload) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(item.id,item.project_id,item.provider,item.label,item.imported_at,item.fielded_at,item.category,item.source_url,item.license,item.sha256,item.row_count,payload);
    return {...item,duplicate:false};
  }
  listSnapshots(projectId){this.checkProject(projectId);return this.db.prepare("SELECT id,project_id,provider,label,imported_at,fielded_at,category,source_url,license,sha256,row_count FROM snapshots WHERE project_id=? ORDER BY imported_at DESC").all(projectId).map(x=>({...x}))}
  getSnapshot(id){const x=this.db.prepare("SELECT * FROM snapshots WHERE id=?").get(String(id));if(!x)throw new Error("Source snapshot was not found.");return {...x,raw:JSON.parse(x.payload),payload:undefined}}
  saveScenario(p){
    this.checkProject(p.projectId);const name=String(p.name??"").trim();if(!name||name.length>150)throw new Error("Scenario name must contain 1–150 characters.");
    const x={id:randomUUID(),project_id:p.projectId,name,created_at:new Date().toISOString(),parameters:JSON.stringify(p.parameters),result:JSON.stringify(p.result),snapshot_id:p.snapshotId||null,notes:String(p.notes||"").slice(0,2000)};
    this.db.prepare("INSERT INTO scenarios (id,project_id,name,created_at,parameters,result,snapshot_id,notes) VALUES(?,?,?,?,?,?,?,?)").run(x.id,x.project_id,x.name,x.created_at,x.parameters,x.result,x.snapshot_id,x.notes);
    return {id:x.id,name:x.name,created_at:x.created_at};
  }
  listScenarios(projectId){this.checkProject(projectId);return this.db.prepare("SELECT id,name,created_at,parameters,result,snapshot_id,notes FROM scenarios WHERE project_id=? ORDER BY created_at DESC").all(projectId).map(x=>({...x,parameters:JSON.parse(x.parameters),result:JSON.parse(x.result)}))}
  createPrediction(p){
    this.checkProject(p.projectId);
    const title=String(p.title??"").trim(),statement=String(p.statement??"").trim(),target=String(p.targetDate??"");
    if(!title||title.length>150||!statement||statement.length>3000)throw new Error("Prediction title and statement are required.");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(target)||!Number.isFinite(Date.parse(target+"T00:00:00Z")))throw new Error("Prediction target must be a calendar date.");
    const x={id:randomUUID(),project_id:p.projectId,created_at:new Date().toISOString(),target_date:target,title,statement,source_url:String(p.sourceUrl||"").slice(0,1000),metrics:String(p.metrics||"").slice(0,1000),notes:String(p.notes||"").slice(0,2000),amends_id:p.amendsId||null};
    this.db.prepare("INSERT INTO predictions (id,project_id,created_at,target_date,title,statement,source_url,metrics,notes,amends_id) VALUES(?,?,?,?,?,?,?,?,?,?)").run(x.id,x.project_id,x.created_at,x.target_date,x.title,x.statement,x.source_url,x.metrics,x.notes,x.amends_id);
    return x;
  }
  listPredictions(projectId){this.checkProject(projectId);return this.db.prepare("SELECT * FROM predictions WHERE project_id=? ORDER BY target_date DESC,created_at DESC").all(projectId).map(x=>({...x}))}
  saveQARun(results){const item={id:randomUUID(),ran_at:new Date().toISOString()};this.db.prepare("INSERT INTO qa_runs (id,ran_at,results) VALUES(?,?,?)").run(item.id,item.ran_at,JSON.stringify(results));return item}
  listQARuns(){return this.db.prepare("SELECT id,ran_at,results FROM qa_runs ORDER BY ran_at DESC LIMIT 30").all().map(x=>({...x,results:JSON.parse(x.results)}))}
  exportProject(projectId){this.checkProject(projectId);const project=this.listProjects().find(x=>x.id===projectId);const snapshots=this.db.prepare("SELECT * FROM snapshots WHERE project_id=?").all(projectId).map(x=>({...x}));const scenarios=this.db.prepare("SELECT * FROM scenarios WHERE project_id=?").all(projectId).map(x=>({...x}));const predictions=this.db.prepare("SELECT * FROM predictions WHERE project_id=?").all(projectId).map(x=>({...x}));return {format:"election-workbench-backup-v1",exported_at:new Date().toISOString(),project,snapshots,scenarios,predictions}}
  importProjectBackup(backup){
    if(!backup||backup.format!=="election-workbench-backup-v1"||!backup.project||!Array.isArray(backup.snapshots)||!Array.isArray(backup.scenarios)||!Array.isArray(backup.predictions))throw new Error("Not a supported Election Workbench backup.");
    if(backup.snapshots.length>2000||backup.scenarios.length>10000||backup.predictions.length>10000)throw new Error("Backup contains too many records.");
    const project=this.createProject("Restored: "+String(backup.project.name||"Research").slice(0,80));
    this.db.exec("BEGIN TRANSACTION");
    try{
      for(const row of backup.snapshots){
        const raw=JSON.parse(row.payload),sha=createHash("sha256").update(JSON.stringify(raw)).digest("hex");if(sha!==row.sha256)throw new Error("Snapshot backup checksum mismatch.");
        this.db.prepare("INSERT INTO snapshots (id,project_id,provider,label,imported_at,fielded_at,category,source_url,license,sha256,row_count,payload) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
        .run(randomUUID(),project.id,row.provider,row.label,row.imported_at,row.fielded_at,row.category,row.source_url,row.license,sha,row.row_count,JSON.stringify(raw));
      }
      for(const row of backup.scenarios){
        this.db.prepare("INSERT INTO scenarios (id,project_id,name,created_at,parameters,result,snapshot_id,notes) VALUES(?,?,?,?,?,?,?,?)")
        .run(randomUUID(),project.id,String(row.name).slice(0,150),row.created_at,JSON.stringify(JSON.parse(row.parameters)),JSON.stringify(JSON.parse(row.result)),null,row.notes);
      }
      for(const row of backup.predictions){
        this.db.prepare("INSERT INTO predictions (id,project_id,created_at,target_date,title,statement,source_url,metrics,notes,amends_id) VALUES(?,?,?,?,?,?,?,?,?,?)")
        .run(randomUUID(),project.id,row.created_at,row.target_date,row.title,row.statement,row.source_url,row.metrics,row.notes,null);
      }
      this.db.exec("COMMIT");return project;
    }catch(error){this.db.exec("ROLLBACK");this.db.prepare("DELETE FROM projects WHERE id=?").run(project.id);throw error}
  }
}

export {ProjectStore};

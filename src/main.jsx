import React,{useEffect,useState,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {SCENARIO_DEFAULT,MICHIGAN_REFERENCE,normalizedTwoParty} from '../packages/core/scenario.mjs';
import './styles.css';

const api=(command,args={})=>window.workbench.invoke(command,args);
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const fmt=(x,digits=1)=>Number.isFinite(Number(x))?Number(x).toLocaleString(undefined,{minimumFractionDigits:digits,maximumFractionDigits:digits}):'—';
const date=x=>x?new Date(x).toLocaleString():'Not recorded';
const linked=(url)=>url?api('system:openLink',{url}):Promise.resolve();
const licenseNote='Polling data: VoteHub, CC BY 4.0. Original poll sources remain attributed. Published provider averages are separate records.';
const nav=[
 ['projects','Projects','Project manager'],
 ['polls','Poll Explorer','VoteHub individual polls'],
 ['sources','Source Library','Import and inspect datasets'],
 ['michigan','Michigan Lab','Early voting scenarios'],
 ['national','National Model','Cohort and vote-share calculations'],
 ['predictions','Predictions','Dated prediction register'],
 ['qa','QA Center','Run and inspect checks'],
 ['settings','Backup & Settings','Local project data'],
 ['help','Help','How to operate the app']
];
function Info({children}){return <p className="fine">{children}</p>}
function Alert({children,kind='note'}){return <div className={'alert '+kind} role="status">{children}</div>}
function Busy({busy,children,...props}){return <button type="button" {...props} disabled={busy||props.disabled}>{children}</button>}
function ErrorMessage({message,onDismiss}){return message?<div className="alert error" role="alert"><span>{message}</span><button aria-label="Dismiss message" onClick={onDismiss}>Dismiss</button></div>:null}
function TextField({label,value,onChange,help,type='text',min,max,step,placeholder,required=false}){
 return <label className="input-wrap"><span className="input-label">{label}</span><input type={type} value={value??''} onChange={e=>onChange(e.target.value)} min={min} max={max} step={step} placeholder={placeholder} required={required}/>{help?<small>{help}</small>:null}</label>;
}
function NumberField({label,value,onChange,help,min=0,max=100,step=1,slider=false}){
 return <div className="input-wrap"><label className="input-label">{label}</label><div className="range-row"><input aria-label={label} type="number" min={min} max={max} step={step} value={value??''} onChange={e=>onChange(e.target.value)} />{slider?<input aria-label={label+' slider'} type="range" min={min} max={max} step={step} value={Math.min(max,Math.max(min,num(value)))} onChange={e=>onChange(e.target.value)}/>:null}</div>{help?<small>{help}</small>:null}</div>
}
function SectionTitle({title,description,children}){return <header className="section-title"><div><h2>{title}</h2><p>{description}</p></div><div className="section-actions">{children}</div></header>}
function Table({headers,rows,empty='Nothing to display yet.'}){
 return <div className="table-scroller"><table><thead><tr>{headers.map((h,i)=><th key={i} scope="col">{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>):<tr><td colSpan={headers.length} className="empty">{empty}</td></tr>}</tbody></table></div>
}
function Projects({projects,current,onSelect,refresh,perform,busy}){
 const [name,setName]=useState('');
 const create=async(e)=>{e.preventDefault();if(!name.trim())return;const created=await perform('projects:create',{name:name.trim()},'New project created.');if(created){setName('');await refresh(created.id)}};
 return <><SectionTitle title="Projects" description="Private projects stored on this computer. No account or online service required."/>
 <div className="grid two"><section className="panel"><h3>Open project</h3><div className="project-list">{projects.map(p=><button className={'project-item '+(current===p.id?'selected':'')} key={p.id} onClick={()=>onSelect(p.id)}><strong>{p.name}</strong><small>Created {date(p.created_at)}{p.id===current?' · Selected':''}</small></button>)}</div></section>
 <section className="panel"><h3>Create a local project</h3><form onSubmit={create}><TextField label="New project name" value={name} onChange={setName} placeholder="Example: Michigan election research" required/><div className="actions"><Busy busy={busy} disabled={!name.trim()} type="submit">Create project</Busy></div></form><Info>Creating a project never overwrites other projects. Each saved scenario and imported dataset gets its own historical record.</Info></section></div></>
}
function PollExplorer({project,perform,busy}){
 const [filters,setFilters]=useState({poll_type:'',pollster:'',subject:'',from_date:'',to_date:'',min_sample_size:'',population:''});
 const [types,setTypes]=useState([]),[pollsters,setPollsters]=useState([]),[subjects,setSubjects]=useState([]);
 const [polls,setPolls]=useState([]),[meta,setMeta]=useState(null),[selected,setSelected]=useState(null),[page,setPage]=useState(0),[search,setSearch]=useState('');
 const loadFilters=async()=>{const [t,p,s]=await Promise.all([perform('polls:types'),perform('polls:pollsters'),perform('polls:subjects')]);if(t)setTypes(t);if(p)setPollsters(p);if(s)setSubjects(s)};
 const refresh=async(force=false)=>{const q=Object.fromEntries(Object.entries(filters).filter(([k,v])=>String(v).trim()!==''));if(q.min_sample_size)q.min_sample_size=Number(q.min_sample_size);const r=await perform('polls:refresh',{filters:q,force},'VoteHub polling response received.');if(r){setPolls(r.polls||[]);setMeta(r.meta);setSelected(null);setPage(0)}};
 const filtered=useMemo(()=>polls.filter(p=>(p.pollster+' '+p.poll_type+' '+(p.raw?.subject||'')+' '+(p.raw?.seat_name||'')).toLowerCase().includes(search.toLowerCase())),[polls,search]);
 const pageSize=75,pages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const save=async()=>{if(!project)return;const x=await perform('polls:save',{projectId:project.id},'VoteHub data saved as an immutable source snapshot.');if(x&&x.duplicate)window.alert('An identical snapshot already exists. No duplicate data was created.')};
 const detail=selected?.raw||selected;
 return <><SectionTitle title="Poll Explorer" description="Explore individual polls from VoteHub's free public API. All polling categories are included unless you select a filter."><Busy busy={busy} onClick={loadFilters}>Load filter choices</Busy><Busy busy={busy} onClick={()=>refresh(true)} className="primary">Refresh polls</Busy></SectionTitle>
 <Alert>VoteHub is free and licensed CC BY 4.0. These are individual surveys, not the published Silver Bulletin, RCP or DDHQ weighted averages.</Alert>
 <section className="panel"><h3>Optional VoteHub filters</h3><div className="filter-grid">
 <label className="input-wrap"><span className="input-label">Poll type</span><select value={filters.poll_type} onChange={e=>setFilters({...filters,poll_type:e.target.value})}><option value="">All poll types (default)</option>{types.map(x=><option key={x} value={x}>{x}</option>)}</select><small>No restriction unless selected.</small></label>
 <label className="input-wrap"><span className="input-label">Pollster</span><input value={filters.pollster} onChange={e=>setFilters({...filters,pollster:e.target.value})} placeholder="Any pollster" list="pollster-list"/><datalist id="pollster-list">{pollsters.map(x=><option key={x} value={x}/>)}</datalist></label>
 <label className="input-wrap"><span className="input-label">Subject</span><input value={filters.subject} onChange={e=>setFilters({...filters,subject:e.target.value})} placeholder="Any subject" list="subject-list"/><datalist id="subject-list">{subjects.map(x=><option key={x.subject} value={x.subject}/>)}</datalist></label>
 <TextField label="From end date" value={filters.from_date} onChange={v=>setFilters({...filters,from_date:v})} type="date"/>
 <TextField label="To end date" value={filters.to_date} onChange={v=>setFilters({...filters,to_date:v})} type="date"/>
 <TextField label="Minimum sample size" value={filters.min_sample_size} onChange={v=>setFilters({...filters,min_sample_size:v})} type="number" min={0}/>
 <label className="input-wrap"><span className="input-label">Population</span><select value={filters.population} onChange={e=>setFilters({...filters,population:e.target.value})}><option value="">Any</option><option value="lv">Likely voters</option><option value="rv">Registered voters</option><option value="a">Adults / all</option></select></label>
 </div><div className="actions"><Busy busy={busy} onClick={()=>refresh(false)} className="primary">Fetch matching polls</Busy><button onClick={()=>setFilters({poll_type:'',pollster:'',subject:'',from_date:'',to_date:'',min_sample_size:'',population:''})}>Clear filters</button><Busy busy={busy} disabled={!meta||!project} onClick={save}>Save source snapshot</Busy></div>
 <Info>{meta?'Retrieved: '+date(meta.retrievedAt)+' · '+(meta.stale?'STALE — refresh failed':meta.cached?'Cached response':'New response'):'No polling data loaded. Use “Fetch matching polls” to retrieve all categories.'}</Info></section>
 {meta?<section className="panel"><SectionTitle title="Retrieved polls" description={filtered.length+' matching records. Search below only filters the displayed results, not the saved source.'}/><TextField label="Search loaded pollster, type, subject or seat" value={search} onChange={v=>{setSearch(v);setPage(0)}} placeholder="Search loaded results"/>
 <Table headers={['Pollster','Category','Subject / race','Fieldwork ends','Sample','Results','Detail']} empty="No polls match this display search." rows={filtered.slice(page*pageSize,(page+1)*pageSize).map(p=>[p.pollster,p.poll_type,p.raw?.subject||p.raw?.seat_name||'—',p.raw?.end_date||'—',p.raw?.sample_size||'—',(p.answers||[]).slice(0,2).map(a=>a.choice+' '+fmt(a.pct,1)+'%').join(' · '),<button onClick={()=>setSelected(p)}>View</button>])}/>
 <div className="actions"><button disabled={page<=0} onClick={()=>setPage(Math.max(0,page-1))}>Previous page</button><span>Page {page+1} of {pages}</span><button disabled={page+1>=pages} onClick={()=>setPage(page+1)}>Next page</button></div>
 </section>:null}
 {detail?<section className="panel"><SectionTitle title="Poll details" description="Original provider fields remain available in the saved source record."><button onClick={()=>setSelected(null)}>Close details</button></SectionTitle><div className="metrics three"><div className="metric"><small>Pollster</small><strong>{detail.pollster||'—'}</strong></div><div className="metric"><small>Fieldwork</small><strong>{detail.start_date||'—'} to {detail.end_date||'—'}</strong></div><div className="metric"><small>Population</small><strong>{detail.population||'Unknown'}</strong></div></div><Table headers={['Choice','Reported %']} rows={(detail.answers||[]).map(a=>[a.choice,fmt(a.pct,1)+'%'])}/><Info>Sponsors: {(detail.sponsors||[]).join(', ')||'Not supplied'} · Partisan: {String(detail.partisan||'Not supplied')} · Internal: {String(Boolean(detail.internal))}</Info>{detail.url?<button onClick={()=>linked(detail.url)}>Open original poll source</button>:null}</section>:null}
 <Info>{licenseNote}</Info></>
}
function SourceLibrary({project,perform,busy}){
 const [providers,setProviders]=useState([]),[snapshots,setSnapshots]=useState([]),[selected,setSelected]=useState(null),[exportFormat,setExportFormat]=useState('json');
 const load=async()=>{const [p,s]=await Promise.all([perform('providers:list'),project?perform('snapshots:list',{projectId:project.id}):[]]);if(p)setProviders(p);if(s)setSnapshots(s)};
 useEffect(()=>{load()},[project?.id]);
 const importFile=async(provider)=>{if(!project)return;const r=await perform('snapshots:import',{projectId:project.id,provider},'Local source imported.');if(r&&!r.canceled){await load();if(r.duplicate)window.alert('Identical source already imported. No duplicate created.')}};
 const view=async(id)=>{const r=await perform('snapshots:detail',{id});if(r)setSelected(r)};
 const exportFile=async()=>{if(!selected)return;await perform('snapshots:export',{id:selected.id,format:exportFormat},'Snapshot exported. Check your selected folder.')};
 return <><SectionTitle title="Source Library" description="Differentiate published averages, raw polls, voter surveys and historical administrative counts. Data stays private on this computer."><Busy busy={busy} onClick={load}>Reload sources</Busy></SectionTitle>
 <Alert>Free permitted local imports are supported. Paid feeds and AP Voter entitlement are never activated automatically.</Alert>
 <section className="panel"><h3>Provider status and free/local import</h3><Table headers={['Provider','Type','Access','Action']} rows={providers.map(p=>[<div><strong>{p.name}</strong><small className="block">{p.detail}</small></div>,p.kind,<span className={'pill '+(p.access==='FREE_API'?'free':p.access==='ENTITLEMENT_REQUIRED'?'blocked':'manual')}>{p.access==='FREE_API'?'Free public API':p.access==='ENTITLEMENT_REQUIRED'?'Subscription gated':'Manual authorized import'}</span>,<div className="small-actions"><Busy busy={busy||!project} onClick={()=>importFile(p.id)}>Import local file</Busy><button onClick={()=>linked(p.url)}>Source</button></div>])}/></section>
 <section className="panel"><h3>Immutable local source snapshots</h3><Table headers={['Imported','Provider','Label','Category','Rows','View']} empty="No sources imported yet. Use Import local file on a provider above." rows={snapshots.map(s=>[date(s.imported_at),s.provider,s.label,s.category,s.row_count,<button onClick={()=>view(s.id)}>Inspect</button>])}/></section>
 {selected?<section className="panel"><SectionTitle title="Snapshot detail" description="The original stored record is never edited in place."><button onClick={()=>setSelected(null)}>Close</button></SectionTitle>
 <div className="data-list"><div><b>Provider:</b> {selected.provider}</div><div><b>Retrieved:</b> {date(selected.imported_at)}</div><div><b>SHA-256:</b> <span className="mono">{selected.sha256}</span></div><div><b>Rows:</b> {selected.row_count}</div><div><b>Type:</b> {selected.category}</div><div><b>Rights:</b> {selected.license||'Not supplied'}</div></div>
 <div className="actions"><label>Export format <select value={exportFormat} onChange={e=>setExportFormat(e.target.value)}><option value="json">JSON with provenance</option><option value="csv">CSV</option></select></label><Busy busy={busy} onClick={exportFile}>Export snapshot</Busy></div>
 <details><summary>View original record preview</summary><pre>{JSON.stringify(selected.raw,null,2).slice(0,12000)}</pre></details>
 </section>:null}</>
}
function MichiganLab({perform,busy}){
 const [params,setParams]=useState({...MICHIGAN_REFERENCE}),[result,setResult]=useState(null);
 const change=(key,v)=>setParams(x=>({...x,[key]:v}));
 const calc=async()=>{const r=await perform('michigan:calculate',{parameters:params},'Conditional Michigan arithmetic calculated.');if(r)setResult(r)};
 const reset=()=>{setParams({...MICHIGAN_REFERENCE});setResult(null)};
 const sen=normalizedTwoParty(49.9,45.2),gov=normalizedTwoParty(51.8,42.4);
 return <><SectionTitle title="Michigan Lab" description="Dated early-ballot counts and hypothetical turnout assumptions. Polling and modeled party affiliation are not actual counted candidate votes."/>
 <Alert kind="warn">Reference inputs are from the November 2, 2026 source-model snapshot, not a live 2026 election return. Marist joint demographic IPF and original RedBox microdata still require separately authorized, verified import.</Alert>
 <div className="grid two"><section className="panel"><h3>Reference counts and adjustable assumptions</h3><div className="filter-grid">
 <NumberField label="Recorded returned absentee" value={params.absentee} onChange={v=>change('absentee',v)} max={50000000}/>
 <NumberField label="Recorded early in person" value={params.eip} onChange={v=>change('eip',v)} max={50000000}/>
 <NumberField label="Hypothetical total turnout" value={params.estimatedFinal} onChange={v=>change('estimatedFinal',v)} max={50000000}/>
 <NumberField label="Hypothetical final early ballots" value={params.finalEarly} onChange={v=>change('finalEarly',v)} max={50000000}/>
 <NumberField label="Already recorded early voters aged 65+ (%)" value={params.observed65} onChange={v=>change('observed65',v)} help="Reported 55%; model reference, not a full demographic joint table"/>
 <NumberField label="Later early voters aged 65+ (%)" value={params.late65} onChange={v=>change('late65',v)} help="Unverified assumption"/>
 <NumberField label="All participating voters aged 65+ (%)" value={params.overall65} onChange={v=>change('overall65',v)} help="Unverified assumption"/>
 <NumberField label="Future voters modeled Republican-aligned (%)" value={params.futureR} onChange={v=>change('futureR',v)} help="Assumed future composition, not observed candidate preference"/>
 <NumberField label="Extra Republican no-show (%)" value={params.extraNoShow} onChange={v=>change('extraNoShow',v)} help="Optional future-only stress, not automatically added to polls"/>
 </div>
 <label className="input-wrap"><span className="input-label">How to interpret nonvoting</span><select value={params.mode} onChange={e=>change('mode',e.target.value)}><option value="embedded">Already reflected in baseline</option><option value="incremental">Additional future R-aligned nonvoting</option><option value="undervote">Contest skipped, statewide turnout unchanged</option></select></label>
 <div className="actions"><Busy busy={busy} className="primary" onClick={calc}>Calculate Michigan scenario</Busy><button onClick={reset}>Reset reference assumptions</button></div></section>
 <section className="panel"><h3>Conditional results</h3>{result?<><div className="metrics two"><div className="metric"><small>Recorded early ballots (source dated)</small><strong>{fmt(result.already,0)}</strong></div><div className="metric"><small>Illustrative adjusted total</small><strong>{fmt(result.adjustedFinal,0)}</strong></div><div className="metric"><small>Illustrative Election Day ballots</small><strong>{fmt(result.electionDay,0)}</strong></div><div className="metric"><small>Implied Election Day 65+ share</small><strong>{result.seniorElectionDayShare==null?'Not available':fmt(result.seniorElectionDayShare)+'%'}</strong></div></div><Info>{result.note}</Info></>:<Alert>Set assumptions and click Calculate to see results. Invalid/impossible combinations produce an error.</Alert>}
 <h3>Secondary-transcribed Silver Bulletin, November 2</h3><Table headers={['Contest','D all-response','R all-response','Other/undecided','Normalized 2-party margin']} rows={[[ 'MI Senate','49.9%','45.2%',fmt(sen.otherOrUndecided)+'%','D+'+fmt(sen.twoPartyMargin,2) ],[ 'MI Governor','51.8%','42.4%',fmt(gov.otherOrUndecided)+'%','D+'+fmt(gov.twoPartyMargin,2) ]]}/>
 <Info>These are historical secondary-transcribed polling averages, not November 3 counted results, and do not imply a validated candidate forecast.</Info></section></div></>
}
const controls=[
 ['genericMargin','Generic ballot baseline D−R (points)',-100,100,'Assumed starting two-party polling margin, not a counted vote result.'],
 ['rAbstain','Original potential Republicans not voting (%)',0,100,'Percent of original potential R cohort.'],
 ['rCross','Original potential Republicans voting Democratic (%)',0,100,'Distinct original-cohort slice, not percent of remaining Republicans.'],
 ['rThird','Original potential Republicans voting third party (%)',0,100,'Another distinct original-cohort slice.'],
 ['dExtra','Additional Democratic participation (%)',0,100,'Increase relative to original Democratic cohort.'],
 ['dThird','Active Democrats voting third party (%)',0,100,'Percent of participating Democratic cohort after extra participation.']
];
function NationalLab({project,perform,busy}){
 const [params,setParams]=useState({...SCENARIO_DEFAULT}),[result,setResult]=useState(null),[name,setName]=useState(''),[scenarios,setScenarios]=useState([]),[a,setA]=useState(''),[b,setB]=useState('');
 const load=async()=>{if(project){const r=await perform('scenarios:list',{projectId:project.id});if(r)setScenarios(r)}};
 useEffect(()=>{load()},[project?.id]);
 const set=(id,value)=>{setParams(x=>({...x,[id]:value}));setResult(null)};
 const calc=async()=>{const r=await perform('scenarios:calculate',{parameters:params},'Scenario calculation completed.');if(r)setResult(r)};
 const save=async()=>{if(!project||!name.trim())return;const saved=await perform('scenarios:save',{projectId:project.id,name,parameters:params},'Immutable scenario version saved.');if(saved){setName('');await load()}};
 const select=(id)=>{const item=scenarios.find(x=>x.id===id);if(item){setParams({...item.parameters});setResult(item.result)}};
 const first=scenarios.find(x=>x.id===a),second=scenarios.find(x=>x.id===b);
 return <><SectionTitle title="National Model / G15" description="User-controlled cohort arithmetic. Results are hypothetical counted two-party margins, not election forecasts."/><div className="grid two">
 <section className="panel"><h3>Parameters</h3>{controls.map(([key,label,min,max,help])=><NumberField key={key} label={label} min={min} max={max} step={key==='genericMargin'?0.1:0.5} slider value={params[key]} onChange={v=>set(key,v)} help={help}/>)}
 <div className="actions"><Busy busy={busy} onClick={calc} className="primary">Calculate scenario</Busy><button onClick={()=>{setParams({...SCENARIO_DEFAULT});setResult(null)}}>Reset all to zero</button><button onClick={()=>{setParams({...SCENARIO_DEFAULT,genericMargin:9.9,rAbstain:10,rCross:5});setResult(null)}}>Load historical illustrative 9.9 / 10 / 5</button></div>
 <Info>A 10% original R nonvoting rate and 5% original R crossover implies 85% remaining to vote Republican, *not* 85.5%. Each source snapshot is independent of assumptions.</Info></section>
 <section className="panel"><h3>Calculated outcome</h3>{result?<><div className="metrics two"><div className="metric"><small>Hypothetical effective D−R 2-party margin</small><strong>{result.effectiveMargin>=0?'D+':'R+'}{fmt(Math.abs(result.effectiveMargin),2)}</strong></div><div className="metric"><small>R abstention, original cohort</small><strong>{fmt(result.originalRepublicanExample.absent)}%</strong></div><div className="metric"><small>R crossover, original cohort</small><strong>{fmt(result.originalRepublicanExample.crossover)}%</strong></div><div className="metric"><small>R remains for R, original cohort</small><strong>{fmt(result.originalRepublicanExample.republican)}%</strong></div></div><Info>{result.note}</Info></>:<Alert>Click Calculate scenario to apply the displayed assumptions. None of these settings are recorded voter preferences.</Alert>}
 <h3>Save scenario version</h3><TextField label="Scenario name" value={name} onChange={setName} placeholder="Example: R crossover stress"/><div className="actions"><Busy busy={busy} disabled={!name.trim()||!project} onClick={save}>Save as new version</Busy></div>
 <h3>Reopen a previous scenario</h3><div className="scroll-list">{scenarios.map(s=><button className="list-button" key={s.id} onClick={()=>select(s.id)}><b>{s.name}</b><small>{date(s.created_at)} · {s.result.effectiveMargin>=0?'D+':'R+'}{fmt(Math.abs(s.result.effectiveMargin),2)}</small></button>)}</div>
 <h3>Compare two saved versions</h3><div className="filter-grid"><label className="input-wrap"><span className="input-label">First</span><select value={a} onChange={e=>setA(e.target.value)}><option value="">Choose scenario</option>{scenarios.map(s=><option key={s.id} value={s.id}>{s.name} — {s.id.slice(0,5)}</option>)}</select></label><label className="input-wrap"><span className="input-label">Second</span><select value={b} onChange={e=>setB(e.target.value)}><option value="">Choose scenario</option>{scenarios.map(s=><option key={s.id} value={s.id}>{s.name} — {s.id.slice(0,5)}</option>)}</select></label></div>
 {first&&second?<Table headers={['Parameter','First','Second','Difference']} rows={[...controls.map(([id,label])=>[label,fmt(first.parameters[id]),fmt(second.parameters[id]),fmt(Number(second.parameters[id])-Number(first.parameters[id]))]),['Effective D−R 2-party margin',fmt(first.result.effectiveMargin,2),fmt(second.result.effectiveMargin,2),fmt(second.result.effectiveMargin-first.result.effectiveMargin,2)]]}/>:<Info>Select two versions to compare saved assumptions and outputs.</Info>}</section></div></>
}
function PredictionRegister({project,perform,busy}){
 const [items,setItems]=useState([]),[form,setForm]=useState({title:'',statement:'',targetDate:'',sourceUrl:'',metrics:'',notes:'',amendsId:null});
 const load=async()=>{if(project){const x=await perform('predictions:list',{projectId:project.id});if(x)setItems(x)}};
 useEffect(()=>{load()},[project?.id]);
 const change=(key,value)=>setForm(x=>({...x,[key]:value}));
 const submit=async(e)=>{e.preventDefault();const x=await perform('predictions:create',{projectId:project?.id,...form},'Prediction saved as a permanent dated record.');if(x){setForm({title:'',statement:'',targetDate:'',sourceUrl:'',metrics:'',notes:'',amendsId:null});await load()}};
 const amend=x=>{setForm({title:x.title,statement:x.statement,targetDate:x.target_date,sourceUrl:x.source_url||'',metrics:x.metrics||'',notes:'Amends '+x.id+'. '+(x.notes||''),amendsId:x.id});window.scrollTo({top:0,behavior:'smooth'})};
 return <><SectionTitle title="Prediction Register" description="Record a falsifiable dated political claim before it is evaluated. Saved records are never overwritten."/>
 <div className="grid two"><section className="panel"><h3>{form.amendsId?'Create an amendment':'New prediction'}</h3><form onSubmit={submit}><TextField label="Title" value={form.title} onChange={v=>change('title',v)} required/><label className="input-wrap"><span className="input-label">Exact prediction and conditions</span><textarea value={form.statement} onChange={e=>change('statement',e.target.value)} required rows={4}/></label><TextField label="Event / target date" value={form.targetDate} onChange={v=>change('targetDate',v)} type="date" required/><TextField label="Metric or threshold to score" value={form.metrics} onChange={v=>change('metrics',v)} placeholder="Example: House national D−R two-party margin"/><TextField label="Evidence URL (optional)" value={form.sourceUrl} onChange={v=>change('sourceUrl',v)}/><label className="input-wrap"><span className="input-label">Assumptions / notes</span><textarea value={form.notes} onChange={e=>change('notes',e.target.value)} rows={3}/></label><div className="actions"><Busy busy={busy} disabled={!project||!form.title.trim()||!form.statement.trim()||!form.targetDate} type="submit">{form.amendsId?'Save amendment':'Record prediction'}</Busy><button type="button" onClick={()=>setForm({title:'',statement:'',targetDate:'',sourceUrl:'',metrics:'',notes:'',amendsId:null})}>Clear form</button></div></form></section>
 <section className="panel"><h3>Recorded predictions</h3><Info>These entries remain pending until independently evaluated after their target dates. No outcome is automatically fabricated.</Info><div className="scroll-list">{items.map(x=><div className="prediction" key={x.id}><b>{x.title}</b><small>Recorded {date(x.created_at)} · Target {x.target_date} · {x.amends_id?'Amendment':'Original entry'}</small><p>{x.statement}</p><Info>Metric: {x.metrics||'Not supplied'}</Info><div className="actions"><button onClick={()=>amend(x)}>Create amendment</button>{x.source_url?<button onClick={()=>linked(x.source_url)}>Open evidence</button>:null}</div></div>)}{!items.length?<Alert>No prediction entries exist yet.</Alert>:null}</div></section></div></>
}
function QA({perform,busy}){
 const [report,setReport]=useState(null),[history,setHistory]=useState([]);
 const load=async()=>{const x=await perform('qa:list');if(x)setHistory(x)};
 useEffect(()=>{load()},[]);
 const run=async()=>{const x=await perform('qa:run',{},'Core checks executed and recorded.');if(x){setReport(x);await load()}};
 const shown=report||history[0]?.results;
 return <><SectionTitle title="QA Center" description="Executable arithmetic and storage checks; full release clearance requires separate installed Windows and Linux acceptance evidence."><Busy busy={busy} className="primary" onClick={run}>Run local core checks</Busy></SectionTitle>
 <Alert kind="warn"><b>Release status: INCOMPLETE.</b> This app must not be called fully QA-passed until both actual installed platforms, the full GUI control inventory, live source connections and every applicable user requirement are tested.</Alert>
 {shown?<section className="panel"><h3>Latest local check results</h3><div className="metrics three"><div className="metric"><small>Passed (core only)</small><strong>{shown.passed}</strong></div><div className="metric"><small>Failed (core only)</small><strong>{shown.failed}</strong></div><div className="metric"><small>Overall release QA</small><strong>{shown.overall}</strong></div></div><Info>Run: {date(shown.ranAt)} · version {shown.buildVersion}</Info><Table headers={['Check','Status / error']} rows={(shown.checks||[]).map(x=>[x.name,<span className={x.status==='PASS'?'good':'bad'}>{x.status}{x.message?' — '+x.message:''}</span>])}/><h4>Still unverified / blocked</h4><ul>{(shown.notTested||[]).map(x=><li key={x}>{x}</li>)}</ul></section>:<Alert>No local QA run has been recorded for this machine yet.</Alert>}
 <section className="panel"><h3>Previous local QA runs</h3><Table headers={['Date','Core passes','Core failures','Release']} rows={history.map(x=>[date(x.ran_at),x.results.passed,x.results.failed,x.results.overall])}/></section></>
}
function Settings({project,perform,busy,status,refreshProjects}){
 const backup=async()=>await perform('backup:export',{projectId:project?.id},'Project backup exported.');
 const restore=async()=>{const x=await perform('backup:import',{},'Backup restored as a separate local project.');if(x&&!x.canceled)await refreshProjects(x.id)};
 return <><SectionTitle title="Backup & Settings" description="Local file storage and backups. No cloud sync, paid hosting, telemetry or account."/>
 <div className="grid two"><section className="panel"><h3>Project backup</h3><Info>A backup exports all source snapshots, saved scenarios and predictions for the selected project into one JSON file. Restore always creates a separate new project.</Info><div className="actions"><Busy busy={busy||!project} onClick={backup}>Export this project backup</Busy><Busy busy={busy} onClick={restore}>Restore backup as new project</Busy></div></section>
 <section className="panel"><h3>Local application information</h3><p><b>Version:</b> {status?.version||'—'}</p><p><b>Platform:</b> {status?.platform||'—'}</p><p><b>Additional cost:</b> $0</p><p className="fine">Private data folder: <span className="mono">{status?.localDataFolder||'—'}</span></p><Busy busy={busy} onClick={()=>perform('system:openDataFolder',{},'Opened local project folder.')}>Open data folder</Busy></section></div></>
}
function Help(){
 return <><SectionTitle title="Help" description="No programming, API setup or paid subscription is required to use the installed program."/>
 <div className="grid two"><section className="panel"><h3>How to use this workbench</h3><ol><li>Select a local project or create one.</li><li>Open Poll Explorer and click Fetch matching polls to retrieve all VoteHub categories.</li><li>Click Save source snapshot to preserve a dated, immutable copy.</li><li>Import your authorized CSV, JSON or XLSX research files in Source Library.</li><li>Use Michigan and National Model tabs to change explicitly labeled assumptions.</li><li>Save named national scenarios and compare their results.</li><li>Record predictions with target dates; use Backup & Settings to export your work.</li><li>Run core QA, and inspect remaining full release acceptance blockers.</li></ol></section>
 <section className="panel"><h3>Data and terminology</h3><p><b>Observed:</b> Recorded ballots or survey response with date and source, not automatically counted candidate votes.</p><p><b>Average:</b> Published aggregate from a named provider, not the same as a raw VoteHub poll.</p><p><b>Scenario:</b> A conditional calculation using adjustable assumptions, not an outcome forecast.</p><p><b>Already voted survey:</b> A respondent reporting a prior vote; not official cast-ballot results.</p><p><b>Voter AP:</b> A separate provisional provider whose paid subscription access is disabled.</p><p><b>Free API:</b> VoteHub makes polling data available without subscription under CC BY 4.0.</p><button onClick={()=>linked('https://votehub.com/polls/api/')}>Read VoteHub documentation</button><Info>{licenseNote}</Info></section></div></>
}
function App(){
 const [active,setActive]=useState('projects'),[projects,setProjects]=useState([]),[projectId,setProjectId]=useState(''),[status,setStatus]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const perform=async(command,args={},successMessage='')=>{setError('');setBusy(true);try{const x=await api(command,args);if(successMessage&&!x?.canceled)setMessage(successMessage);return x}catch(e){setError(e?.message||String(e));return null}finally{setBusy(false)}};
 const refreshProjects=async(selected)=>{const list=await perform('projects:list');if(list){setProjects(list);if(selected){setProjectId(selected)}else{setProjectId(old=>(list.some(p=>p.id===old)?old:(list[0]?.id||'')))}}};
 useEffect(()=>{let mounted=true;const init=async()=>{try{const [p,s]=await Promise.all([api('projects:list'),api('system:status')]);if(mounted){setProjects(p);setProjectId(p[0]?.id||'');setStatus(s)}}catch(e){if(mounted)setError('Could not initialize application: '+e.message)}};init();const off=window.workbench.onNavigate(p=>{setActive(p);setMessage('')});return()=>{mounted=false;off()}},[]);
 const project=projects.find(p=>p.id===projectId);
 let view;
 if(active==='projects')view=<Projects projects={projects} current={projectId} onSelect={setProjectId} refresh={refreshProjects} perform={perform} busy={busy}/>;
 else if(active==='polls')view=<PollExplorer project={project} perform={perform} busy={busy}/>;
 else if(active==='sources')view=<SourceLibrary project={project} perform={perform} busy={busy}/>;
 else if(active==='michigan')view=<MichiganLab perform={perform} busy={busy}/>;
 else if(active==='national')view=<NationalLab project={project} perform={perform} busy={busy}/>;
 else if(active==='predictions')view=<PredictionRegister project={project} perform={perform} busy={busy}/>;
 else if(active==='qa')view=<QA perform={perform} busy={busy}/>;
 else if(active==='settings')view=<Settings project={project} perform={perform} busy={busy} status={status} refreshProjects={refreshProjects}/>;
 else view=<Help/>;
 return <div className="app"><aside className="sidebar"><div className="brand"><div className="brand-mark">EA</div><div><h1>Election Analysis</h1><small>Workbench · v{status?.version||'0.1.0'}</small></div></div><nav aria-label="Main application navigation">{nav.map(([key,label,help])=><button title={help} aria-current={active===key?'page':undefined} key={key} onClick={()=>{setActive(key);setMessage('');setError('')}}>{label}</button>)}</nav><div className="sidebar-foot">Local-first · $0 added cost<br/>No background polling</div></aside>
 <div className="workspace"><header className="topbar"><div className="topbar-left"><strong>{nav.find(x=>x[0]===active)?.[1]}</strong><small>Research · not a certified election forecast</small></div><label>Active project <select aria-label="Active local project" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label></header>
 <main className="main" id="main-content"><ErrorMessage message={error} onDismiss={()=>setError('')}/>{message?<div className="alert success" role="status">{message}<button onClick={()=>setMessage('')}>Dismiss</button></div>:null}{busy?<div role="status" className="busy-state">Working…</div>:null}{view}</main><footer className="footer">Sources are dated and classified · VoteHub CC BY 4.0 · All calculations are conditional unless independently validated</footer></div></div>;
}
createRoot(document.getElementById('root')).render(<App/>);

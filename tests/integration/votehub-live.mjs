/**
 * Real FREE VoteHub API connectivity check.
 * This is explicitly separate from mock tests and may be blocked by upstream.
 * Zero billing, zero authentication, and no background polling.
 */
import {VoteHubClient,VOTEHUB_DOCS} from '../../packages/connectors/src/votehub.ts';
const client=new VoteHubClient({timeoutMs:12000,cacheMs:0});
const findings=[];
async function attempt(name,fn){
  try{
    const response=await fn();
    const list=response?.data;
    const count=Array.isArray(list)?list.length:-1;
    if(count<0)throw new Error('Expected array data.');
    findings.push({name,status:'PASS',records:count});
    process.stdout.write('LIVE_API_PASS '+name+' '+count+' records retrieved from '+VOTEHUB_DOCS+'\n');
    return list;
  }catch(e){
    findings.push({name,status:'BLOCKED',error:String(e.message||e)});
    process.stderr.write('LIVE_API_BLOCKED '+name+': '+String(e.message||e)+'\n');
    return null;
  }
}
const [types,pollsters,subjects]=await Promise.all([
  attempt('poll-types',()=>client.getPollTypes(true)),
  attempt('pollsters',()=>client.getPollsters(true)),
  attempt('subjects',()=>client.getSubjects(true))
]);
const polls=await attempt('polls all categories',()=>client.getPolls({},true));
if(polls===null){
  for(const [label,url] of [
    ['unfiltered','https://api.votehub.com/polls'],
    ['generic-ballot-filtered','https://api.votehub.com/polls?poll_type=generic-ballot'],
    ['approval-filtered','https://api.votehub.com/polls?poll_type=approval']
  ]){
    try{
      const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(14000)});
      const textBody=await r.text();
      let j;
      try{j=JSON.parse(textBody)}catch{}
      const keys=j&&typeof j==='object'?Object.keys(j).slice(0,12):[];
      const shape=j&&typeof j==='object'?Object.fromEntries(keys.map(key=>[key,Array.isArray(j[key])?'array('+j[key].length+')':typeof j[key]])):{};
      process.stdout.write('LIVE_API_SHAPE '+JSON.stringify({label,status:r.status,bytes:textBody.length,keys,shape,preview:textBody.slice(0,350)})+'\\n');
    }catch(e){process.stderr.write('LIVE_API_SHAPE_FAIL '+label+' '+String(e.message||e)+'\\n')}
  }
}
if(polls?.length){
  if(types?.length){
    const observedTypes=[...new Set(polls.map(p=>p.poll_type))];
    process.stdout.write('LIVE_API_DISCOVERED_TYPES '+JSON.stringify(observedTypes.slice(0,100))+'\n');
  }
  await attempt('poll by ID',async()=>{const x=await client.getPollById(polls[0].id,true);return {data:[x.data]}});
}
const allChecked=findings.length>=4&&findings.every(f=>f.status==='PASS');
process.stdout.write('LIVE_API_VERIFICATION '+(allChecked?'PASS':'INCOMPLETE')+' '+JSON.stringify(findings)+'\n');
if(!allChecked)process.exitCode=2;

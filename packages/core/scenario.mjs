/** Pure deterministic counterfactual election calculations. This is not a forecast. */

function numeric(value,label,min,max){const n=Number(value);if(value===""||value==null||!Number.isFinite(n)||n<min||n>max)throw new Error(`${label} must be between ${min} and ${max}.`);return n}

function calculateScenario(input){
const p={genericMargin:numeric(input.genericMargin,"Starting generic ballot D−R margin",-100,100),rAbstain:numeric(input.rAbstain,"Republican original-cohort nonvoting",0,100),rCross:numeric(input.rCross,"Republican original-cohort crossover",0,100),rThird:numeric(input.rThird,"Republican original-cohort third-party",0,100),dExtra:numeric(input.dExtra,"Additional Democratic participation",0,100),dThird:numeric(input.dThird,"Democratic third-party",0,100)};
if(p.rAbstain+p.rCross+p.rThird>100+1e-9)throw new Error("Republican no-show, crossover and third-party cannot sum over 100% of original cohort.");
const d0=(100+p.genericMargin)/2,r0=(100-p.genericMargin)/2;
const rAbsent=r0*p.rAbstain/100,crossover=r0*p.rCross/100,rToThird=r0*p.rThird/100;
const dActive=d0*(1+p.dExtra/100),dToThird=dActive*p.dThird/100;
const dVotes=dActive-dToThird+crossover,rVotes=r0-rAbsent-crossover-rToThird,third=dToThird+rToThird,twoParty=dVotes+rVotes;
if(!(twoParty>0))throw new Error("No two-party votes remain. Adjust the inputs.");
return {type:"HYPOTHETICAL_SCENARIO",parameters:p,d0,r0,dVotes,rVotes,rAbsent,crossover,rToThird,dToThird,third,dActive,twoParty,effectiveMargin:100*(dVotes-rVotes)/twoParty,rConservation:(rAbsent+crossover+rToThird+rVotes)-r0,originalRepublicanExample:{absent:p.rAbstain,crossover:p.rCross,third:p.rThird,republican:100-p.rAbstain-p.rCross-p.rThird},note:"Conditional two-party vote arithmetic; not an observed election result or calibrated election forecast."}}

function normalizedTwoParty(d,r){const de=numeric(d,"Democratic share",0,100),re=numeric(r,"Republican share",0,100);if(de+re>100.001||de+re<=0)throw new Error("Two candidate shares must be positive and sum at most 100%.");return {dShare:de,rShare:re,otherOrUndecided:100-de-re,rawMargin:de-re,twoPartyMargin:100*(de-re)/(de+re)}}

function calculateMichigan(input){
const absentee=numeric(input.absentee,"Recorded absentee ballots",0,50000000),eip=numeric(input.eip,"Recorded early in-person ballots",0,50000000),estimatedFinal=numeric(input.estimatedFinal,"Hypothetical final turnout",1,50000000),finalEarly=numeric(input.finalEarly,"Hypothetical final early ballots",0,50000000);
const observed65=numeric(input.observed65,"Early 65+ share",0,100)/100,late65=numeric(input.late65,"Later early 65+ share",0,100)/100,overall65=numeric(input.overall65,"All voters 65+ share",0,100)/100,futureR=numeric(input.futureR,"Future Republican-aligned share",0,100)/100,extraNoShow=numeric(input.extraNoShow,"Additional future Republican nonvoting",0,100)/100,mode=String(input.mode);
if(!["embedded","incremental","undervote"].includes(mode))throw new Error("Select a valid nonvoting interpretation.");
const already=absentee+eip;if(already>estimatedFinal)throw new Error("Hypothetical total turnout cannot be below already-recorded ballots.");
if(finalEarly<already||finalEarly>estimatedFinal)throw new Error("Final early ballot estimate must be between already-recorded and total turnout.");
const future=estimatedFinal-already,removedFuture=mode==="incremental"?future*futureR*extraNoShow:0,adjustedFinal=estimatedFinal-removedFuture;
if(adjustedFinal<finalEarly)throw new Error("Incremental no-show leaves fewer ballots than the assumed early count.");
const projectedSeniorEarly=already*observed65+(finalEarly-already)*late65,seniorAll=adjustedFinal*overall65;
if(seniorAll+0.00001<projectedSeniorEarly)throw new Error("Impossible senior demographics: estimated final 65+ count is below already-recorded / modeled early seniors.");
return {type:"HYPOTHETICAL_MICHIGAN_TURNOUT",already,estimatedFinal,finalEarly,future,removedFuture,adjustedFinal,electionDay:adjustedFinal-finalEarly,projectedSeniorEarly,projectedSeniorElectionDay:seniorAll-projectedSeniorEarly,seniorElectionDayShare:adjustedFinal===finalEarly?null:100*(seniorAll-projectedSeniorEarly)/(adjustedFinal-finalEarly),mode,note:"Early ballot counts are dated source snapshots. Age/future turnout assumptions are not observed candidate votes."}}

function sanitizeCsvCell(value){const t=String(value??""),safe=/^\s*[=+\-@]/.test(t)?"'"+t:t;return /[,"\r\n]/.test(safe)?'"'+safe.replaceAll('"','""')+'"':safe}

function recordsToCsv(records){if(!Array.isArray(records)||!records.length)return "";const keys=[...new Set(records.flatMap(r=>Object.keys(r)))];return [keys.map(sanitizeCsvCell).join(","),...records.map(row=>keys.map(key=>sanitizeCsvCell(row[key]&&typeof row[key]==="object"?JSON.stringify(row[key]):row[key])).join(","))].join("\r\n")}
export const SCENARIO_DEFAULT=Object.freeze({"genericMargin":0,"rAbstain":0,"rCross":0,"rThird":0,"dExtra":0,"dThird":0});
export const MICHIGAN_REFERENCE=Object.freeze({"absentee":1569715,"eip":743450,"estimatedFinal":5002698,"finalEarly":2766404,"observed65":55,"late65":40,"overall65":35,"futureR":39,"extraNoShow":10,"mode":"embedded"});
export {numeric,calculateScenario,normalizedTwoParty,calculateMichigan,sanitizeCsvCell,recordsToCsv};

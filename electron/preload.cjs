'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const allowed=new Set([
  'system:status','projects:list','projects:create','providers:list',
  'polls:refresh','polls:types','polls:pollsters','polls:subjects','polls:detail','polls:save',
  'snapshots:list','snapshots:detail','snapshots:import','snapshots:export',
  'scenarios:list','scenarios:calculate','scenarios:save',
  'michigan:calculate','predictions:list','predictions:create',
  'qa:run','qa:list','backup:export','backup:import','system:openDataFolder','system:openLink'
]);
contextBridge.exposeInMainWorld('workbench',{
  invoke(command,args){
    if(typeof command!=='string'||!allowed.has(command))return Promise.reject(new Error('Unknown operation.'));
    return ipcRenderer.invoke('workbench:invoke',command,args??{});
  },
  onNavigate(callback){
    if(typeof callback!=='function')return ()=>{};
    const handler=(_event,page)=>callback(page);
    ipcRenderer.on('workbench:navigate',handler);
    return ()=>ipcRenderer.removeListener('workbench:navigate',handler);
  }
});

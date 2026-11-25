import {shallowRef,onMounted,onUnmounted} from 'vue';
export function useAccountMode(){
 const read=()=>window.MK95Account?.read()||{mode:document.documentElement.dataset.mk95Mode==='server'?'server':'local',status:'connecting',snapshot:null};
 const account=shallowRef(read());
 const update=()=>{account.value=read()};
 onMounted(()=>{window.addEventListener('mk95-account-change',update);update()});
 onUnmounted(()=>window.removeEventListener('mk95-account-change',update));
 const action=name=>window.MK95Account?.[name]?.();
 return {account,action};
}

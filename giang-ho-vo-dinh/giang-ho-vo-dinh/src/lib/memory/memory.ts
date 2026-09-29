import type { GameSnapshot, MemoryRecord, PlayerState } from '../core/types';
export function remember(snapshot:GameSnapshot,ownerId:string,content:string,subject:string,importance:MemoryRecord['importance']='MEDIUM',location?:string){
 const id=`mem_${snapshot.world.world_time}_${Object.keys(snapshot.world.memories).length+1}`;
 snapshot.world.memories[id]={memory_id:id,subject,participants:[ownerId],content,timestamp:snapshot.world.world_time,importance,confidence:1,location:location??snapshot.player.location_id,tags:[],owner_id:ownerId};
 if(ownerId===snapshot.player.id) snapshot.player.memory_ids.push(id); else { const npc=snapshot.world.npcs[ownerId]; if(npc) npc.memory_ids.push(id); }
 return id;
}
export function retrieveMemories(snapshot:GameSnapshot,ownerId:string,subject?:string,limit=5){
 return Object.values(snapshot.world.memories).filter(m=>m.owner_id===ownerId && (!subject||m.subject===subject)).sort((a,b)=>b.timestamp-a.timestamp).slice(0,limit);
}
export function consolidate(snapshot:GameSnapshot,ownerId:string){
 const memories=retrieveMemories(snapshot,ownerId,undefined,20); return memories.slice(0,5);
}

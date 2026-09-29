import { eq, desc } from 'drizzle-orm';
import { gameSaves, eventLog } from '../db/schema';
import { getDb } from '../db/client';
import type { GameEvent, GameSnapshot } from '../core/types';

let demoSnapshot:GameSnapshot|null=null;

export interface SaveRepository { load(playerId:string):Promise<GameSnapshot|null>; save(playerId:string,snapshot:GameSnapshot,events:GameEvent[]):Promise<void>; }

export class DurableSaveRepository implements SaveRepository{
 async load(playerId:string){
  const db=getDb();
  if(!db) return demoSnapshot;
  const rows=await db.select().from(gameSaves).where(eq(gameSaves.playerId,playerId)).orderBy(desc(gameSaves.updatedAt)).limit(1);
  return rows[0]?.snapshot as GameSnapshot|undefined ?? null;
 }
 async save(playerId:string,snapshot:GameSnapshot,events:GameEvent[]){
  const db=getDb();
  if(!db){ demoSnapshot=structuredClone(snapshot); return; }
  await db.transaction(async tx=>{
   const current=await tx.select().from(gameSaves).where(eq(gameSaves.playerId,playerId)).orderBy(desc(gameSaves.updatedAt)).limit(1);
   if(current[0]) await tx.update(gameSaves).set({snapshot,version:(current[0].version??1)+1,updatedAt:new Date()}).where(eq(gameSaves.id,current[0].id));
   else await tx.insert(gameSaves).values({worldId:snapshot.world.world_id,playerId,version:1,snapshot});
   for(const ev of events) await tx.insert(eventLog).values({worldId:snapshot.world.world_id,eventId:ev.event_id,actorId:ev.actor_id,actionType:ev.action_type,targetId:ev.target_id,locationId:ev.location_id,cause:ev.cause,beforeState:ev.before,change:ev.change,afterState:ev.after,visibility:ev.visibility,occurredAt:ev.timestamp});
  });
 }
}

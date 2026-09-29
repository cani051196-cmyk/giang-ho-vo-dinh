import { eq } from 'drizzle-orm';
import { cosineDistance } from 'drizzle-orm';
import { memoryRecords } from '../db/schema';
import { getDb } from '../db/client';
import type { MemoryRecord } from '../core/types';

export async function searchSemanticMemories(ownerId:string, embedding:number[], limit=5):Promise<MemoryRecord[]> {
 const db=getDb();
 if(!db || embedding.length!==1536) return [];
 const distance=cosineDistance(memoryRecords.embedding, embedding);
 const rows=await db.select().from(memoryRecords)
  .where(eq(memoryRecords.ownerId, ownerId))
  .orderBy(distance)
  .limit(limit);
 return rows.map(row=>({
  memory_id:row.memoryId, subject:row.subject, participants:[], content:row.content,
  timestamp:row.worldTime, importance:row.importance as MemoryRecord['importance'], confidence:row.confidence/100,
  location:row.locationId??'', tags:Array.isArray(row.tags)?row.tags as string[]:[], owner_id:row.ownerId
 }));
}

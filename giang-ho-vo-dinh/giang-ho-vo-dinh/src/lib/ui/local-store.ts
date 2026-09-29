import Dexie, { type Table } from 'dexie';
import type { GameSnapshot } from '../core/types';

interface CacheRow { id:string; savedAt:number; snapshot:GameSnapshot; }
class LocalGameDB extends Dexie{
 snapshots!:Table<CacheRow,string>;
 constructor(){ super('giang-ho-vo-dinh'); this.version(1).stores({snapshots:'id,savedAt'}); }
}
const db=new LocalGameDB();
export async function cacheSnapshot(snapshot:GameSnapshot){ await db.snapshots.put({id:'active',savedAt:Date.now(),snapshot}); }
export async function getCachedSnapshot(){ return (await db.snapshots.get('active'))?.snapshot ?? null; }

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

let singleton: ReturnType<typeof drizzle> | null=null;
let pool: any=null;
export function getDb(){
 if(singleton) return singleton;
 const url=process.env.DATABASE_URL;
 if(!url) return null;
 pool=new pg.Pool({connectionString:url,max:5});
 singleton=drizzle(pool);
 return singleton;
}
export async function closeDb(){ if(pool){ await pool.end(); pool=null; singleton=null; } }

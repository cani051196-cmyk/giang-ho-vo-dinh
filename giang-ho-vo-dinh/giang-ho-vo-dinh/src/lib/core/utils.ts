import type { Attributes, CombatOutcome, Realm } from './types';

export const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
export const avgAttributes=(a:Attributes)=>Object.values(a) as number[];
export const averageAttributes=(a:Attributes)=>avgAttributes(a).reduce((sum,v)=>sum+v,0)/8;
export const realmIndex=(realm:Realm)=>['Phàm Nhân','Luyện Thể','Luyện Khí','Thông Mạch','Ngưng Khí','Tiểu Thành','Đại Thành','Tông Sư','Đại Tông Sư','Tuyệt Đỉnh'].indexOf(realm);
export function seededRandom(seed:number){ let x=Math.sin(seed*12.9898)*43758.5453; return x-Math.floor(x); }
export function outcomeFromMargin(margin:number, roll:number):CombatOutcome{
 if(margin>=35 && roll>0.15)return 'CRITICAL_SUCCESS';
 if(margin>=15)return 'SUCCESS';
 if(margin>=5)return 'ADVANTAGE';
 if(margin>-5)return 'NEUTRAL';
 if(margin>-15)return 'DISADVANTAGE';
 if(margin>-35)return 'FAILURE';
 return 'CRITICAL_FAILURE';
}

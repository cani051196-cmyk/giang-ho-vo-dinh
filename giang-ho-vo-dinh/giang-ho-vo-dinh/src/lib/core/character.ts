import type { Attributes, GameSnapshot, PlayerState } from './types';
export const ARCHETYPES={
 du_hiep:{label:'Du Hiệp',bonus:{than_phap:5,cam_giac:3},description:'Cơ động, quan sát tốt.'},
 kiem_khach:{label:'Kiếm Khách',bonus:{luc_luong:5,ngo_tinh:3},description:'Thiên về tấn công kỹ thuật.'},
 noi_gia:{label:'Nội Gia',bonus:{noi_luc:5,tam_canh:3},description:'Nội lực và kiểm soát khí.'},
 ho_the:{label:'Hộ Thể',bonus:{the_chat:5,can_co:3},description:'Bền bỉ, chịu thương tốt.'}
} as const;
export function createCharacter(snapshot:GameSnapshot,name:string,archetype:keyof typeof ARCHETYPES):PlayerState{
 const base=snapshot.player; const player=structuredClone(base); player.name=name.trim().slice(0,32)||'Vô Danh';
 const bonus=ARCHETYPES[archetype].bonus as Partial<Attributes>;
 for(const [k,v] of Object.entries(bonus)) (player.attributes as any)[k]=Math.min(99,(player.attributes as any)[k]+Number(v));
 player.status=[]; snapshot.player=player; snapshot.world.global_flags.character_created=true; return player;
}

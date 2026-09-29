import type { Attributes, Technique } from '../core/types';
import { averageAttributes, realmIndex } from '../core/utils';

export interface Capability { attack:number; defense:number; mobility:number; control:number; perception:number; endurance:number; recovery:number; }

export function capabilityFrom(attrs:Attributes, realm:string, qi:{capacity:number; quality:number; purity:number; control:number}, injuries=0, itemModifiers:Record<string,number>={}):Capability{
 const r=realmIndex(realm as any);
 const avg=averageAttributes(attrs);
 const injuryPenalty=Math.min(35, injuries*5);
 return {
  attack: attrs.luc_luong*1.2 + attrs.noi_luc*0.7 + r*7 + qi.quality*0.25 + (itemModifiers.attack??0) - injuryPenalty,
  defense: attrs.the_chat*0.9 + attrs.noi_luc*0.45 + attrs.tam_canh*0.5 + r*6 + (itemModifiers.armor??0) - injuryPenalty*0.7,
  mobility: attrs.than_phap*1.2 + attrs.cam_giac*0.35 + r*5 + (itemModifiers.mobility??0) - injuryPenalty*0.5,
  control: attrs.noi_luc*0.5 + attrs.tam_canh*0.7 + attrs.ngo_tinh*0.35 + qi.control*0.3,
  perception: attrs.cam_giac*1.1 + attrs.tam_canh*0.25,
  endurance: attrs.the_chat*1.1 + attrs.noi_luc*0.5 + avg*0.15,
  recovery: attrs.the_chat*0.45 + attrs.can_co*0.8 + attrs.noi_luc*0.35
 };
}

export function attackScore(cap:Capability, tech:Technique|undefined, mastery:number, timing:number, information:number, position:number){
 return cap.attack + (tech?tech.base_power*0.25:0) + mastery*0.22 + timing + information + position;
}
export function defenseScore(cap:Capability, response:string, counterBonus:number, timing:number, information:number, position:number){
 const base=response==='DODGE'?cap.mobility:response==='COUNTER'?cap.control+cap.defense*0.4:cap.defense;
 return base + counterBonus + timing + information + position;
}
export function damageValue(base:number, scaling:number, qiQuality:number, mastery:number, counterModifier:number, armor:number, injuryModifier:number, critical:number){
 return Math.max(1, Math.round((base+scaling+qiQuality*0.2+mastery*0.08)*counterModifier*critical*(1-armor/200)*(1-injuryModifier)));
}

export function sumItemModifiers(items: Array<{modifiers:Record<string,number>}>):Record<string,number>{ const out:Record<string,number>={}; for(const item of items) for(const [k,v] of Object.entries(item.modifiers)) out[k]=(out[k]??0)+Number(v||0); return out; }

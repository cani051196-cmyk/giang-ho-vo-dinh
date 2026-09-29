export interface EngineMetric{action_id:string;resolution_ms:number;state_changes_count:number;event_count:number;}
export interface AiMetric{request_id:string;scene_id:string;task_type:string;model?:string;latency_ms?:number;input_tokens?:number;output_tokens?:number;fallback_used?:string;status:string;}
const engineMetrics:EngineMetric[]=[]; const aiMetrics:AiMetric[]=[];
export function recordEngineMetric(m:EngineMetric){engineMetrics.push(m); if(engineMetrics.length>500) engineMetrics.shift();}
export function recordAiMetric(m:AiMetric){aiMetrics.push(m); if(aiMetrics.length>500) aiMetrics.shift();}
export function getMetrics(){return {engine:[...engineMetrics],ai:[...aiMetrics]};}

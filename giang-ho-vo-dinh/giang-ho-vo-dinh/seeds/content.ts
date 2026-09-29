import type { Attributes, Faction, Item, Location, MartialArt, NpcState, Quest, Technique, WorldEvent, WorldState, PlayerState, Relationship, KnowledgeRecord, Rumor } from '../src/lib/core/types';

const attrs=(seed:number):Attributes=>({the_chat:45+(seed%18),luc_luong:42+((seed*3)%20),than_phap:40+((seed*5)%22),noi_luc:38+((seed*7)%24),can_co:40+((seed*11)%21),ngo_tinh:42+((seed*13)%20),tam_canh:39+((seed*17)%23),cam_giac:41+((seed*19)%22)});
const qi=(seed:number)=>({capacity:120+seed*8,current:120+seed*8,quality:45+seed*3,purity:50+(seed%20),control:48+(seed%18),nature:[(['CANG','NHU','HAN','NHIET','DOC','HO_THE','TA_LUC','XUYEN_THAU'] as const)[seed%8]]});

const locations:Record<string,Location>={
 dawn_gate:{id:'dawn_gate',name:'Thanh Hà Trấn',region_id:'southern_jianghu',tags:['town','trade','safe'],connections:['mist_valley','jade_cliff'],base_travel_time:1800,danger_level:1,factions:['f_trade','f_righteous'],resources:['food','medicine'],services:['inn','market','healer'],population:2400},
 mist_valley:{id:'mist_valley',name:'Hàn Vụ Cốc',region_id:'southern_jianghu',tags:['wilderness','mist','herbs'],connections:['dawn_gate','jade_cliff'],base_travel_time:3000,danger_level:4,factions:['f_hidden'],resources:['herbs','ore'],services:['herbalist'],population:90},
 jade_cliff:{id:'jade_cliff',name:'Ngọc Bích Nhai',region_id:'southern_jianghu',tags:['cliff','ruins','danger'],connections:['dawn_gate','mist_valley'],base_travel_time:2400,danger_level:6,factions:['f_righteous','f_hidden'],resources:['ore','manual'],services:['ruin'],population:35}
};

const factions:Record<string,Faction>={
 f_righteous:{id:'f_righteous',name:'Minh Chính Môn',type:'sect',reputation:0,treasury:12000,resources:{food:500,iron:120}},
 f_trade:{id:'f_trade',name:'Vạn Lộ Thương Hội',type:'guild',reputation:0,treasury:50000,resources:{food:900,silk:400,medicine:120}},
 f_hidden:{id:'f_hidden',name:'Mặc Ảnh Các',type:'secret',reputation:-10,treasury:18000,resources:{poison:80,iron:200}}
};

const martialNames=['Thiết Sa Chưởng','Lưu Thủy Kiếm','Hàn Vụ Thân Pháp','Xuyên Tâm Chỉ','Minh Tâm Nội Công','Huyền Môn Khí Hải','Phi Yến Bộ','Trầm Sơn Côn','Vân Hải Đao','Tụ Lý Càn Khôn','Kim Cang Hộ Thể','Đoạt Mệnh Thủ','Phong Lôi Kiếm','Bạch Hạc Quyền','Tàng Phong Kiếm','Liên Hoàn Thương','Cửu Tiết Tiên','Ảnh Độn Thuật','Tịch Diệt Chưởng','Thanh Tâm Tĩnh Khí'];
const martialTypes=['PALM','SWORD','MOVEMENT','FIST','INTERNAL','INTERNAL','MOVEMENT','STAFF','SABER','HIDDEN_WEAPON','DEFENSE','FIST','SWORD','FIST','SWORD','SPEAR','CONTROL','MOVEMENT','PALM','INTERNAL'];
const martialArts:Record<string,MartialArt>={};
const techniques:Record<string,Technique>={};
for(let i=0;i<20;i++){
 const id=`ma_${String(i+1).padStart(2,'0')}`;
 const scaling:Partial<Record<keyof Attributes,number>>={luc_luong:i%3===0?.55:.25,noi_luc:.45,than_phap:i%3===1?.4:.18,tam_canh:i%5===0?.22:0,cam_giac:i%7===0?.25:0};
 const techs:string[]=[];
 for(let j=0;j<2;j++){
  const tid=`tech_${String(i*2+j+1).padStart(2,'0')}`; techs.push(tid);
  techniques[tid]={id:tid,martial_art_id:id,name:`${martialNames[i]} · ${j===0?'Thức Mở Sơn':'Thức Đoạt Ý'}`,order:j+1,base_power:18+i*2+j*5,scaling,qi_cost:10+i%4*2,stamina_cost:8+i%3,cooldown:j===0?0:3,accuracy:72+i%15,speed:45+i%18,range:1+(i%3),targeting:'single',effects:j===0?['pressure']:['bleed'],counter_profile:[martialTypes[i],i%2?'SLOW':'FAST'],injury_profile:{MINOR:.06,MODERATE:.04,SEVERE:.02,CRITICAL:.005},risk:j===1?.12:.04,requirements:[]};
 }
 martialArts[id]={id,name:martialNames[i],type:martialTypes[i],style:['CƯƠNG','NHU','BIẾN HÓA','TĨNH'][i%4],quality:40+i*2,origin:i%2?'giang_ho':'sơn_môn',realm_requirement:['Phàm Nhân','Luyện Thể','Luyện Khí','Thông Mạch','Ngưng Khí','Tiểu Thành'][Math.min(5,Math.floor(i/4))] as any,attribute_scaling:scaling,qi_requirements:{capacity:50+i*5},mastery:0,passives:i%3===0?['steady_flow']:[],technique_ids:techs,compatibility:[],synergy_tags:i%2?['mobility']:['pressure'],conflict_tags:[],counter_profile:[i%2?'FAST':'SLOW'],requirements:[]};
}

const items:Record<string,Item>={};
const itemNames=['Bánh Lương Khô','Thuốc Cầm Máu','Hoàn Dưỡng Khí','Bình Giải Độc','Áo Vải Thô','Hộ Tâm Giáp','Kiếm Gỗ','Kiếm Sắt','Đao Sắt','Côn Trúc','Thương Tre','Phi Tiêu','Mảnh Bản Đồ','Lá Cứu Mệnh','Hỏa Thạch','Bột Khinh Thân','Túi Hương','Dây Lụa','Ngọc Vụn','Sắt Tinh','Thiết Phiến','Ngân Châm','Kim Sang Dược','Túi Kim Châm','Đèn Dầu','Rượu Cũ','Trà Shan','Thảo Dược','Huyết Sâm','Linh Chi','Cỏ Tĩnh Tâm','Nấm Hàn Vụ','Khoáng Thạch','Thanh Ngọc','Bùa Hộ Mệnh','Lệnh Bài Thương Hội','Thẻ Khách Minh Chính','Mặt Nạ Mặc Ảnh','Mảnh Võ Phổ','Võ Phổ Tàn Quyển','Áo Choàng Du Hiệp','Găng Da','Giày Vải','Đai Lưng','Hộ Uyển','Bao Tay Tơ','Cẩm Nang Hành Tẩu','Túi Tiền','Thuốc Ngủ','Hồ Lô Nước','Kỳ Vật Cũ','Chìa Khóa Đồng','Ấn Tín Bí Mật'];
for(let i=0;i<itemNames.length;i++){
 const id=`item_${String(i+1).padStart(2,'0')}`;
 const cat=i<4?'MEDICINE':i<6?'ARMOR':i<17?'WEAPON':i<27?'MATERIAL':i%7===0?'MANUAL':i%5===0?'ARMOR':'SPECIAL';
 items[id]={id,name:itemNames[i],category:cat,quality:30+(i%40),rarity:i>45?'RARE':i>30?'UNCOMMON':'COMMON',region_id:'southern_jianghu',modifiers:cat==='MEDICINE'?{heal:12+(i%8)*5}:{armor:i%5===0?4:0,attack:i%9===0?3:0},quantity:i%6+1,unique:i>=47,owner_id:undefined};
}

const npcs:Record<string,NpcState>={};
const npcBase=[
 ['npc_lan','Lâm Vãn Sơn','chủ quán',['cẩn trọng','thực dụng'],'bảo vệ quán','mất mặt'],
 ['npc_yue','Yến Tử Yên','thương nhân',['thông minh','thẳng thắn'],'mở rộng tuyến hàng','bị lừa'],
 ['npc_qiu','Khưu Tử Mặc','lang y',['điềm tĩnh','từ bi'],'cứu người','không đủ thuốc'],
 ['npc_huo','Hoắc Kình','tiêu sư',['kỷ luật','nóng nảy'],'hộ tống hàng','thất bại'],
 ['npc_shen','Thẩm Thanh','đệ tử Minh Chính',['chính trực','cứng rắn'],'giữ luật môn','phản bội'],
 ['npc_bai','Bạch Linh','du hiệp',['hài hước','cảnh giác'],'tìm người mất tích','bị phục kích'],
 ['npc_mo','Mặc Tâm','đại diện Mặc Ảnh',['lạnh lùng','thận trọng'],'thu hồi vật thất lạc','bị lộ thân phận'],
 ['npc_ruan','Ruan Vũ','thợ rèn',['kiên nhẫn','tham công'],'rèn vũ khí','thiếu quặng'],
 ['npc_tang','Tăng Phúc','nông phu',['chất phác','sợ hãi'],'nuôi gia đình','đói mùa'],
 ['npc_jia','Giả Nghi','kẻ buôn tin',['tò mò','xảo quyệt'],'bán tin có lợi','bị phát hiện'],
 ['npc_xiao','Tiểu Tịch','đứa trẻ lang thang',['gan lì','lanh lợi'],'tìm người thân','bị bắt'],
 ['npc_he','Hạ Vân','ẩn sĩ ở cốc',['ít nói','sâu sắc'],'giữ bí mật','người lạ xâm nhập']
] as const;
for(let i=0;i<npcBase.length;i++){
 const [id,name,title,personality,goal,fear]=npcBase[i];
 const a=attrs(i+1); npcs[id]={id,name,title,personality:[...personality],goals:[goal],fears:[fear],secrets:[i%3===0?'từng dùng tên giả':'biết một lối đi bí mật'],faction_id:i%4===0?'f_righteous':i%4===1?'f_trade':i%4===2?'f_hidden':undefined,location_id:i<7?'dawn_gate':i<10?'mist_valley':'jade_cliff',health:100+i*8,max_health:100+i*8,qi:qi(i+1),attributes:a,realm:(['Luyện Thể','Luyện Khí','Thông Mạch','Ngưng Khí','Tiểu Thành'][i%5]) as any,martial_art_ids:[`ma_${String((i%20)+1).padStart(2,'0')}`],equipment_ids:[`item_${String((i%17)+1).padStart(2,'0')}`],resources:{money:100+i*75},knowledge_ids:[],memory_ids:[],relationship_ids:[],reputation:0,schedule:[{time_minute:480,activity:'training'},{time_minute:720,activity:'work'},{time_minute:1080,activity:'social'},{time_minute:1320,activity:'rest'}],status:[],alive:true,cooldowns:{}};
}

const playerInventoryIds=['item_01','item_02','item_03','item_08','item_19','item_33'];
for(const npc of Object.values(npcs)){
 const baseId=npc.equipment_ids[0]; const base=items[baseId];
 if(base){ const cloneId=`${npc.id}_eq_01`; items[cloneId]={...structuredClone(base),id:cloneId,name:`${base.name} của ${npc.name}`,quantity:1,unique:false,owner_id:npc.id}; npc.equipment_ids=[cloneId]; }
}
for(const item of Object.values(items)){
 if(playerInventoryIds.includes(item.id)) item.owner_id='player_001';
 else if(!item.owner_id && !item.unique) item.owner_id='npc_yue';
}

const relationships:Record<string,Relationship>={};
const knowledge:Record<string,KnowledgeRecord>={};
for(const id of Object.keys(npcs)) relationships[`rel_player_${id}`]={actor_id:'player_001',target_id:id,trust:0,respect:0,fear:0,hatred:0,debt:0,affection:0,suspicion:0};
const rumors:Record<string,Rumor>={
 rumor_1:{id:'rumor_1',content_claim:'Đêm mưa sẽ có người lạ xuất hiện ở Hàn Vụ Cốc.',truth_source:'event_1',distortion_level:.15,confidence:.65,origin_location:'dawn_gate',origin_actor:'npc_jia',spread_rate:.4}
};

const quest=(id:string,name:string,description:string):Quest=>({id,name,description,state:'AVAILABLE',objectives:[{id:`${id}_o1`,description:'Hoàn thành mục tiêu đầu tiên',progress:0,target:1}],conditions:[],participants:[],rewards:['+30 bạc','+3 danh vọng'],fail_conditions:[],consequences:[],branches:[]});
const quests:Record<string,Quest>={q_trade:quest('q_trade','Chuyến hàng trước mưa','Giúp Yến Tử Yên đưa một kiện hàng tới Hàn Vụ Cốc.'),q_medicine:quest('q_medicine','Thuốc cho người bị thương','Tìm đủ thảo dược cho Khưu Tử Mặc.'),q_missing:quest('q_missing','Dấu chân trên vách đá','Điều tra dấu vết ở Ngọc Bích Nhai.'),q_rumor:quest('q_rumor','Kẻ gieo lời đồn','Truy nguồn một lời đồn đang lan nhanh.'),q_secret:quest('q_secret','Bóng trong sương','Gặp người giữ bí mật trong Hàn Vụ Cốc.'),q_escort:quest('q_escort','Tiêu cục Thanh Hà','Hộ tống Hoắc Kình qua tuyến nguy hiểm.')};
quests.q_trade.participants=['npc_yue']; quests.q_trade.deadline=86400*2; quests.q_medicine.participants=['npc_qiu']; quests.q_medicine.deadline=86400*3; quests.q_missing.participants=['npc_bai']; quests.q_missing.deadline=86400*4; quests.q_rumor.participants=['npc_jia']; quests.q_rumor.deadline=86400*3; quests.q_secret.participants=['npc_he']; quests.q_secret.deadline=86400*5; quests.q_escort.participants=['npc_huo']; quests.q_escort.deadline=86400;

const events:WorldEvent[]=[
 {id:'event_1',trigger:'time_advance',conditions:['rain','evening'],participants:['npc_jia','npc_mo'],priority:5,cooldown:3600,outcomes:['rumor_spawn'],consequences:['market_shift'],visibility:'PUBLIC'},
 {id:'event_2',trigger:'player_enters',conditions:['jade_cliff','night'],participants:['npc_mo'],priority:8,cooldown:7200,outcomes:['secret_meeting'],consequences:['knowledge_change'],visibility:'HIDDEN'},
 {id:'event_3',trigger:'npc_schedule',conditions:['npc_lan','low_food'],participants:['npc_lan'],priority:3,cooldown:14400,outcomes:['food_price_up'],consequences:['trade_shift'],visibility:'PUBLIC'},
 {id:'event_4',trigger:'quest_progress',conditions:['q_missing_done'],participants:['npc_bai'],priority:6,cooldown:86400,outcomes:['ambush'],consequences:['relationship_shift'],visibility:'PUBLIC'},
 {id:'event_5',trigger:'time_advance',conditions:['day_change'],participants:['npc_xiao'],priority:2,cooldown:86400,outcomes:['wander'],consequences:['npc_move'],visibility:'PUBLIC'}
];

const player:PlayerState={id:'player_001',name:'Vô Danh',location_id:'dawn_gate',attributes:{the_chat:50,luc_luong:48,than_phap:47,noi_luc:45,can_co:52,ngo_tinh:50,tam_canh:46,cam_giac:49},realm:'Luyện Thể',qi:{capacity:180,current:180,quality:55,purity:60,control:52,nature:['CANG','NHU']},meridian:{health:100,capacity_modifier:0,flow_modifier:0,damage:0},hp:150,max_hp:150,stamina:100,max_stamina:100,injuries:[],inventory_ids:['item_01','item_02','item_03','item_08','item_19','item_33'],martial_art_ids:['ma_01','ma_05','ma_07'],mastery:{ma_01:10,ma_05:5,ma_07:8,tech_01:10,tech_09:5},equipment_ids:['item_08'],faction_ids:[],money:280,reputation:0,knowledge_ids:[],memory_ids:[],active_quests:[],completed_quests:[],status:[],alive:true,cooldowns:{}};

export function createSeedSnapshot():{player:PlayerState;world:WorldState}{
 return structuredClone({player,world:{world_id:'world_south_01',world_time:0,calendar:{year:1,month:1,day:1},regions:{southern_jianghu:{id:'southern_jianghu',name:'Nam Giang Hồ',tags:['wuxia','frontier']}},locations,npcs,factions,relationships,reputations:{global:0},knowledge,rumors,memories:{},quests,events,items,martial_arts:martialArts,techniques,market_state:{supply:Object.fromEntries(Object.values(items).map(i=>[i.id,20])),demand:{},base_price:Object.fromEntries(Object.values(items).map(i=>[i.id,10+i.quality]))},weather_state:'CLEAR',global_flags:{character_created:false},scheduled_events:[],event_log:[]}});
}

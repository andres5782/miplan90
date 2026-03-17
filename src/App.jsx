import { useState, useMemo, useEffect } from "react";

const T = {
  bg:"#ffffff",bg2:"#f2f2f7",bg3:"#e5e5ea",
  text:"#1c1c1e",text2:"#3a3a3c",text3:"#8e8e93",
  acc:"#007aff",green:"#34c759",red:"#ff3b30",orange:"#ff9500",purple:"#af52de",
};

const SB_URL = "https://tgtequfxljhehivdncen.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndGVxdWZ4bGpoZWhpdmRuY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzM5MzksImV4cCI6MjA4ODQ0OTkzOX0.AIZZQA5lbXbPswb7g-Esu0MC4Vtfy_mRzkbzG5T-lpA";
const SB_H = {"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`};
async function sbLoad(){try{const r=await fetch(`${SB_URL}/rest/v1/user_data?id=eq.main`,{headers:SB_H});const d=await r.json();return d?.[0]||null;}catch{return null;}}
async function sbSave(p){try{await fetch(`${SB_URL}/rest/v1/user_data?id=eq.main`,{method:"PATCH",headers:{...SB_H,"Prefer":"return=minimal"},body:JSON.stringify({...p,updated_at:new Date().toISOString()})});}catch{}}
const L={get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};

// ── Detect protein from free text via Claude API ──────────────────────────────
async function detectProtein(text) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{ role: "user", content: `Analiza este texto de comida y responde SOLO con una de estas palabras: pollo, salmon, salmonahumado, ternera, huevos, jamon, cerdo, otro, libre. Texto: "${text}"` }],
      }),
    });
    const d = await r.json();
    const result = d?.content?.[0]?.text?.trim().toLowerCase();
    const valid = ["pollo","salmon","salmonahumado","ternera","huevos","jamon","cerdo","otro","libre"];
    return valid.includes(result) ? result : "otro";
  } catch { return "otro"; }
}

const TRAININGS = [
  {id:1,label:"Training 1",emoji:"💪",color:"#ff9500"},
  {id:2,label:"Training 2",emoji:"🏋️",color:"#007aff"},
  {id:3,label:"Training 3",emoji:"🦵",color:"#34c759"},
  {id:4,label:"Training 4",emoji:"🔥",color:"#ff3b30"},
];
const MONTHS=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_H=["L","M","X","J","V","S","D"];
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const TK=dateKey(TODAY);
const isMonday=TODAY.getDay()===1;

// ── MEALS — updated menu, libre only Sunday ───────────────────────────────────
const MEALS = {
  D:[
    {id:"d1",label:"Huevos revueltos",  desc:"3 huevos + tostada integral + fruta",           protein:"huevos"},
    {id:"d2",label:"Smoothie proteico", desc:"Leche almendras + frutos rojos + Belvels",       protein:"otro"},
    {id:"d3",label:"Tortilla francesa", desc:"2-3 huevos + aguacate + tostada",                protein:"huevos"},
    {id:"d4",label:"Skyr + fruta",      desc:"Yogur Skyr sin lactosa + frutos rojos + nueces", protein:"otro"},
    {id:"d5",label:"🎉 Libre",          desc:"Come lo que quieras, sin culpa",                 protein:"libre"},
  ],
  C:[
    {id:"c1",label:"Pollo al wok",              desc:"Pechuga + arroz integral + brócoli",               protein:"pollo",   freeze:true},
    {id:"c2",label:"Salmón al horno",           desc:"Salmón fresco + boniato + espinacas salteadas",    protein:"salmon",  freeze:true},
    {id:"c3",label:"Ternera a la plancha",      desc:"Ternera + patata al horno + ensalada grande",      protein:"ternera", freeze:true},
    {id:"c4",label:"Contramuslos al horno",     desc:"Pollo + boniato + judías verdes",                  protein:"pollo",   freeze:true},
    {id:"c5",label:"Pollo al horno + pasta",    desc:"Pollo + pasta integral + calabacín",               protein:"pollo",   freeze:true},
    {id:"c6",label:"Lomo de cerdo",             desc:"Lomo cerdo + patata + pimientos asados",           protein:"cerdo",   freeze:true},
    {id:"c7",label:"Salmón al horno",           desc:"Salmón fresco + arroz integral + ensalada",        protein:"salmon",  freeze:true},
    {id:"c8",label:"🎉 Libre / fuera",          desc:"Come fuera o improvisa",                           protein:"libre"},
  ],
  N:[
    {id:"n1",label:"Crema de verduras + huevos",desc:"Crema Thermomix + 2 huevos + tostada",             protein:"huevos"},
    {id:"n2",label:"Tortilla + ensalada",       desc:"Tortilla 2 huevos + ensalada grande",              protein:"huevos"},
    {id:"n3",label:"Jamón ibérico + queso",     desc:"Jamón ibérico + burrata/feta + tomate + pan",      protein:"jamon"},
    {id:"n4",label:"Salmón ahumado",            desc:"Salmón ahumado + aguacate + biscotes",             protein:"salmonahumado"},
    {id:"n5",label:"Garbanzos + espinacas",     desc:"Garbanzos + espinacas + huevo pochado",            protein:"otro"},
    {id:"n6",label:"Ternera picada + quinoa",   desc:"Ternera picada + quinoa + verduras salteadas",     protein:"ternera"},
    {id:"n7",label:"Lomo cerdo + verduras",     desc:"Lomo de cerdo + verduras asadas",                  protein:"cerdo"},
    {id:"n8",label:"🎉 Libre / fuera",          desc:"Come fuera o improvisa",                           protein:"libre"},
  ],
};

const PROTEIN_META = {
  pollo:         {label:"Pollo",          emoji:"🍗",color:"#ff9500",max:3},
  salmon:        {label:"Salmón fresco",  emoji:"🐟",color:"#007aff",max:2},
  salmonahumado: {label:"Salmón ahumado", emoji:"🫙",color:"#5ac8fa",max:1},
  ternera:       {label:"Ternera",        emoji:"🥩",color:"#ff3b30",max:2},
  huevos:        {label:"Huevos",         emoji:"🥚",color:"#ffcc00",max:null},
  jamon:         {label:"Jamón ibérico",  emoji:"🍖",color:"#ff6b6b",max:3},
  cerdo:         {label:"Cerdo",          emoji:"🐷",color:"#f472b6",max:1},
};

// Updated default plan — libre only Sunday dinner
const DEFAULT_PLAN = [
  {D:"d2",C:"c1",N:"n1"},  // Lunes
  {D:"d1",C:"c2",N:"n3"},  // Martes
  {D:"d3",C:"c3",N:"n2"},  // Miércoles
  {D:"d4",C:"c4",N:"n5"},  // Jueves
  {D:"d1",C:"c5",N:"n4"},  // Viernes
  {D:"d2",C:"c6",N:"n6"},  // Sábado
  {D:"d4",C:"c7",N:"n8"},  // Domingo (único libre)
];

const SHOPPING = {
  "🥩 Proteína":["Pechuga de pollo (800g)","Salmón fresco (2 filetes)","Ternera magra (400g)","Ternera picada (300g)","Lomo de cerdo (300g)","Salmón ahumado (1 paquete)","Jamón ibérico (100g)","Huevos (docena)","Yogur Skyr sin lactosa (x2)","Garbanzos cocidos (bote)"],
  "🥦 Verduras": ["Bolsa ensalada mixta","Tomates (500g)","Calabacín (2)","Puerro (2)","Brócoli (1)","Espinacas (bolsa)","Judías verdes (300g)","Pimientos (3)","Aguacates (3)"],
  "🌾 Carbos":   ["Arroz integral","Boniato (4 unidades)","Patatas (4)","Pasta integral","Quinoa","Pan integral","Biscotes integrales"],
  "🍓 Fruta":    ["Plátanos (4)","Manzanas (4)","Arándanos/fresas congelados","Naranjas o kiwis (4)"],
  "🥜 Extras":   ["Nueces / almendras (bolsa)","Mantequilla almendras sin azúcar","Aceite oliva virgen extra","Queso feta / burrata","Leche almendras sin azúcar","Chocolate negro +85%"],
};

const SNACKS=[
  {when:"Cualquier momento",   icon:"🥜",name:"Puñado de nueces",    desc:"~15 nueces o 20 almendras. Grasa buena, aguanta el hambre real."},
  {when:"Con hambre de verdad",icon:"🍗",name:"Jamón ibérico",       desc:"2-3 lonchas. Proteína inmediata, sin cocinar nada."},
  {when:"Algo dulce",          icon:"🍫",name:"Chocolate negro 85%", desc:"1-2 cuadrados + nueces. Satisface sin disparar glucosa."},
  {when:"En casa, 5 min",      icon:"🥛",name:"Skyr con fruta",      desc:"Bol mediano de Skyr + arándanos. Proteína + dulce natural."},
  {when:"Algo salado",         icon:"🧀",name:"Queso + biscotes",    desc:"Un trozo Maasdam (tamaño pulgar) + 2 biscotes integrales."},
  {when:"Sin hambre real",     icon:"💧",name:"Agua o té primero",   desc:"Espera 10 min. A veces es ansiedad, no hambre."},
];
const PORTIONS=[
  {food:"Carne o pollo",        emoji:"🍗",rule:"Palma de la mano",   grams:"~150g",    desc:"El tamaño y grosor de tu palma, sin los dedos.",             visual:"palm"},
  {food:"Salmón",               emoji:"🐟",rule:"Palma de la mano",   grams:"~150g",    desc:"Mismo criterio. Si es fino, puede ser algo más.",            visual:"palm"},
  {food:"Arroz / pasta cocidos",emoji:"🍚",rule:"Puño cerrado",       grams:"~120g",    desc:"Un puño de arroz ya cocido por comida. No dos.",             visual:"fist"},
  {food:"Boniato / patata",     emoji:"🍠",rule:"Puño cerrado",       grams:"~150g",    desc:"Uno mediano o un puño de trozos cocidos.",                   visual:"fist"},
  {food:"Aguacate",             emoji:"🥑",rule:"Medio o uno entero", grams:"~80-160g", desc:"Medio si hay otras grasas. Uno si no hay aceite ni nueces.", visual:"half"},
  {food:"Nueces / almendras",   emoji:"🥜",rule:"Puñado cerrado",     grams:"~25-30g",  desc:"Lo que cabe en la palma con dedos cerrados. No del bol.",    visual:"handful"},
  {food:"Aceite de oliva",      emoji:"🫒",rule:"2 cucharadas",       grams:"~20ml",    desc:"Para cocinar o aliñar. Con conciencia, no a chorro.",        visual:"spoon"},
  {food:"Verduras",             emoji:"🥦",rule:"Sin límite",         grams:"∞",        desc:"Come todo lo que quieras. Cuantas más, mejor.",              visual:"free"},
];

function PortionVisual({type,color}){
  const row={display:"flex",alignItems:"center",justifyContent:"center",gap:16,margin:"12px 0"};
  const lbl={fontSize:9,color:T.text3,textAlign:"center",marginTop:4,fontWeight:700,letterSpacing:1};
  if(type==="palm")return(<div style={row}><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66"><ellipse cx="28" cy="47" rx="20" ry="17" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="16" y="12" width="7" height="26" rx="3.5" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="25" y="8" width="7" height="30" rx="3.5" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="34" y="10" width="7" height="28" rx="3.5" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="8" y="20" width="6" height="20" rx="3" fill={color+"22"} stroke={color} strokeWidth="1.5"/></svg><div style={lbl}>TU PALMA</div></div><div style={{fontSize:20,color:T.text3}}>≈</div><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66"><rect x="6" y="14" width="44" height="40" rx="8" fill={color+"18"} stroke={color} strokeWidth="1.5"/></svg><div style={lbl}>RACIÓN</div></div></div>);
  if(type==="fist")return(<div style={row}><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66"><ellipse cx="28" cy="42" rx="19" ry="20" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="17" y="20" width="7" height="17" rx="3.5" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="26" y="18" width="7" height="17" rx="3.5" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="35" y="20" width="7" height="17" rx="3.5" fill={color+"22"} stroke={color} strokeWidth="1.5"/></svg><div style={lbl}>PUÑO</div></div><div style={{fontSize:20,color:T.text3}}>≈</div><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66"><ellipse cx="28" cy="40" rx="20" ry="16" fill={color+"18"} stroke={color} strokeWidth="1.5"/>{[0,1,2,3,4].map(i=><ellipse key={i} cx={12+i*8} cy={40} rx="2.5" ry="2" fill={color} opacity="0.5"/>)}</svg><div style={lbl}>RACIÓN</div></div></div>);
  if(type==="half")return(<div style={row}><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66"><ellipse cx="28" cy="36" rx="17" ry="24" fill={color+"22"} stroke={color} strokeWidth="1.5"/><line x1="11" y1="36" x2="45" y2="36" stroke={color} strokeWidth="2" strokeDasharray="4,2"/><text x="28" y="52" textAnchor="middle" fill={color} fontSize="11" fontWeight="700">½</text></svg><div style={lbl}>MÁXIMO</div></div><div style={{fontSize:20,color:T.text3}}>→</div><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66"><ellipse cx="28" cy="36" rx="17" ry="24" fill={color+"18"} stroke={color} strokeWidth="1.5"/><text x="28" y="38" textAnchor="middle" fill={color} fontSize="9" fontWeight="700">1 si no hay</text><text x="28" y="50" textAnchor="middle" fill={color} fontSize="9" fontWeight="700">más grasas</text></svg><div style={lbl}>REGLA</div></div></div>);
  if(type==="handful")return(<div style={row}><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66"><ellipse cx="28" cy="48" rx="20" ry="13" fill={color+"22"} stroke={color} strokeWidth="1.5"/>{[0,1,2,3,4].map(i=><ellipse key={i} cx={12+i*9} cy={46} rx="3.5" ry="5" fill={color} opacity="0.5"/>)}</svg><div style={lbl}>PUÑADO</div></div><div style={{fontSize:20,color:T.text3}}>≈</div><div style={{textAlign:"center"}}><svg width="56" height="66" viewBox="0 0 56 66">{[...Array(12)].map((_,i)=><ellipse key={i} cx={14+(i%4)*10} cy={24+Math.floor(i/4)*14} rx="4" ry="5.5" fill={color} opacity="0.45"/>)}</svg><div style={lbl}>~15 UNIDADES</div></div></div>);
  if(type==="spoon")return(<div style={row}>{[1,2].map(n=>(<div key={n} style={{textAlign:"center"}}><svg width="40" height="66" viewBox="0 0 40 66"><ellipse cx="20" cy="18" rx="13" ry="15" fill={color+"22"} stroke={color} strokeWidth="1.5"/><rect x="17" y="32" width="6" height="26" rx="3" fill={color+"22"} stroke={color} strokeWidth="1.5"/></svg><div style={lbl}>CUCHARA {n}</div></div>))}</div>);
  return(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:36,color}}>∞</div><div style={{fontSize:12,color,fontWeight:700,marginTop:4}}>SIN LÍMITE</div></div>);
}

export default function App(){
  const [section,setSection]   = useState("home");
  const [foodTab,setFoodTab]   = useState("week");
  const [trainTab,setTrainTab] = useState("calendar");
  const [loaded,setLoaded]     = useState(false);

  const [plan,setPlan]             = useState(DEFAULT_PLAN);
  const [shopDone,setShopDone]     = useState({});
  const [shopCat,setShopCat]       = useState(Object.keys(SHOPPING)[0]);
  const [openPortion,setOpenPortion] = useState(null);
  const [editingMeal,setEditingMeal] = useState(null);
  const [openDay,setOpenDay]       = useState(null);
  // Free text meal state: { dayIdx, meal, text, detecting }
  const [freeText,setFreeText]     = useState(null);

  const [sessions,setSessions]         = useState({});
  const [measurements,setMeasurements] = useState({});
  const [activeDay,setActiveDay]       = useState(null);
  const [draft,setDraft]               = useState(null);
  const [viewMonth,setViewMonth]       = useState({y:TODAY.getFullYear(),m:TODAY.getMonth()});
  const [measOpen,setMeasOpen]         = useState(false);
  const [measInput,setMeasInput]       = useState({weight:"",waist:""});

  const [checkinOpen,setCheckinOpen]   = useState(false);
  const [checkins,setCheckins]         = useState({});
  const [checkinDraft,setCheckinDraft] = useState({physical:0,anxiety:0,training:0,note:""});

  useEffect(()=>{
    sbLoad().then(data=>{
      if(data){
        if(data.sessions)     setSessions(data.sessions);
        if(data.measurements) setMeasurements(data.measurements);
        if(data.checkins)     setCheckins(data.checkins);
        if(data.plan?.length) setPlan(data.plan);
        if(data.shop_done)    setShopDone(data.shop_done);
      } else {
        setSessions(L.get("sessions",{}));setMeasurements(L.get("measurements",{}));
        setCheckins(L.get("checkins",{}));setPlan(L.get("plan",DEFAULT_PLAN));setShopDone(L.get("shopDone",{}));
      }
      setLoaded(true);
    });
  },[]);

  const pS=s=>{setSessions(s);    L.set("sessions",s);    sbSave({sessions:s});};
  const pP=p=>{setPlan(p);        L.set("plan",p);        sbSave({plan:p});};
  const pM=m=>{setMeasurements(m);L.set("measurements",m);sbSave({measurements:m});};
  const pC=c=>{setCheckins(c);    L.set("checkins",c);    sbSave({checkins:c});};
  const pSh=s=>{setShopDone(s);   L.set("shopDone",s);    sbSave({shop_done:s});};

  const todayIdx  = TODAY.getDay()===0?6:TODAY.getDay()-1;
  const todayMeals = plan[todayIdx];
  const tomorrowIdx = (todayIdx+1)%7;

  // ── Training logic: if trained today → show tomorrow's next, else today's ──
  const lastTId = useMemo(()=>{
    const ks=Object.keys(sessions).sort().reverse();
    for(const k of ks) if(sessions[k].trainingId) return sessions[k].trainingId;
    return null;
  },[sessions]);
  const nextTId   = lastTId?(lastTId%4)+1:1;
  const nextT     = TRAININGS[nextTId-1];
  const trainedToday = !!sessions[TK]?.trainingId;
  const trainLabel   = trainedToday ? "Mañana toca" : "Hoy toca";

  const {weekSessions,yogaWeek}=useMemo(()=>{
    const dow=TODAY.getDay()===0?6:TODAY.getDay()-1;const mon=new Date(TODAY);mon.setDate(TODAY.getDate()-dow);
    let ws=0,yw=0;for(let i=0;i<7;i++){const dd=new Date(mon);dd.setDate(mon.getDate()+i);const k=dateKey(dd);if(sessions[k]?.trainingId)ws++;if(sessions[k]?.yoga)yw++;}return{weekSessions:ws,yogaWeek:yw};
  },[sessions]);

  const totalSessions=Object.values(sessions).filter(s=>s.trainingId).length;

  const daysSinceTraining=useMemo(()=>{
    const ks=Object.keys(sessions).filter(k=>sessions[k].trainingId).sort().reverse();if(!ks.length)return 999;
    const p=ks[0].split("-");return Math.floor((TODAY-new Date(+p[0],+p[1],+p[2]))/86400000);
  },[sessions]);

  const proteinCounts=useMemo(()=>{
    const c={};
    plan.forEach(day=>{["C","N"].forEach(meal=>{
      const entry=day[meal];
      if(entry&&typeof entry==="object"&&entry.protein){
        // free text entry
        const p=entry.protein;if(p&&p!=="libre"&&p!=="otro")c[p]=(c[p]||0)+1;
      } else {
        const m=MEALS[meal]?.find(x=>x.id===entry);const p=m?.protein;
        if(p&&p!=="libre"&&p!=="otro"&&p!=="huevos")c[p]=(c[p]||0)+1;
      }
    });});
    return c;
  },[plan]);

  const tomorrowMeals=useMemo(()=>{
    return["C","N"].map(meal=>{
      const entry=plan[tomorrowIdx]?.[meal];
      if(entry&&typeof entry==="object")return null;
      const m=MEALS[meal]?.find(x=>x.id===entry);return m?.freeze?m:null;
    }).filter(Boolean);
  },[plan,tomorrowIdx]);

  const thisWeekCheckin=useMemo(()=>{
    const dow=TODAY.getDay()===0?6:TODAY.getDay()-1;const mon=new Date(TODAY);mon.setDate(TODAY.getDate()-dow);return checkins[dateKey(mon)];
  },[checkins]);

  const saveCheckin=()=>{
    const dow=TODAY.getDay()===0?6:TODAY.getDay()-1;const mon=new Date(TODAY);mon.setDate(TODAY.getDate()-dow);
    pC({...checkins,[dateKey(mon)]:{...checkinDraft,date:TODAY.toLocaleDateString("es-ES")}});setCheckinOpen(false);
  };

  const getDays=(y,m)=>({first:(new Date(y,m,1).getDay()||7)-1,total:new Date(y,m+1,0).getDate()});
  const {first,total}=getDays(viewMonth.y,viewMonth.m);

  const openDayModal=(y,m,d)=>{const date=new Date(y,m,d);if(date>TODAY)return;const k=dateKey(date);setActiveDay(k);setDraft(sessions[k]?{...sessions[k]}:{trainingId:null,note:"",yoga:false});};
  const saveDraft=()=>{const u={...sessions};if(!draft.trainingId&&!draft.yoga&&!draft.note)delete u[activeDay];else u[activeDay]=draft;pS(u);setActiveDay(null);setDraft(null);};
  const saveMeas=()=>{pM({...measurements,[TK]:{...measInput,date:TODAY.toLocaleDateString("es-ES")}});setMeasInput({weight:"",waist:""});setMeasOpen(false);};
  const measHistory=useMemo(()=>Object.entries(measurements).map(([k,v])=>({key:k,...v})).sort((a,b)=>a.key.localeCompare(b.key)),[measurements]);

  // ── Free text meal save ───────────────────────────────────────────────────
  const saveFreeText = async () => {
    if(!freeText?.text?.trim()) return;
    setFreeText(f=>({...f,detecting:true}));
    const protein = await detectProtein(freeText.text);
    const entry = { custom: true, label: freeText.text, desc: "Comida personalizada", protein };
    const newPlan = plan.map((d,i)=>i===freeText.dayIdx?{...d,[freeText.meal]:entry}:d);
    pP(newPlan);
    setFreeText(null);
    setEditingMeal(null);
  };

  // ── Helper: resolve meal entry (id string or custom object) ───────────────
  const resolveMeal = (entry, mealType) => {
    if(!entry) return null;
    if(typeof entry==="object") return entry;
    return MEALS[mealType]?.find(x=>x.id===entry)||null;
  };

  const card=(x={})=>({background:T.bg,border:`1px solid ${T.bg3}`,borderRadius:16,overflow:"hidden",...x});
  const sec=(t)=><div style={{fontSize:11,fontWeight:700,color:T.text3,marginBottom:8,marginTop:4,paddingLeft:2,letterSpacing:0.3}}>{t}</div>;
  const modal=(children,onClose)=>(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.bg,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:500,padding:20,paddingBottom:44,maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:T.bg3,borderRadius:100,margin:"0 auto 18px"}}/>
        {children}
      </div>
    </div>
  );

  if(!loaded)return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14}}>
      <style>{`*{box-sizing:border-box;}`}</style>
      <div style={{fontSize:52}}>💪</div>
      <div style={{fontSize:16,fontWeight:600,color:T.text3}}>Cargando tu plan...</div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg2,color:T.text,fontFamily:"-apple-system,'Helvetica Neue',sans-serif",maxWidth:500,margin:"0 auto"}}>
      <style>{`*{box-sizing:border-box;}textarea,input{outline:none;font-family:inherit;}`}</style>

      {/* ════════════════════ HOME ══════════════════════════════════════════ */}
      {section==="home"&&(<>
        <div style={{background:T.bg,borderBottom:`1px solid ${T.bg3}`,padding:"56px 20px 16px"}}>
          <div style={{fontSize:28,fontWeight:800,letterSpacing:-0.5}}>Mi Plan 90 Días</div>
          <div style={{fontSize:13,color:T.text3,marginTop:3}}>{TODAY.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        <div style={{padding:"14px 14px 90px"}}>

          {daysSinceTraining>=4&&(
            <div style={{background:"#fff2f2",border:`1px solid ${T.red}28`,borderRadius:14,padding:"12px 14px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
              <div style={{fontSize:20}}>⚠️</div>
              <div><div style={{fontSize:13,fontWeight:700,color:T.red}}>Llevas {daysSinceTraining} días sin entrenar</div>
              <div style={{fontSize:12,color:T.text2,marginTop:3}}>No hay que recuperar nada. Haz {nextT.label} hoy.</div></div>
            </div>
          )}
          {isMonday&&(
            <div style={{background:"#fff8ec",border:`1px solid ${T.orange}28`,borderRadius:14,padding:"12px 14px",display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:20}}>📸</div>
              <div><div style={{fontSize:13,fontWeight:700,color:T.orange}}>Es lunes — hazte las fotos</div>
              <div style={{fontSize:11,color:T.text3,marginTop:2}}>Frontal · Lateral derecho · Lateral izquierdo</div></div>
            </div>
          )}

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
            {[
              {val:`${weekSessions}/4`,label:"Esta semana",color:weekSessions>=4?T.green:weekSessions>=2?T.orange:T.red},
              {val:totalSessions,      label:"Total",      color:T.acc},
              {val:yogaWeek,           label:"Yoga",       color:T.purple},
            ].map(s=>(
              <div key={s.label} style={{...card({padding:"14px 10px",textAlign:"center",borderRadius:14})}}>
                <div style={{fontSize:26,fontWeight:800,color:s.color,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:10,color:T.text3,fontWeight:600,marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Hoy toca — clickable shortcut to training */}
          <button onClick={()=>setSection("training")} style={{...card({padding:16,marginBottom:10,background:`linear-gradient(135deg,${nextT.color}10,${T.bg})`,border:`1px solid ${nextT.color}28`,width:"100%",textAlign:"left",cursor:"pointer",color:"inherit"})}}>
            <div style={{fontSize:11,fontWeight:700,color:nextT.color,letterSpacing:0.3,marginBottom:8}}>{trainLabel.toUpperCase()} <span style={{fontSize:10,color:T.text3,fontWeight:400,marginLeft:4}}>· toca para registrar →</span></div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:34,width:50,height:50,background:nextT.color+"15",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{nextT.emoji}</div>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:nextT.color}}>{nextT.label}</div>
                <div style={{fontSize:12,color:T.text3,marginTop:2}}>Gym Monster · ~55 min</div>
              </div>
            </div>
          </button>

          {/* Hoy comes — clickable shortcut to food */}
          <button onClick={()=>{setSection("food");setFoodTab("week");setOpenDay(todayIdx);}} style={{...card({padding:16,marginBottom:10,width:"100%",textAlign:"left",cursor:"pointer",color:"inherit"})}}>
            <div style={{fontSize:11,fontWeight:700,color:T.green,letterSpacing:0.3,marginBottom:12}}>HOY COMES <span style={{fontSize:10,color:T.text3,fontWeight:400,marginLeft:4}}>· toca para editar →</span></div>
            {["D","C","N"].map(meal=>{
              const icons={D:"🌅",C:"☀️",N:"🌙"};
              const labels={D:"Desayuno",C:"Comida",N:"Cena"};
              const m=resolveMeal(todayMeals?.[meal],meal);
              const isLibre=m?.protein==="libre";
              const isCustom=m?.custom;
              return(
                <div key={meal} style={{display:"flex",alignItems:"center",gap:10,paddingBottom:meal!=="N"?12:0,marginBottom:meal!=="N"?12:0,borderBottom:meal!=="N"?`1px solid ${T.bg3}`:"none"}}>
                  <div style={{width:36,height:36,background:T.bg2,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icons[meal]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,color:T.text3,fontWeight:600,marginBottom:1}}>{labels[meal]}</div>
                    <div style={{fontSize:13,fontWeight:700,color:isLibre?T.purple:isCustom?T.acc:T.text}}>{m?.label||"—"}</div>
                    <div style={{fontSize:11,color:T.text3,marginTop:1}}>{m?.desc}</div>
                  </div>
                </div>
              );
            })}
          </button>

          {/* Defrost — clickable shortcut to tomorrow's menu */}
          {tomorrowMeals.length>0&&(
            <button onClick={()=>{setSection("food");setFoodTab("week");setOpenDay(tomorrowIdx);}} style={{background:"#f0f6ff",border:`1px solid ${T.acc}25`,borderRadius:14,padding:"12px 14px",marginBottom:10,width:"100%",textAlign:"left",cursor:"pointer",color:"inherit"}}>
              <div style={{fontSize:11,fontWeight:700,color:T.acc,letterSpacing:0.3,marginBottom:6}}>❄️ DESCONGELA ESTA NOCHE <span style={{fontSize:10,color:T.text3,fontWeight:400,marginLeft:4}}>· ver menú →</span></div>
              {tomorrowMeals.map((m,i)=><div key={i} style={{fontSize:13,color:T.text2,marginBottom:2}}>→ {m.label}</div>)}
            </button>
          )}

          {/* Check-in */}
          <div style={{...card({padding:16,marginBottom:10})}}>
            <div style={{fontSize:11,fontWeight:700,color:T.text3,letterSpacing:0.3,marginBottom:10}}>CHECK-IN SEMANAL</div>
            {thisWeekCheckin?(
              <div>
                <div style={{fontSize:13,color:T.green,fontWeight:600}}>✓ Registrado · {thisWeekCheckin.date}</div>
                {thisWeekCheckin.note&&<div style={{marginTop:6,fontSize:12,color:T.text3,fontStyle:"italic"}}>"{thisWeekCheckin.note}"</div>}
              </div>
            ):(
              <>
                <div style={{fontSize:12,color:T.text3,marginBottom:10}}>3 preguntas, 30 segundos.</div>
                <button onClick={()=>{setCheckinDraft({physical:0,anxiety:0,training:0,note:""});setCheckinOpen(true);}} style={{width:"100%",background:T.acc+"12",border:`1px solid ${T.acc}30`,borderRadius:12,padding:11,color:T.acc,fontSize:13,fontWeight:700,cursor:"pointer"}}>Hacer check-in</button>
              </>
            )}
          </div>

          {/* Nav */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {id:"food", emoji:"🥗",label:"Alimentación",sub:"Planning · Compra · Raciones",color:T.green},
              {id:"training",emoji:"💪",label:"Entreno",   sub:"Calendario · Progreso",       color:T.acc},
            ].map(b=>(
              <button key={b.id} onClick={()=>setSection(b.id)} style={{...card({padding:"18px 14px",cursor:"pointer",color:"inherit",textAlign:"left",display:"block",width:"100%"})}}>
                <div style={{fontSize:28,marginBottom:8}}>{b.emoji}</div>
                <div style={{fontSize:16,fontWeight:800,color:b.color}}>{b.label}</div>
                <div style={{fontSize:11,color:T.text3,marginTop:4}}>{b.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </>)}

      {/* ════════════════════ FOOD ══════════════════════════════════════════ */}
      {section==="food"&&(<>
        <div style={{background:T.bg,borderBottom:`1px solid ${T.bg3}`,padding:"56px 20px 0",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <button onClick={()=>setSection("home")} style={{background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:10,width:34,height:34,cursor:"pointer",color:T.acc,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <div style={{fontSize:20,fontWeight:800}}>Alimentación</div>
          </div>
          <div style={{display:"flex"}}>
            {[["week","📅 Semana"],["shop","🛒 Compra"],["snacks","🤌 Hambre"],["portions","✋ Raciones"]].map(([id,label])=>(
              <button key={id} onClick={()=>setFoodTab(id)} style={{flex:1,background:"none",border:"none",borderBottom:foodTab===id?`2px solid ${T.acc}`:"2px solid transparent",color:foodTab===id?T.acc:T.text3,padding:"8px 2px 12px",cursor:"pointer",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"14px 14px 90px"}}>

          {/* WEEK TAB */}
          {foodTab==="week"&&(<>
            {sec("BALANCE PROTEÍNAS")}
            <div style={{...card({padding:14,marginBottom:14})}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {Object.entries(PROTEIN_META).filter(([k])=>k!=="huevos").map(([key,pm])=>{
                  const count=proteinCounts[key]||0;
                  const col=pm.max&&count>pm.max?T.red:pm.max&&count===pm.max?T.orange:T.green;
                  return(
                    <div key={key} style={{background:col+"10",border:`1px solid ${col}25`,borderRadius:10,padding:"8px 10px"}}>
                      <div style={{fontSize:16,marginBottom:2}}>{pm.emoji}</div>
                      <div style={{fontSize:10,fontWeight:700,color:T.text2,marginBottom:2}}>{pm.label}</div>
                      <div style={{fontSize:9,color:col,fontWeight:700}}>{count}x{pm.max?` / máx ${pm.max}`:""}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {sec("PLANNING SEMANAL")}
            {DEFAULT_PLAN.map((_,di)=>{
              const isOpen=openDay===di;
              return(
                <div key={di} style={{...card({marginBottom:8})}}>
                  <button onClick={()=>setOpenDay(isOpen?null:di)} style={{width:"100%",background:"none",border:"none",padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",color:"inherit"}}>
                    <div style={{width:32,height:32,borderRadius:8,background:T.bg2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:T.text2,flexShrink:0}}>
                      {["L","M","X","J","V","S","D"][di]}
                    </div>
                    <div style={{flex:1,display:"flex",gap:5}}>
                      {["D","C","N"].map(meal=>{
                        const m=resolveMeal(plan[di][meal],meal);
                        return(
                          <div key={meal} style={{flex:1,background:T.bg2,borderRadius:7,padding:"5px 6px",fontSize:9,color:m?.protein==="libre"?T.purple:m?.custom?T.acc:T.text2,lineHeight:1.3}}>
                            <div style={{fontSize:10,marginBottom:2}}>{{D:"🌅",C:"☀️",N:"🌙"}[meal]}</div>
                            <div style={{fontWeight:600}}>{m?.label||"—"}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{color:T.text3,fontSize:13}}>{isOpen?"▲":"▼"}</div>
                  </button>

                  {isOpen&&(
                    <div style={{borderTop:`1px solid ${T.bg3}`,padding:"12px 14px"}}>
                      {["D","C","N"].map(meal=>{
                        const mLabel={D:"Desayuno",C:"Comida",N:"Cena"}[meal];
                        const m=resolveMeal(plan[di][meal],meal);
                        const isEditing=editingMeal?.dayIdx===di&&editingMeal?.meal===meal;
                        const isTyping=freeText?.dayIdx===di&&freeText?.meal===meal;
                        return(
                          <div key={meal} style={{marginBottom:10}}>
                            <div style={{fontSize:10,color:T.text3,fontWeight:700,letterSpacing:0.3,marginBottom:5}}>{mLabel.toUpperCase()}</div>
                            {!isEditing&&!isTyping?(
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                <div style={{flex:1,background:T.bg2,borderRadius:10,padding:"9px 11px"}}>
                                  <div style={{fontSize:13,fontWeight:600,color:m?.protein==="libre"?T.purple:m?.custom?T.acc:T.text}}>{m?.label||"—"}</div>
                                  <div style={{fontSize:11,color:T.text3,marginTop:2}}>{m?.desc}</div>
                                </div>
                                <button onClick={()=>setEditingMeal({dayIdx:di,meal})} style={{background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:10,padding:"9px 10px",cursor:"pointer",fontSize:14}}>✏️</button>
                              </div>
                            ):isTyping?(
                              // Free text input
                              <div style={{...card({border:`1px solid ${T.acc}40`,padding:12})}}>
                                <div style={{fontSize:11,color:T.text3,marginBottom:8}}>Escribe lo que comiste:</div>
                                <textarea
                                  autoFocus
                                  value={freeText.text}
                                  onChange={e=>setFreeText(f=>({...f,text:e.target.value}))}
                                  placeholder="Ej: huevos revueltos con espinacas y tostada..."
                                  style={{width:"100%",background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:10,padding:"10px 12px",color:T.text,fontSize:13,resize:"none",height:70,marginBottom:10}}
                                />
                                <div style={{display:"flex",gap:8}}>
                                  <button onClick={saveFreeText} disabled={freeText.detecting} style={{flex:1,background:T.acc,border:"none",borderRadius:10,padding:"10px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                                    {freeText.detecting?"Analizando...":"Guardar"}
                                  </button>
                                  <button onClick={()=>setFreeText(null)} style={{background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:10,padding:"10px 12px",color:T.text3,fontSize:13,cursor:"pointer"}}>✕</button>
                                </div>
                              </div>
                            ):(
                              // Selection list + free text option
                              <div style={{...card({border:`1px solid ${T.acc}35`})}}>
                                {MEALS[meal].map(opt=>(
                                  <button key={opt.id} onClick={()=>{pP(plan.map((d,i)=>i===di?{...d,[meal]:opt.id}:d));setEditingMeal(null);}} style={{width:"100%",background:plan[di][meal]===opt.id?T.acc+"10":"none",border:"none",borderBottom:`1px solid ${T.bg3}`,padding:"10px 12px",textAlign:"left",cursor:"pointer",color:"inherit"}}>
                                    <div style={{fontSize:12,fontWeight:600,color:plan[di][meal]===opt.id?T.acc:T.text}}>{opt.label}</div>
                                    <div style={{fontSize:10,color:T.text3,marginTop:2}}>{opt.desc}</div>
                                  </button>
                                ))}
                                {/* Free text option */}
                                <button onClick={()=>{setFreeText({dayIdx:di,meal,text:"",detecting:false});setEditingMeal(null);}} style={{width:"100%",background:"none",border:"none",borderBottom:`1px solid ${T.bg3}`,padding:"10px 12px",textAlign:"left",cursor:"pointer",color:"inherit"}}>
                                  <div style={{fontSize:12,fontWeight:600,color:T.acc}}>✏️ Escribir lo que comí</div>
                                  <div style={{fontSize:10,color:T.text3,marginTop:2}}>Fuera del menú — cualquier cosa</div>
                                </button>
                                <button onClick={()=>setEditingMeal(null)} style={{width:"100%",background:"none",border:"none",padding:"8px",color:T.text3,fontSize:11,cursor:"pointer"}}>Cancelar</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>)}

          {/* SHOP TAB */}
          {foodTab==="shop"&&(<>
            <div style={{background:"#f0f6ff",border:`1px solid ${T.acc}20`,borderRadius:14,padding:12,marginBottom:14,fontSize:12,color:T.text2,lineHeight:1.6}}>
              📅 Haz esta compra <strong style={{color:T.acc}}>el domingo</strong>. Marca lo que ya tienes.
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {Object.keys(SHOPPING).map(cat=>(
                <button key={cat} onClick={()=>setShopCat(cat)} style={{background:shopCat===cat?T.acc+"12":T.bg,border:`1px solid ${shopCat===cat?T.acc+"40":T.bg3}`,borderRadius:100,padding:"5px 12px",color:shopCat===cat?T.acc:T.text2,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  {cat}
                </button>
              ))}
            </div>
            {SHOPPING[shopCat].map((item,i)=>{
              const k=`${shopCat}::${item}`;const done=shopDone[k];
              return(
                <button key={i} onClick={()=>pSh({...shopDone,[k]:!done})} style={{width:"100%",background:"none",border:"none",borderBottom:`1px solid ${T.bg3}`,padding:"12px 4px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",color:"inherit"}}>
                  <div style={{width:22,height:22,borderRadius:6,background:done?T.green:"none",border:done?"none":`1.5px solid ${T.bg3}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",flexShrink:0}}>{done?"✓":""}</div>
                  <div style={{fontSize:13,color:done?T.text3:T.text,textDecoration:done?"line-through":"none",textAlign:"left"}}>{item}</div>
                </button>
              );
            })}
            <button onClick={()=>pSh({})} style={{width:"100%",background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:12,padding:12,color:T.text3,fontSize:12,cursor:"pointer",marginTop:14}}>
              Reiniciar lista (nueva semana)
            </button>
          </>)}

          {/* SNACKS TAB */}
          {foodTab==="snacks"&&(<>
            <div style={{background:"#f9f0ff",border:`1px solid ${T.purple}20`,borderRadius:14,padding:12,marginBottom:14,fontSize:12,color:T.text2,lineHeight:1.6}}>
              🧠 <strong style={{color:T.purple}}>Antes de picar:</strong> bebe agua y espera 5 min. A veces es ansiedad, no hambre.
            </div>
            {SNACKS.map((s,i)=>(
              <div key={i} style={{...card({marginBottom:10,padding:14,display:"flex",gap:12})}}>
                <div style={{fontSize:26,width:44,height:44,background:T.bg2,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{s.icon}</div>
                <div>
                  <div style={{fontSize:9,color:T.text3,letterSpacing:0.5,fontWeight:700,marginBottom:3}}>{s.when.toUpperCase()}</div>
                  <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3}}>{s.name}</div>
                  <div style={{fontSize:12,color:T.text2,lineHeight:1.5}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </>)}

          {/* PORTIONS TAB */}
          {foodTab==="portions"&&(<>
            <div style={{background:"#f0fff5",border:`1px solid ${T.green}20`,borderRadius:14,padding:12,marginBottom:14,fontSize:12,color:T.text2,lineHeight:1.6}}>
              ✋ <strong style={{color:T.green}}>Sin pesar nada.</strong> Tu mano es proporcional a tu cuerpo.
            </div>
            {PORTIONS.map((p,i)=>{
              const isOpen=openPortion===i;const pc=p.visual==="free"?T.green:T.acc;
              return(
                <div key={i} style={{...card({marginBottom:8})}}>
                  <button onClick={()=>setOpenPortion(isOpen?null:i)} style={{width:"100%",background:"none",border:"none",padding:"13px 14px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",color:"inherit"}}>
                    <div style={{fontSize:24,width:42,height:42,background:T.bg2,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{p.emoji}</div>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontSize:14,fontWeight:700,color:T.text}}>{p.food}</div>
                      <div style={{fontSize:11,color:pc,fontWeight:600,marginTop:2}}>{p.rule} · {p.grams}</div>
                    </div>
                    <div style={{color:T.text3,fontSize:13}}>{isOpen?"▲":"▼"}</div>
                  </button>
                  {isOpen&&(
                    <div style={{borderTop:`1px solid ${T.bg3}`,padding:"4px 14px 16px"}}>
                      <PortionVisual type={p.visual} color={pc}/>
                      <div style={{background:pc+"10",border:`1px solid ${pc}20`,borderRadius:10,padding:"10px 12px",fontSize:12,color:T.text2,lineHeight:1.6}}>💡 {p.desc}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </>)}
        </div>
      </>)}

      {/* ════════════════════ TRAINING ══════════════════════════════════════ */}
      {section==="training"&&(<>
        <div style={{background:T.bg,borderBottom:`1px solid ${T.bg3}`,padding:"56px 20px 0",position:"sticky",top:0,zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
            <button onClick={()=>setSection("home")} style={{background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:10,width:34,height:34,cursor:"pointer",color:T.acc,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:800}}>Entreno</div>
              <div style={{fontSize:11,color:nextT.color,fontWeight:700}}>{trainLabel}: {nextT.label} {nextT.emoji}</div>
            </div>
            <div style={{background:T.bg2,borderRadius:12,padding:"6px 12px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:800,color:weekSessions>=4?T.green:weekSessions>=2?T.orange:T.red}}>{weekSessions}/4</div>
              <div style={{fontSize:9,color:T.text3,fontWeight:700}}>SEMANA</div>
            </div>
          </div>
          <div style={{display:"flex",marginTop:8}}>
            {[["calendar","📅 Calendario"],["progress","📈 Progreso"]].map(([id,label])=>(
              <button key={id} onClick={()=>setTrainTab(id)} style={{flex:1,background:"none",border:"none",borderBottom:trainTab===id?`2px solid ${T.acc}`:"2px solid transparent",color:trainTab===id?T.acc:T.text3,padding:"8px 2px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"14px 14px 90px"}}>
          {trainTab==="calendar"&&(<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <button onClick={()=>setViewMonth(p=>{const d=new Date(p.y,p.m-1);return{y:d.getFullYear(),m:d.getMonth()};})} style={{background:T.bg,border:`1px solid ${T.bg3}`,borderRadius:10,width:36,height:36,cursor:"pointer",color:T.text,fontSize:18}}>‹</button>
              <div style={{fontSize:17,fontWeight:700}}>{MONTHS[viewMonth.m]} {viewMonth.y}</div>
              <button onClick={()=>setViewMonth(p=>{const d=new Date(p.y,p.m+1);return{y:d.getFullYear(),m:d.getMonth()};})} style={{background:T.bg,border:`1px solid ${T.bg3}`,borderRadius:10,width:36,height:36,cursor:"pointer",color:T.text,fontSize:18}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
              {DAY_H.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:T.text3,padding:"3px 0"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:16}}>
              {Array.from({length:first}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:total}).map((_,i)=>{
                const day=i+1;const date=new Date(viewMonth.y,viewMonth.m,day);const k=dateKey(date);
                const sess=sessions[k];const isToday=k===TK;const isFuture=date>TODAY;
                const t=sess?.trainingId?TRAININGS.find(x=>x.id===sess.trainingId):null;
                return(
                  <button key={day} onClick={()=>openDayModal(viewMonth.y,viewMonth.m,day)} style={{aspectRatio:"1",borderRadius:10,border:isToday?`2px solid ${T.acc}`:t?`1.5px solid ${t.color}35`:`1px solid ${T.bg3}`,background:t?t.color+"12":isToday?T.acc+"10":T.bg,cursor:isFuture?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:2,gap:1}}>
                    <div style={{fontSize:11,fontWeight:isToday?800:500,color:isToday?T.acc:t?t.color:T.text2}}>{day}</div>
                    {t&&<div style={{fontSize:12}}>{t.emoji}</div>}
                    {sess?.yoga&&!t&&<div style={{fontSize:11}}>🧘</div>}
                    {sess?.yoga&&t&&<div style={{fontSize:8,color:T.purple,fontWeight:700}}>+yoga</div>}
                  </button>
                );
              })}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
              {TRAININGS.map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:8,height:8,borderRadius:2,background:t.color}}/>
                  <span style={{fontSize:10,color:T.text3}}>{t.label}</span>
                </div>
              ))}
            </div>
            {sec("ÚLTIMAS SESIONES")}
            {Object.entries(sessions).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,5).map(([k,s])=>{
              const t=s.trainingId?TRAININGS.find(x=>x.id===s.trainingId):null;
              const p=k.split("-");const d=new Date(+p[0],+p[1],+p[2]);
              return(
                <div key={k} style={{...card({marginBottom:8,padding:"12px 14px",display:"flex",alignItems:"center",gap:12})}}>
                  <div style={{width:40,height:40,borderRadius:10,background:t?t.color+"12":"#f9f0ff",border:`1px solid ${t?t.color+"25":T.purple+"25"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {t?t.emoji:"🧘"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:t?t.color:T.purple}}>
                      {t?t.label:"Solo yoga"}{s.yoga&&t&&<span style={{fontSize:10,color:T.purple,marginLeft:6}}>+ yoga</span>}
                    </div>
                    <div style={{fontSize:11,color:T.text3,marginTop:2}}>{d.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</div>
                    {s.note&&<div style={{fontSize:11,color:T.text2,marginTop:3,fontStyle:"italic"}}>"{s.note}"</div>}
                  </div>
                </div>
              );
            })}
            {!Object.keys(sessions).length&&<div style={{textAlign:"center",padding:"30px",color:T.text3,fontSize:13}}>Toca cualquier día para registrar tu primera sesión 💪</div>}
          </>)}

          {trainTab==="progress"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{val:totalSessions,label:"Total",color:T.acc},{val:`${weekSessions}/4`,label:"Semana",color:weekSessions>=4?T.green:weekSessions>=2?T.orange:T.red},{val:yogaWeek,label:"Yoga",color:T.purple}].map(s=>(
                <div key={s.label} style={{...card({padding:"14px 10px",textAlign:"center"})}}>
                  <div style={{fontSize:26,fontWeight:800,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:10,color:T.text3,fontWeight:600,marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
            {sec("POR TRAINING")}
            <div style={{...card({padding:14,marginBottom:14})}}>
              {TRAININGS.map(t=>{
                const count=Object.values(sessions).filter(s=>s.trainingId===t.id).length;
                const pct=totalSessions>0?(count/totalSessions)*100:0;
                return(
                  <div key={t.id} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.text}}>{t.emoji} {t.label}</div>
                      <div style={{fontSize:12,color:t.color,fontWeight:700}}>{count}x</div>
                    </div>
                    <div style={{height:6,background:T.bg2,borderRadius:100}}>
                      <div style={{height:"100%",width:`${pct}%`,background:t.color,borderRadius:100}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            {sec("PESO Y CINTURA")}
            <button onClick={()=>{setMeasInput({weight:"",waist:""});setMeasOpen(true);}} style={{width:"100%",background:T.acc+"10",border:`1px solid ${T.acc}25`,borderRadius:14,padding:13,color:T.acc,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:14}}>
              + Registrar medición de hoy
            </button>
            {measHistory.length>0&&(<>
              <div style={{...card({padding:14,marginBottom:10})}}>
                <div style={{fontSize:11,color:T.text3,fontWeight:700,marginBottom:10}}>TENDENCIA PESO (kg)</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:64}}>
                  {measHistory.slice(-8).map((m,i,arr)=>{
                    const vals=arr.map(x=>parseFloat(x.weight)).filter(Boolean);
                    const min=Math.min(...vals)-1,max=Math.max(...vals)+1;
                    const h=vals.length>1?((parseFloat(m.weight)-min)/(max-min))*48+8:32;
                    const isLast=i===arr.length-1;
                    return(
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <div style={{fontSize:8,color:isLast?T.acc:T.text3,fontWeight:700}}>{m.weight}</div>
                        <div style={{width:"100%",height:h,background:isLast?T.acc:T.acc+"40",borderRadius:"4px 4px 0 0"}}/>
                      </div>
                    );
                  })}
                </div>
              </div>
              {measHistory.slice().reverse().slice(0,6).map((m,i)=>(
                <div key={i} style={{...card({marginBottom:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"})}}>
                  <div style={{fontSize:11,color:T.text3}}>{m.date}</div>
                  <div style={{display:"flex",gap:14}}>
                    {m.weight&&<div style={{fontSize:13,fontWeight:700,color:T.text}}><span style={{color:T.text3,fontSize:10}}>PESO </span>{m.weight}kg</div>}
                    {m.waist&&<div style={{fontSize:13,fontWeight:700,color:T.text}}><span style={{color:T.text3,fontSize:10}}>CINTURA </span>{m.waist}cm</div>}
                  </div>
                </div>
              ))}
            </>)}
          </>)}
        </div>
      </>)}

      {/* ════════ MODALS ════════════════════════════════════════════════════ */}
      {activeDay&&draft&&modal(<>
        <div style={{fontSize:17,fontWeight:700,marginBottom:16}}>
          {(()=>{const p=activeDay.split("-");return new Date(+p[0],+p[1],+p[2]).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});})()}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:T.text3,marginBottom:10}}>ENTRENAMIENTO</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {[{id:null,label:"Sin entreno",emoji:"—",color:T.text3},...TRAININGS].map(t=>(
            <button key={t.id??"none"} onClick={()=>setDraft(d=>({...d,trainingId:t.id}))} style={{background:draft.trainingId===t.id?t.color+"12":T.bg2,border:`1.5px solid ${draft.trainingId===t.id?t.color:T.bg3}`,borderRadius:12,padding:"11px 10px",cursor:"pointer",color:"inherit",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18}}>{t.emoji}</span>
              <span style={{fontSize:13,fontWeight:600,color:draft.trainingId===t.id?t.color:T.text2}}>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:T.text3,marginBottom:8}}>YOGA NOCTURNO</div>
        <button onClick={()=>setDraft(d=>({...d,yoga:!d.yoga}))} style={{width:"100%",background:draft.yoga?"#f9f0ff":T.bg2,border:`1.5px solid ${draft.yoga?T.purple:T.bg3}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",color:"inherit",display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <span style={{fontSize:20}}>🧘</span>
          <span style={{fontSize:13,fontWeight:600,color:draft.yoga?T.purple:T.text2}}>{draft.yoga?"Yoga hecho ✓":"Marcar yoga nocturno"}</span>
        </button>
        <div style={{fontSize:11,fontWeight:700,color:T.text3,marginBottom:8}}>NOTA (opcional)</div>
        <textarea value={draft.note||""} onChange={e=>setDraft(d=>({...d,note:e.target.value}))} placeholder="Ej: subí peso en press, buena sesión..." style={{width:"100%",background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:12,padding:"11px 12px",color:T.text,fontSize:13,resize:"none",height:65,marginBottom:16}}/>
        <button onClick={saveDraft} style={{width:"100%",background:T.acc,border:"none",borderRadius:14,padding:15,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>Guardar</button>
      </>,()=>{setActiveDay(null);setDraft(null);})}

      {measOpen&&modal(<>
        <div style={{fontSize:17,fontWeight:700,marginBottom:18}}>Medición de hoy</div>
        {[{key:"weight",label:"Peso",unit:"kg",ph:"Ej: 84.5"},{key:"waist",label:"Cintura",unit:"cm",ph:"Ej: 92"}].map(f=>(
          <div key={f.key} style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.text3,marginBottom:8}}>{f.label} ({f.unit})</div>
            <input type="number" value={measInput[f.key]} onChange={e=>setMeasInput(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{width:"100%",background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:12,padding:"13px 14px",color:T.text,fontSize:16}}/>
          </div>
        ))}
        <button onClick={saveMeas} style={{width:"100%",background:T.acc,border:"none",borderRadius:14,padding:15,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",marginTop:6}}>Guardar</button>
      </>,()=>setMeasOpen(false))}

      {checkinOpen&&modal(<>
        <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>Check-in semanal</div>
        <div style={{fontSize:12,color:T.text3,marginBottom:20}}>3 preguntas, 30 segundos</div>
        {[
          {key:"physical",label:"¿Cómo te sientes físicamente?",opts:["Muy mal","Regular","Bien","Muy bien"]},
          {key:"anxiety", label:"¿Cómo está la ansiedad?",       opts:["Muy alta","Alta","Controlada","Tranquila"]},
          {key:"training",label:"¿Cumpliste el objetivo de entreno?",opts:["Nada","Poco","Casi","Sí, todo"]},
        ].map(q=>(
          <div key={q.key} style={{marginBottom:18}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:10}}>{q.label}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
              {q.opts.map((opt,i)=>(
                <button key={i} onClick={()=>setCheckinDraft(d=>({...d,[q.key]:i+1}))} style={{background:checkinDraft[q.key]===i+1?T.acc+"12":T.bg2,border:`1.5px solid ${checkinDraft[q.key]===i+1?T.acc:T.bg3}`,borderRadius:10,padding:"8px 4px",cursor:"pointer",color:checkinDraft[q.key]===i+1?T.acc:T.text2,fontSize:11,fontWeight:600}}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{fontSize:11,fontWeight:700,color:T.text3,marginBottom:8}}>NOTA (opcional)</div>
        <textarea value={checkinDraft.note} onChange={e=>setCheckinDraft(d=>({...d,note:e.target.value}))} placeholder="Algo que quieras recordar..." style={{width:"100%",background:T.bg2,border:`1px solid ${T.bg3}`,borderRadius:12,padding:"11px 12px",color:T.text,fontSize:13,resize:"none",height:65,marginBottom:16}}/>
        <button onClick={saveCheckin} style={{width:"100%",background:T.acc,border:"none",borderRadius:14,padding:15,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>Guardar</button>
      </>,()=>setCheckinOpen(false))}

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,height:50,background:`linear-gradient(transparent,${T.bg2})`,pointerEvents:"none"}}/>
    </div>
  );
}

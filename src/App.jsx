import { useState, useMemo, useEffect, useRef } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SB_URL = "https://tgtequfxljhehivdncen.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndGVxdWZ4bGpoZWhpdmRuY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzM5MzksImV4cCI6MjA4ODQ0OTkzOX0.AIZZQA5lbXbPswb7g-Esu0MC4Vtfy_mRzkbzG5T-lpA";
const SB_HEADERS = { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };

async function sbLoad() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/user_data?id=eq.main`, { headers: SB_HEADERS });
    const data = await r.json();
    return data?.[0] || null;
  } catch { return null; }
}

async function sbSave(patch) {
  try {
    await fetch(`${SB_URL}/rest/v1/user_data?id=eq.main`, {
      method: "PATCH",
      headers: { ...SB_HEADERS, "Prefer": "return=minimal" },
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    });
  } catch {}
}

// Local fallback
const L = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TRAININGS = [
  { id: 1, label: "Training 1", emoji: "💪", color: "#f59e0b" },
  { id: 2, label: "Training 2", emoji: "🏋️", color: "#60a5fa" },
  { id: 3, label: "Training 3", emoji: "🦵", color: "#34d399" },
  { id: 4, label: "Training 4", emoji: "🔥", color: "#f87171" },
];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_HEADERS = ["L","M","X","J","V","S","D"];

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
const TK = dateKey(TODAY);
const isMonday = TODAY.getDay() === 1;

// ─── MEAL DATA ────────────────────────────────────────────────────────────────
const MEAL_OPTIONS = {
  D: [
    { id:"d1", label:"Huevos revueltos", desc:"3 huevos + tostada integral + fruta", protein:"huevos" },
    { id:"d2", label:"Smoothie proteico", desc:"Leche almendras + frutos rojos + Belvels", protein:"otro" },
    { id:"d3", label:"Tortilla francesa", desc:"2-3 huevos + aguacate + tostada", protein:"huevos" },
    { id:"d4", label:"Skyr + fruta", desc:"Yogur Skyr sin lactosa + frutos rojos + nueces", protein:"otro" },
    { id:"d5", label:"🎉 Libre", desc:"Come lo que quieras, sin culpa", protein:"libre" },
  ],
  C: [
    { id:"c1", label:"Pollo al wok", desc:"Pechuga + verduras + arroz integral", protein:"pollo", freeze:true },
    { id:"c2", label:"Salmón al horno", desc:"Salmón fresco + boniato + ensalada", protein:"salmon", freeze:true },
    { id:"c3", label:"Ternera + legumbres", desc:"Ternera magra + lentejas + ensalada", protein:"ternera", freeze:true },
    { id:"c4", label:"Contramuslos horno", desc:"Pollo + boniato + verduras asadas", protein:"pollo", freeze:true },
    { id:"c5", label:"Ensalada salmón ahumado", desc:"Salmón ahumado + aguacate + huevo", protein:"salmonahumado" },
    { id:"c6", label:"Libre / fuera", desc:"Come fuera o improvisa", protein:"libre" },
  ],
  N: [
    { id:"n1", label:"Crema + huevos", desc:"Crema verduras Thermomix + 2 huevos", protein:"huevos" },
    { id:"n2", label:"Tortilla + ensalada", desc:"Tortilla 2 huevos + ensalada grande", protein:"huevos" },
    { id:"n3", label:"Jamón + queso", desc:"Jamón ibérico + burrata/feta + tomate + pan", protein:"jamon" },
    { id:"n4", label:"Salmón ahumado", desc:"Salmón ahumado + aguacate + biscotes", protein:"salmonahumado" },
    { id:"n5", label:"Skyr + fruta", desc:"Yogur Skyr + frutos rojos + nueces", protein:"otro" },
    { id:"n6", label:"Libre / fuera", desc:"Come fuera o improvisa", protein:"libre" },
  ],
};

const PROTEIN_META = {
  pollo:         { label:"Pollo",          emoji:"🍗", color:"#f59e0b", max:3 },
  salmon:        { label:"Salmón fresco",  emoji:"🐟", color:"#60a5fa", max:2 },
  salmonahumado: { label:"Salmón ahumado", emoji:"🫙", color:"#93c5fd", max:1 },
  ternera:       { label:"Ternera",        emoji:"🥩", color:"#ef4444", max:2 },
  huevos:        { label:"Huevos",         emoji:"🥚", color:"#fbbf24", max:null },
  jamon:         { label:"Jamón ibérico",  emoji:"🍖", color:"#f87171", max:3 },
};

const DEFAULT_PLAN = [
  { D:"d2", C:"c1", N:"n1" },
  { D:"d1", C:"c2", N:"n3" },
  { D:"d3", C:"c3", N:"n2" },
  { D:"d4", C:"c4", N:"n6" },
  { D:"d1", C:"c5", N:"n4" },
  { D:"d2", C:"c6", N:"n5" },
  { D:"d4", C:"c1", N:"n6" },
];

const SHOPPING = {
  "🥩 Proteína": ["Pechuga de pollo (800g)","Salmón fresco (2 filetes)","Ternera magra picada (400g)","Salmón ahumado (1 paquete)","Jamón ibérico (100g)","Huevos (docena)","Yogur Skyr sin lactosa (x2)"],
  "🥦 Verduras": ["Bolsa ensalada mixta","Tomates (500g)","Calabacín (2)","Puerro (2)","Brócoli (1)","Espinacas (bolsa)","Aguacates (3)"],
  "🌾 Carbos": ["Arroz integral","Boniato (4 unidades)","Pan integral","Biscotes integrales"],
  "🍓 Fruta": ["Plátanos (4)","Manzanas (4)","Arándanos/fresas congelados","Naranjas o kiwis (4)"],
  "🥜 Extras": ["Nueces / almendras (bolsa)","Mantequilla almendras sin azúcar","Aceite oliva virgen extra","Queso feta / burrata","Leche almendras sin azúcar","Chocolate negro +85%"],
};

const SNACKS = [
  { when:"Cualquier momento", icon:"🥜", name:"Puñado de nueces", desc:"~15 nueces o 20 almendras. Grasa buena, aguanta el hambre real." },
  { when:"Con hambre de verdad", icon:"🍗", name:"Jamón ibérico", desc:"2-3 lonchas. Proteína inmediata, sin cocinar nada." },
  { when:"Algo dulce", icon:"🍫", name:"Chocolate negro 85%", desc:"1-2 cuadrados + nueces. Satisface sin disparar glucosa." },
  { when:"En casa, 5 min", icon:"🥛", name:"Skyr con fruta", desc:"Bol mediano de Skyr + arándanos. Proteína + dulce natural." },
  { when:"Algo salado", icon:"🧀", name:"Queso + biscotes", desc:"Un trozo Maasdam (tamaño pulgar) + 2 biscotes integrales." },
  { when:"Sin hambre real", icon:"💧", name:"Agua o té primero", desc:"Espera 10 min. A veces es ansiedad, no hambre." },
];

const PORTIONS = [
  { food:"Carne o pollo", emoji:"🍗", rule:"Palma de la mano", grams:"~150g", desc:"El tamaño y grosor de tu palma, sin los dedos.", visual:"palm" },
  { food:"Salmón", emoji:"🐟", rule:"Palma de la mano", grams:"~150g", desc:"Mismo criterio. Si es fino, puede ser algo más.", visual:"palm" },
  { food:"Arroz / pasta cocidos", emoji:"🍚", rule:"Puño cerrado", grams:"~120g", desc:"Un puño de arroz ya cocido por comida. No dos.", visual:"fist" },
  { food:"Boniato", emoji:"🍠", rule:"Puño cerrado", grams:"~150g", desc:"Uno mediano o un puño de trozos cocidos.", visual:"fist" },
  { food:"Aguacate", emoji:"🥑", rule:"Medio o uno entero", grams:"~80-160g", desc:"Medio si hay otras grasas. Uno si no hay aceite ni nueces.", visual:"half" },
  { food:"Nueces / almendras", emoji:"🥜", rule:"Puñado cerrado", grams:"~25-30g", desc:"Lo que cabe en la palma con dedos cerrados. No del bol.", visual:"handful" },
  { food:"Aceite de oliva", emoji:"🫒", rule:"2 cucharadas", grams:"~20ml", desc:"Para cocinar o aliñar. Con conciencia, no a chorro.", visual:"spoon" },
  { food:"Verduras", emoji:"🥦", rule:"Sin límite", grams:"∞", desc:"Come todo lo que quieras. Cuantas más, mejor.", visual:"free" },
];

// ─── VISUAL PORTIONS ──────────────────────────────────────────────────────────
function PortionVisual({ type, color }) {
  const row = { display:"flex", alignItems:"center", justifyContent:"center", gap:16, margin:"12px 0" };
  const lbl = { fontSize:9, color:"rgba(255,255,255,0.35)", textAlign:"center", marginTop:4, fontWeight:700, letterSpacing:1 };
  if (type === "palm") return (
    <div style={row}>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          <ellipse cx="28" cy="47" rx="20" ry="17" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <rect x="16" y="12" width="7" height="26" rx="3.5" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <rect x="25" y="8" width="7" height="30" rx="3.5" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <rect x="34" y="10" width="7" height="28" rx="3.5" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <rect x="8" y="20" width="6" height="20" rx="3" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
        </svg>
        <div style={lbl}>TU PALMA</div>
      </div>
      <div style={{fontSize:20,color:"rgba(255,255,255,0.2)"}}>≈</div>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          <rect x="6" y="14" width="44" height="40" rx="8" fill={color+"20"} stroke={color} strokeWidth="1.5"/>
        </svg>
        <div style={lbl}>RACIÓN</div>
      </div>
    </div>
  );
  if (type === "fist") return (
    <div style={row}>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          <ellipse cx="28" cy="42" rx="19" ry="20" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <rect x="17" y="20" width="7" height="17" rx="3.5" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <rect x="26" y="18" width="7" height="17" rx="3.5" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <rect x="35" y="20" width="7" height="17" rx="3.5" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
        </svg>
        <div style={lbl}>PUÑO</div>
      </div>
      <div style={{fontSize:20,color:"rgba(255,255,255,0.2)"}}>≈</div>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          <ellipse cx="28" cy="40" rx="20" ry="16" fill={color+"20"} stroke={color} strokeWidth="1.5"/>
          {[0,1,2,3,4].map(i=><ellipse key={i} cx={12+i*8} cy={40} rx="2.5" ry="2" fill={color} opacity="0.4"/>)}
        </svg>
        <div style={lbl}>RACIÓN</div>
      </div>
    </div>
  );
  if (type === "half") return (
    <div style={row}>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          <ellipse cx="28" cy="36" rx="17" ry="24" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          <line x1="11" y1="36" x2="45" y2="36" stroke={color} strokeWidth="2" strokeDasharray="4,2"/>
          <text x="28" y="52" textAnchor="middle" fill={color} fontSize="11" fontWeight="700">½</text>
        </svg>
        <div style={lbl}>MÁXIMO</div>
      </div>
      <div style={{fontSize:20,color:"rgba(255,255,255,0.2)"}}>→</div>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          <ellipse cx="28" cy="36" rx="17" ry="24" fill={color+"20"} stroke={color} strokeWidth="1.5"/>
          <text x="28" y="40" textAnchor="middle" fill={color} fontSize="10" fontWeight="700">1 si no hay</text>
          <text x="28" y="52" textAnchor="middle" fill={color} fontSize="10" fontWeight="700">más grasas</text>
        </svg>
        <div style={lbl}>REGLA</div>
      </div>
    </div>
  );
  if (type === "handful") return (
    <div style={row}>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          <ellipse cx="28" cy="48" rx="20" ry="13" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          {[0,1,2,3,4].map(i=><ellipse key={i} cx={12+i*9} cy={46} rx="3.5" ry="5" fill={color} opacity="0.45"/>)}
        </svg>
        <div style={lbl}>PUÑADO</div>
      </div>
      <div style={{fontSize:20,color:"rgba(255,255,255,0.2)"}}>≈</div>
      <div style={{textAlign:"center"}}>
        <svg width="56" height="66" viewBox="0 0 56 66">
          {[...Array(12)].map((_,i)=><ellipse key={i} cx={14+(i%4)*10} cy={24+Math.floor(i/4)*14} rx="4" ry="5.5" fill={color} opacity="0.4"/>)}
        </svg>
        <div style={lbl}>~15 UNIDADES</div>
      </div>
    </div>
  );
  if (type === "spoon") return (
    <div style={row}>
      {[1,2].map(n=>(
        <div key={n} style={{textAlign:"center"}}>
          <svg width="40" height="66" viewBox="0 0 40 66">
            <ellipse cx="20" cy="18" rx="13" ry="15" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
            <rect x="17" y="32" width="6" height="26" rx="3" fill={color+"28"} stroke={color} strokeWidth="1.5"/>
          </svg>
          <div style={lbl}>CUCHARA {n}</div>
        </div>
      ))}
    </div>
  );
  return (
    <div style={{textAlign:"center",padding:"16px 0"}}>
      <div style={{fontSize:36,color}}>∞</div>
      <div style={{fontSize:12,color,fontWeight:700,marginTop:4}}>SIN LÍMITE</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Main navigation ──
  const [section, setSection] = useState("home");
  const [foodTab, setFoodTab] = useState("week");
  const [trainTab, setTrainTab] = useState("calendar");
  const [loaded, setLoaded] = useState(false);

  // ── Nutrition state ──
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [shopDone, setShopDone] = useState({});
  const [openPortion, setOpenPortion] = useState(null);
  const [shopCat, setShopCat] = useState(Object.keys(SHOPPING)[0]);
  const [editingMeal, setEditingMeal] = useState(null);
  const [openDay, setOpenDay] = useState(null);

  // ── Training state ──
  const [sessions, setSessions] = useState({});
  const [measurements, setMeasurements] = useState({});
  const [activeDay, setActiveDay] = useState(null);
  const [draft, setDraft] = useState(null);
  const [viewMonth, setViewMonth] = useState({ y: TODAY.getFullYear(), m: TODAY.getMonth() });
  const [measOpen, setMeasOpen] = useState(false);
  const [measInput, setMeasInput] = useState({ weight:"", waist:"" });

  // ── Check-in state ──
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkins, setCheckins] = useState({});
  const [checkinDraft, setCheckinDraft] = useState({ physical:0, anxiety:0, training:0, note:"" });

  // ── Load from Supabase on mount ──
  useEffect(() => {
    sbLoad().then(data => {
      if (data) {
        if (data.sessions) setSessions(data.sessions);
        if (data.measurements) setMeasurements(data.measurements);
        if (data.checkins) setCheckins(data.checkins);
        if (data.plan && data.plan.length) setPlan(data.plan);
        if (data.shop_done) setShopDone(data.shop_done);
      } else {
        // fallback to localStorage if Supabase empty
        setSessions(L.get("sessions", {}));
        setMeasurements(L.get("measurements", {}));
        setCheckins(L.get("checkins", {}));
        setPlan(L.get("plan", DEFAULT_PLAN));
        setShopDone(L.get("shopDone", {}));
      }
      setLoaded(true);
    });
  }, []);

  // ── Today's meals ──
  const todayDowIdx = TODAY.getDay() === 0 ? 6 : TODAY.getDay() - 1;
  const todayMeals = plan[todayDowIdx];

  // ── Persist to Supabase + localStorage fallback ──
  const persistSessions = s => { setSessions(s); L.set("sessions", s); sbSave({ sessions: s }); };
  const persistPlan = p => { setPlan(p); L.set("plan", p); sbSave({ plan: p }); };
  const persistMeasurements = m => { setMeasurements(m); L.set("measurements", m); sbSave({ measurements: m }); };
  const persistCheckins = c => { setCheckins(c); L.set("checkins", c); sbSave({ checkins: c }); };
  const persistShop = s => { setShopDone(s); L.set("shopDone", s); sbSave({ shop_done: s }); };

  // ── Derived: last training + next ──
  const lastTrainingId = useMemo(() => {
    const keys = Object.keys(sessions).sort().reverse();
    for (const k of keys) if (sessions[k].trainingId) return sessions[k].trainingId;
    return null;
  }, [sessions]);
  const nextTraining = lastTrainingId ? (lastTrainingId % 4) + 1 : 1;
  const nextT = TRAININGS[nextTraining - 1];

  // ── Week stats ──
  const { weekSessions, yogaWeek } = useMemo(() => {
    const dow = TODAY.getDay() === 0 ? 6 : TODAY.getDay() - 1;
    const mon = new Date(TODAY); mon.setDate(TODAY.getDate() - dow);
    let ws = 0, yw = 0;
    for (let i = 0; i < 7; i++) {
      const dd = new Date(mon); dd.setDate(mon.getDate() + i);
      const k = dateKey(dd);
      if (sessions[k]?.trainingId) ws++;
      if (sessions[k]?.yoga) yw++;
    }
    return { weekSessions: ws, yogaWeek: yw };
  }, [sessions]);

  // ── Inactivity alert ──
  const daysSinceTraining = useMemo(() => {
    const keys = Object.keys(sessions).filter(k => sessions[k].trainingId).sort().reverse();
    if (!keys.length) return 999;
    const last = keys[0].split("-");
    const lastDate = new Date(+last[0], +last[1], +last[2]);
    return Math.floor((TODAY - lastDate) / 86400000);
  }, [sessions]);

  // ── Protein counts ──
  const proteinCounts = useMemo(() => {
    const counts = {};
    plan.forEach((day, di) => {
      ["C","N"].forEach(meal => {
        const m = MEAL_OPTIONS[meal].find(x => x.id === day[meal]);
        const p = m?.protein;
        if (p && p !== "libre" && p !== "otro" && p !== "huevos") counts[p] = (counts[p]||0) + 1;
      });
    });
    return counts;
  }, [plan]);

  // ── Tomorrow defrost ──
  const tomorrowIdx = (TODAY.getDay() === 0 ? 6 : TODAY.getDay()); // next day of week index 0-6
  const tomorrowMeals = useMemo(() => {
    const idx = tomorrowIdx % 7;
    return ["C","N"].map(meal => {
      const m = MEAL_OPTIONS[meal].find(x => x.id === plan[idx][meal]);
      return m?.freeze ? m : null;
    }).filter(Boolean);
  }, [plan, tomorrowIdx]);

  // ── Calendar helpers ──
  const getDays = (y, m) => {
    const first = new Date(y, m, 1).getDay();
    return { first: first === 0 ? 6 : first - 1, total: new Date(y, m+1, 0).getDate() };
  };

  const openDayModal = (y, m, d) => {
    const date = new Date(y, m, d);
    if (date > TODAY) return;
    const k = dateKey(date);
    setActiveDay(k);
    setDraft(sessions[k] ? { ...sessions[k] } : { trainingId:null, note:"", yoga:false });
  };

  const saveDraft = () => {
    const updated = { ...sessions };
    if (!draft.trainingId && !draft.yoga && !draft.note) delete updated[activeDay];
    else updated[activeDay] = draft;
    persistSessions(updated);
    setActiveDay(null); setDraft(null);
  };

  const saveMeas = () => {
    const updated = { ...measurements, [TK]: { ...measInput, date: TODAY.toLocaleDateString("es-ES") } };
    persistMeasurements(updated);
    setMeasInput({ weight:"", waist:"" }); setMeasOpen(false);
  };

  const measHistory = useMemo(() =>
    Object.entries(measurements).map(([k,v])=>({key:k,...v})).sort((a,b)=>a.key.localeCompare(b.key))
  , [measurements]);

  const totalSessions = Object.values(sessions).filter(s => s.trainingId).length;

  // ── Check-in ──
  const thisWeekCheckin = useMemo(() => {
    const dow = TODAY.getDay() === 0 ? 6 : TODAY.getDay() - 1;
    const mon = new Date(TODAY); mon.setDate(TODAY.getDate() - dow);
    return checkins[dateKey(mon)];
  }, [checkins]);

  const saveCheckin = () => {
    const dow = TODAY.getDay() === 0 ? 6 : TODAY.getDay() - 1;
    const mon = new Date(TODAY); mon.setDate(TODAY.getDate() - dow);
    const updated = { ...checkins, [dateKey(mon)]: { ...checkinDraft, date: TODAY.toLocaleDateString("es-ES") } };
    persistCheckins(updated);
    setCheckinOpen(false);
  };

  // ── Styles ──
  const ACC = "#60a5fa";
  const card = (x={}) => ({ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden", ...x });
  const secT = t => <div style={{ fontSize:10, letterSpacing:2.5, fontWeight:800, color:"rgba(255,255,255,0.28)", marginBottom:10, marginTop:4 }}>{t}</div>;
  const { first, total } = getDays(viewMonth.y, viewMonth.m);

  // ─────────────────────────────────────────────────────────────────────────────
  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:"#080810", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');`}</style>
      <div style={{ fontSize:48 }}>💪</div>
      <div style={{ fontFamily:"'Bebas Neue'", fontSize:24, letterSpacing:3, color:"#60a5fa" }}>CARGANDO TU PLAN...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#080810", color:"#e2e2f0", fontFamily:"'Figtree', system-ui, sans-serif", maxWidth:500, margin:"0 auto" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800&family=Bebas+Neue&display=swap');* { box-sizing:border-box; } textarea,input { outline:none; }`}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          HOME
      ══════════════════════════════════════════════════════════════════════ */}
      {section === "home" && (
        <>
          <div style={{ padding:"28px 18px 16px" }}>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:32, letterSpacing:3, color:"#fff", lineHeight:1 }}>MI PLAN 90 DÍAS</div>
            <div style={{ fontSize:12, color:ACC, fontWeight:600, letterSpacing:1.5, marginTop:4 }}>MARZO → JUNIO</div>
          </div>

          {/* Inactivity alert */}
          {daysSinceTraining >= 4 && (
            <div style={{ margin:"0 18px 14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:14, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ fontSize:22 }}>⚠️</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#f87171" }}>Llevas {daysSinceTraining} días sin entrenar</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:3 }}>No hace falta recuperar lo perdido. Haz {nextT.label} hoy, 50 minutos.</div>
              </div>
            </div>
          )}

          {/* Photo reminder */}
          {isMonday && (
            <div style={{ margin:"0 18px 14px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:14, padding:"12px 14px", display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ fontSize:22 }}>📸</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#f59e0b" }}>Es lunes — hazte las fotos</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>Frontal · Lateral derecho · Lateral izquierdo</div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"0 18px 18px" }}>
            {[
              { val:weekSessions+"/4", label:"SEMANA", color: weekSessions>=4?"#34d399":weekSessions>=2?"#f59e0b":"#f87171" },
              { val:totalSessions, label:"TOTAL", color:ACC },
              { val:yogaWeek, label:"YOGA/SEM", color:"#34d399" },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"12px 8px", textAlign:"center" }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:28, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", fontWeight:800, letterSpacing:0.5, marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Today card */}
          <div style={{ margin:"0 18px 14px", background:`linear-gradient(135deg, ${nextT.color}18, rgba(255,255,255,0.03))`, border:`1px solid ${nextT.color}35`, borderRadius:16, padding:"16px 16px" }}>
            <div style={{ fontSize:10, letterSpacing:2, color:nextT.color, fontWeight:800, marginBottom:6 }}>HOY TOCA</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:32 }}>{nextT.emoji}</div>
              <div>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:26, color:nextT.color, letterSpacing:1 }}>{nextT.label}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Gym Monster · ~55 min</div>
              </div>
            </div>
          </div>

          {/* Defrost reminder */}
          {tomorrowMeals.length > 0 && (
            <div style={{ margin:"0 18px 14px", background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:14, padding:"12px 14px" }}>
              <div style={{ fontSize:10, color:ACC, fontWeight:800, letterSpacing:1.5, marginBottom:6 }}>❄️ DESCONGELA ESTA NOCHE</div>
              {tomorrowMeals.map((m,i) => <div key={i} style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:2 }}>→ {m.label}</div>)}
            </div>
          )}

          {/* Hoy comes */}
          <div style={{ margin:"0 18px 14px", ...card({ padding:16 }) }}>
            <div style={{ fontSize:10, letterSpacing:2, color:"#34d399", fontWeight:800, marginBottom:12 }}>HOY COMES</div>
            {["D","C","N"].map(meal => {
              const mLabel = {D:"🌅 Desayuno",C:"☀️ Comida",N:"🌙 Cena"}[meal];
              const mId = todayMeals?.[meal];
              const m = MEAL_OPTIONS[meal].find(x => x.id === mId);
              const isLibre = m?.protein === "libre";
              return (
                <div key={meal} style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:10, marginBottom:10, borderBottom: meal!=="N"?"1px solid rgba(255,255,255,0.06)":"none" }}>
                  <div style={{ minWidth:70, fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:700 }}>{mLabel}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: isLibre?"#a78bfa":"rgba(255,255,255,0.85)" }}>{m?.label || "—"}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:1 }}>{m?.desc}</div>
                  </div>
                  <button onClick={() => { setSection("food"); setFoodTab("week"); setOpenDay(todayDowIdx); }} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"5px 8px", cursor:"pointer", fontSize:11, color:"rgba(255,255,255,0.4)" }}>✏️</button>
                </div>
              );
            })}
          </div>

          {/* Weekly check-in */}
          <div style={{ margin:"0 18px 14px", ...card({ padding:16 }) }}>
            <div style={{ fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.3)", fontWeight:800, marginBottom:10 }}>CHECK-IN SEMANAL</div>
            {thisWeekCheckin ? (
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>
                Semana registrada ✓ — <span style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>{thisWeekCheckin.date}</span>
                {thisWeekCheckin.note && <div style={{ marginTop:6, fontStyle:"italic", fontSize:12, color:"rgba(255,255,255,0.5)" }}>"{thisWeekCheckin.note}"</div>}
              </div>
            ) : (
              <>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>3 preguntas, 30 segundos. Cómo va la semana.</div>
                <button onClick={() => { setCheckinDraft({physical:0,anxiety:0,training:0,note:""}); setCheckinOpen(true); }} style={{ width:"100%", background:ACC+"18", border:`1px solid ${ACC}40`, borderRadius:12, padding:"11px", color:ACC, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  Hacer check-in
                </button>
              </>
            )}
          </div>

          {/* Section buttons */}
          <div style={{ padding:"0 18px 40px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button onClick={() => setSection("food")} style={{ background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:16, padding:"20px 14px", cursor:"pointer", color:"inherit", textAlign:"left" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>🥗</div>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:1, color:"#34d399" }}>ALIMENTACIÓN</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Planning · Compra · Snacks · Cantidades</div>
            </button>
            <button onClick={() => setSection("training")} style={{ background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:16, padding:"20px 14px", cursor:"pointer", color:"inherit", textAlign:"left" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💪</div>
              <div style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:1, color:ACC }}>ENTRENO</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>Calendario · Progreso · Mediciones</div>
            </button>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FOOD SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {section === "food" && (
        <>
          <div style={{ background:"#0c0c1a", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"16px 18px 0", position:"sticky", top:0, zIndex:50 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <button onClick={() => setSection("home")} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:10, width:34, height:34, cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:18 }}>←</button>
              <div>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, color:"#fff", lineHeight:1 }}>ALIMENTACIÓN</div>
              </div>
            </div>
            <div style={{ display:"flex" }}>
              {[["week","📅","Semana"],["shop","🛒","Compra"],["snacks","🤌","Hambre"],["portions","✋","Raciones"]].map(([id,ico,label]) => (
                <button key={id} onClick={() => setFoodTab(id)} style={{ flex:1, background:"none", border:"none", borderBottom:foodTab===id?`2px solid #34d399`:"2px solid transparent", color:foodTab===id?"#34d399":"rgba(255,255,255,0.3)", padding:"8px 2px 11px", cursor:"pointer", fontSize:8.5, fontWeight:700, letterSpacing:0.3 }}>
                  <div style={{ fontSize:16, marginBottom:3 }}>{ico}</div>{label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding:"18px 16px 90px" }}>

            {/* WEEK */}
            {foodTab === "week" && (
              <>
                {secT("BALANCE PROTEÍNAS")}
                <div style={{ ...card({ padding:14, marginBottom:20 }) }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {Object.entries(PROTEIN_META).filter(([k])=>k!=="huevos").map(([key,pm]) => {
                      const count = proteinCounts[key]||0;
                      const over = pm.max && count > pm.max;
                      const warn = pm.max && count === pm.max;
                      const col = over?"#ef4444":warn?"#f59e0b":"#34d399";
                      return (
                        <div key={key} style={{ background:col+"12", border:`1px solid ${col}30`, borderRadius:10, padding:"8px 10px" }}>
                          <div style={{ fontSize:16, marginBottom:2 }}>{pm.emoji}</div>
                          <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.65)", marginBottom:2 }}>{pm.label}</div>
                          <div style={{ fontSize:9, color:col, fontWeight:700 }}>{count}x {pm.max?`/ máx ${pm.max}`:"esta sem."}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {secT("PLANNING SEMANAL")}
                {DEFAULT_PLAN.map((_, di) => {
                  const dayName = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"][di];
                  const isOpen = openDay === di;
                  return (
                    <div key={di} style={{ ...card({ marginBottom:8 }) }}>
                      <button onClick={() => setOpenDay(isOpen ? null : di)} style={{ width:"100%", background:"none", border:"none", padding:"12px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", color:"inherit" }}>
                        <div style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.5)", flexShrink:0 }}>
                          {["L","M","X","J","V","S","D"][di]}
                        </div>
                        <div style={{ flex:1, display:"flex", gap:5 }}>
                          {["D","C","N"].map(meal => {
                            const m = MEAL_OPTIONS[meal].find(x => x.id === plan[di][meal]);
                            return (
                              <div key={meal} style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:7, padding:"5px 5px", fontSize:9, color:"rgba(255,255,255,0.55)", lineHeight:1.3 }}>
                                <div style={{ fontSize:10, marginBottom:2 }}>{ {D:"🌅",C:"☀️",N:"🌙"}[meal] }</div>
                                <div style={{ fontWeight:600 }}>{m?.label||"—"}</div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ color:"rgba(255,255,255,0.2)", fontSize:14 }}>{isOpen?"▲":"▼"}</div>
                      </button>

                      {isOpen && (
                        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"12px 14px" }}>
                          {["D","C","N"].map(meal => {
                            const mLabel = {D:"Desayuno",C:"Comida",N:"Cena"}[meal];
                            const m = MEAL_OPTIONS[meal].find(x => x.id === plan[di][meal]);
                            const isEditingThis = editingMeal?.dayIdx===di && editingMeal?.meal===meal;
                            return (
                              <div key={meal} style={{ marginBottom:10 }}>
                                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontWeight:700, letterSpacing:1, marginBottom:5 }}>{mLabel.toUpperCase()}</div>
                                {!isEditingThis ? (
                                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                    <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"9px 11px" }}>
                                      <div style={{ fontSize:13, fontWeight:600 }}>{m?.label}</div>
                                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{m?.desc}</div>
                                    </div>
                                    <button onClick={() => setEditingMeal({dayIdx:di,meal})} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"9px 10px", cursor:"pointer", fontSize:14 }}>✏️</button>
                                  </div>
                                ) : (
                                  <div style={{ ...card({ border:`1px solid ${ACC}30` }) }}>
                                    {MEAL_OPTIONS[meal].map(opt => (
                                      <button key={opt.id} onClick={() => { persistPlan(plan.map((d,i)=>i===di?{...d,[meal]:opt.id}:d)); setEditingMeal(null); }} style={{ width:"100%", background:plan[di][meal]===opt.id?ACC+"15":"none", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"10px 12px", textAlign:"left", cursor:"pointer", color:"inherit" }}>
                                        <div style={{ fontSize:12, fontWeight:600, color:plan[di][meal]===opt.id?ACC:"rgba(255,255,255,0.8)" }}>{opt.label}</div>
                                        <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{opt.desc}</div>
                                      </button>
                                    ))}
                                    <button onClick={() => setEditingMeal(null)} style={{ width:"100%", background:"none", border:"none", padding:"8px", color:"rgba(255,255,255,0.3)", fontSize:11, cursor:"pointer" }}>Cancelar</button>
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
              </>
            )}

            {/* SHOP */}
            {foodTab === "shop" && (
              <>
                <div style={{ background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:14, padding:12, marginBottom:16, fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>
                  📅 Haz esta compra <strong style={{color:ACC}}>el domingo</strong>. Marca lo que ya tienes. Lo que no está en casa no puedes comerlo mal.
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
                  {Object.keys(SHOPPING).map(cat => (
                    <button key={cat} onClick={() => setShopCat(cat)} style={{ background:shopCat===cat?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.04)", border:shopCat===cat?`1px solid ${ACC}50`:"1px solid rgba(255,255,255,0.08)", borderRadius:100, padding:"5px 12px", color:shopCat===cat?ACC:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      {cat}
                    </button>
                  ))}
                </div>
                {SHOPPING[shopCat].map((item,i) => {
                  const k = `${shopCat}::${item}`;
                  const done = shopDone[k];
                  return (
                    <button key={i} onClick={() => persistShop({...shopDone,[k]:!done})} style={{ width:"100%", background:"none", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"12px 4px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", color:"inherit" }}>
                      <div style={{ width:22, height:22, borderRadius:6, background:done?"#34d399":"rgba(255,255,255,0.07)", border:done?"none":"1.5px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#080810", flexShrink:0 }}>{done?"✓":""}</div>
                      <div style={{ fontSize:13, color:done?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.8)", textDecoration:done?"line-through":"none", textAlign:"left" }}>{item}</div>
                    </button>
                  );
                })}
                <button onClick={() => persistShop({})} style={{ width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:12, color:"rgba(255,255,255,0.35)", fontSize:12, cursor:"pointer", marginTop:16 }}>
                  Reiniciar lista (nueva semana)
                </button>
              </>
            )}

            {/* SNACKS */}
            {foodTab === "snacks" && (
              <>
                <div style={{ background:"rgba(168,85,247,0.08)", border:"1px solid rgba(168,85,247,0.2)", borderRadius:14, padding:12, marginBottom:16, fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>
                  🧠 <strong style={{color:"#c084fc"}}>Antes de picar:</strong> bebe un vaso de agua y espera 5 min. A veces es sed o ansiedad, no hambre real.
                </div>
                {SNACKS.map((s,i) => (
                  <div key={i} style={{ ...card({ marginBottom:10, padding:14, display:"flex", gap:12 }) }}>
                    <div style={{ fontSize:26, width:44, height:44, background:"rgba(255,255,255,0.05)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:1.5, fontWeight:700, marginBottom:3 }}>{s.when.toUpperCase()}</div>
                      <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{s.name}</div>
                      <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", lineHeight:1.5 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* PORTIONS */}
            {foodTab === "portions" && (
              <>
                <div style={{ background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:14, padding:12, marginBottom:16, fontSize:12, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>
                  ✋ <strong style={{color:"#34d399"}}>Sin pesar nada.</strong> Tu mano siempre está contigo y es proporcional a tu cuerpo.
                </div>
                {PORTIONS.map((p,i) => {
                  const isOpen = openPortion === i;
                  const pc = p.visual==="free"?"#34d399":ACC;
                  return (
                    <div key={i} style={{ ...card({ marginBottom:8 }) }}>
                      <button onClick={() => setOpenPortion(isOpen?null:i)} style={{ width:"100%", background:"none", border:"none", padding:"13px 14px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", color:"inherit" }}>
                        <div style={{ fontSize:24, width:40, height:40, background:"rgba(255,255,255,0.05)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{p.emoji}</div>
                        <div style={{ flex:1, textAlign:"left" }}>
                          <div style={{ fontSize:14, fontWeight:700 }}>{p.food}</div>
                          <div style={{ fontSize:11, color:pc, fontWeight:600, marginTop:2 }}>{p.rule} · {p.grams}</div>
                        </div>
                        <div style={{ color:"rgba(255,255,255,0.2)", fontSize:14 }}>{isOpen?"▲":"▼"}</div>
                      </button>
                      {isOpen && (
                        <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"4px 14px 16px" }}>
                          <PortionVisual type={p.visual} color={pc} />
                          <div style={{ background:pc+"10", border:`1px solid ${pc}25`, borderRadius:10, padding:"10px 12px", fontSize:12, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>💡 {p.desc}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TRAINING SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {section === "training" && (
        <>
          <div style={{ background:"#0c0c1a", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"16px 18px 0", position:"sticky", top:0, zIndex:50 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <button onClick={() => setSection("home")} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:10, width:34, height:34, cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:18 }}>←</button>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, color:"#fff", lineHeight:1 }}>ENTRENO</div>
                <div style={{ fontSize:10, color:nextT.color, fontWeight:700, letterSpacing:1 }}>HOY TOCA: {nextT.label} {nextT.emoji}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <div style={{ textAlign:"center", background:"rgba(255,255,255,0.05)", borderRadius:10, padding:"6px 10px" }}>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, color:ACC, lineHeight:1 }}>{weekSessions}/4</div>
                  <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", fontWeight:700 }}>SEMANA</div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex" }}>
              {[["calendar","📅","Calendario"],["progress","📈","Progreso"]].map(([id,ico,label]) => (
                <button key={id} onClick={() => setTrainTab(id)} style={{ flex:1, background:"none", border:"none", borderBottom:trainTab===id?`2px solid ${ACC}`:"2px solid transparent", color:trainTab===id?ACC:"rgba(255,255,255,0.3)", padding:"8px 2px 11px", cursor:"pointer", fontSize:10, fontWeight:700, letterSpacing:0.5 }}>
                  <div style={{ fontSize:17, marginBottom:3 }}>{ico}</div>{label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding:"18px 16px 90px" }}>

            {/* CALENDAR */}
            {trainTab === "calendar" && (
              <>
                {/* Month nav */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <button onClick={() => setViewMonth(p => { const d=new Date(p.y,p.m-1); return {y:d.getFullYear(),m:d.getMonth()}; })} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:10, width:36, height:36, cursor:"pointer", color:"#fff", fontSize:16 }}>‹</button>
                  <div style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:2 }}>{MONTH_NAMES[viewMonth.m]} {viewMonth.y}</div>
                  <button onClick={() => setViewMonth(p => { const d=new Date(p.y,p.m+1); return {y:d.getFullYear(),m:d.getMonth()}; })} style={{ background:"rgba(255,255,255,0.06)", border:"none", borderRadius:10, width:36, height:36, cursor:"pointer", color:"#fff", fontSize:16 }}>›</button>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
                  {DAY_HEADERS.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.22)", padding:"3px 0" }}>{d}</div>)}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:18 }}>
                  {Array.from({length:first}).map((_,i) => <div key={`e${i}`}/>)}
                  {Array.from({length:total}).map((_,i) => {
                    const day = i+1;
                    const date = new Date(viewMonth.y, viewMonth.m, day);
                    const k = dateKey(date);
                    const sess = sessions[k];
                    const isToday = k === TK;
                    const isFuture = date > TODAY;
                    const t = sess?.trainingId ? TRAININGS.find(x=>x.id===sess.trainingId) : null;
                    return (
                      <button key={day} onClick={() => openDayModal(viewMonth.y, viewMonth.m, day)} style={{ aspectRatio:"1", borderRadius:9, border:isToday?`2px solid ${ACC}`:t?`1.5px solid ${t.color}50`:"1.5px solid rgba(255,255,255,0.07)", background:t?t.color+"18":isToday?ACC+"10":"rgba(255,255,255,0.03)", cursor:isFuture?"default":"pointer", color:isFuture?"rgba(255,255,255,0.18)":"#fff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:2, gap:1 }}>
                        <div style={{ fontSize:10, fontWeight:isToday?800:500, color:isToday?ACC:t?t.color:"rgba(255,255,255,0.65)" }}>{day}</div>
                        {t && <div style={{ fontSize:11 }}>{t.emoji}</div>}
                        {sess?.yoga && !t && <div style={{ fontSize:10 }}>🧘</div>}
                        {sess?.yoga && t && <div style={{ fontSize:7, color:"#a78bfa" }}>yoga</div>}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}>
                  {TRAININGS.map(t => (
                    <div key={t.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <div style={{ width:9, height:9, borderRadius:2, background:t.color }}/>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>{t.label}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ fontSize:10 }}>🧘</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.45)" }}>Yoga</span>
                  </div>
                </div>

                {/* Recent */}
                {secT("ÚLTIMAS SESIONES")}
                {Object.entries(sessions).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,5).map(([k,s]) => {
                  const t = s.trainingId ? TRAININGS.find(x=>x.id===s.trainingId) : null;
                  const parts = k.split("-");
                  const d = new Date(+parts[0],+parts[1],+parts[2]);
                  return (
                    <div key={k} style={{ ...card({ marginBottom:8, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }) }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:t?t.color+"20":"rgba(167,139,250,0.15)", border:`1px solid ${t?t.color+"40":"rgba(167,139,250,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                        {t?t.emoji:"🧘"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:t?t.color:"#a78bfa" }}>
                          {t?t.label:"Solo yoga"}
                          {s.yoga && t && <span style={{ fontSize:10, color:"#a78bfa", marginLeft:6 }}>+ yoga</span>}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{d.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</div>
                        {s.note && <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:3, fontStyle:"italic" }}>"{s.note}"</div>}
                      </div>
                    </div>
                  );
                })}
                {!Object.keys(sessions).length && (
                  <div style={{ textAlign:"center", padding:"30px 20px", color:"rgba(255,255,255,0.2)", fontSize:13 }}>Toca cualquier día para registrar tu primera sesión 💪</div>
                )}
              </>
            )}

            {/* PROGRESS */}
            {trainTab === "progress" && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
                  {[
                    { val:totalSessions, label:"TOTAL", color:ACC },
                    { val:`${weekSessions}/4`, label:"SEMANA", color:weekSessions>=4?"#34d399":weekSessions>=2?"#f59e0b":"#f87171" },
                    { val:yogaWeek, label:"YOGA", color:"#a78bfa" },
                  ].map(s => (
                    <div key={s.label} style={{ ...card({ padding:"14px 10px", textAlign:"center" }) }}>
                      <div style={{ fontFamily:"'Bebas Neue'", fontSize:32, color:s.color, lineHeight:1 }}>{s.val}</div>
                      <div style={{ fontSize:8.5, color:"rgba(255,255,255,0.3)", fontWeight:700, letterSpacing:0.5, marginTop:3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {secT("POR TRAINING")}
                <div style={{ ...card({ padding:14, marginBottom:20 }) }}>
                  {TRAININGS.map(t => {
                    const count = Object.values(sessions).filter(s=>s.trainingId===t.id).length;
                    const pct = totalSessions>0?(count/totalSessions)*100:0;
                    return (
                      <div key={t.id} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <div style={{ fontSize:12, fontWeight:600 }}>{t.emoji} {t.label}</div>
                          <div style={{ fontSize:12, color:t.color, fontWeight:700 }}>{count}x</div>
                        </div>
                        <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:100 }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:t.color, borderRadius:100, transition:"width 0.5s" }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {secT("PESO Y CINTURA")}
                <button onClick={() => { setMeasInput({weight:"",waist:""}); setMeasOpen(true); }} style={{ width:"100%", background:ACC+"15", border:`1px solid ${ACC}40`, borderRadius:14, padding:13, color:ACC, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:14 }}>
                  + Registrar medición de hoy
                </button>

                {measHistory.length > 0 && (
                  <>
                    <div style={{ ...card({ padding:14, marginBottom:14 }) }}>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:700, marginBottom:10 }}>TENDENCIA PESO (kg)</div>
                      <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
                        {measHistory.slice(-8).map((m,i,arr) => {
                          const vals = arr.map(x=>parseFloat(x.weight)).filter(Boolean);
                          const min = Math.min(...vals)-1, max = Math.max(...vals)+1;
                          const h = vals.length>1?((parseFloat(m.weight)-min)/(max-min))*50+10:30;
                          const isLast = i===arr.length-1;
                          return (
                            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                              <div style={{ fontSize:8, color:isLast?ACC:"rgba(255,255,255,0.25)", fontWeight:700 }}>{m.weight}</div>
                              <div style={{ width:"100%", height:h, background:isLast?ACC:ACC+"40", borderRadius:"4px 4px 0 0", transition:"height 0.4s" }}/>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {measHistory.slice().reverse().slice(0,6).map((m,i) => (
                      <div key={i} style={{ ...card({ marginBottom:8, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }) }}>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{m.date}</div>
                        <div style={{ display:"flex", gap:14 }}>
                          {m.weight && <div style={{ fontSize:13, fontWeight:700 }}><span style={{ color:"rgba(255,255,255,0.35)", fontSize:10 }}>PESO </span>{m.weight}kg</div>}
                          {m.waist && <div style={{ fontSize:13, fontWeight:700 }}><span style={{ color:"rgba(255,255,255,0.35)", fontSize:10 }}>CINTURA </span>{m.waist}cm</div>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ══ DAY MODAL ══ */}
      {activeDay && draft && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={() => { setActiveDay(null); setDraft(null); }}>
          <div style={{ background:"#13131f", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:500, padding:20, paddingBottom:36, maxHeight:"85vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36, height:4, background:"rgba(255,255,255,0.15)", borderRadius:100, margin:"0 auto 16px" }}/>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:20, letterSpacing:2, marginBottom:16 }}>
              {(() => { const p=activeDay.split("-"); const d=new Date(+p[0],+p[1],+p[2]); return d.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"}); })()}
            </div>
            <div style={{ fontSize:10, letterSpacing:2, fontWeight:800, color:"rgba(255,255,255,0.3)", marginBottom:10 }}>ENTRENAMIENTO</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {[{id:null,label:"Sin entreno",emoji:"—",color:"#6b7280"},...TRAININGS].map(t => (
                <button key={t.id??"none"} onClick={() => setDraft(d=>({...d,trainingId:t.id}))} style={{ background:draft.trainingId===t.id?t.color+"22":"rgba(255,255,255,0.04)", border:draft.trainingId===t.id?`1.5px solid ${t.color}`:"1.5px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px 10px", cursor:"pointer", color:"inherit", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:18 }}>{t.emoji}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:draft.trainingId===t.id?t.color:"rgba(255,255,255,0.75)" }}>{t.label}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize:10, letterSpacing:2, fontWeight:800, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>YOGA NOCTURNO</div>
            <button onClick={() => setDraft(d=>({...d,yoga:!d.yoga}))} style={{ width:"100%", background:draft.yoga?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.04)", border:draft.yoga?"1.5px solid #a78bfa":"1.5px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 14px", cursor:"pointer", color:"inherit", display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <span style={{ fontSize:20 }}>🧘</span>
              <span style={{ fontSize:13, fontWeight:600, color:draft.yoga?"#a78bfa":"rgba(255,255,255,0.55)" }}>{draft.yoga?"Yoga hecho ✓":"Marcar yoga nocturno"}</span>
            </button>
            <div style={{ fontSize:10, letterSpacing:2, fontWeight:800, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>NOTA RÁPIDA (opcional)</div>
            <textarea value={draft.note||""} onChange={e=>setDraft(d=>({...d,note:e.target.value}))} placeholder="Ej: subí peso en press, buena sesión, me costó mucho..." style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px 12px", color:"#e2e2f0", fontSize:13, resize:"none", height:65, fontFamily:"'Figtree',sans-serif", marginBottom:16 }}/>
            <button onClick={saveDraft} style={{ width:"100%", background:ACC, border:"none", borderRadius:14, padding:15, color:"#080810", fontSize:15, fontWeight:800, cursor:"pointer" }}>Guardar</button>
          </div>
        </div>
      )}

      {/* ══ MEASUREMENT MODAL ══ */}
      {measOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={() => setMeasOpen(false)}>
          <div style={{ background:"#13131f", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:500, padding:20, paddingBottom:36 }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36, height:4, background:"rgba(255,255,255,0.15)", borderRadius:100, margin:"0 auto 16px" }}/>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, marginBottom:18 }}>MEDICIÓN DE HOY</div>
            {[{key:"weight",label:"PESO",unit:"kg",ph:"Ej: 84.5"},{key:"waist",label:"CINTURA",unit:"cm",ph:"Ej: 92"}].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, letterSpacing:2, fontWeight:800, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>{f.label} ({f.unit})</div>
                <input type="number" value={measInput[f.key]} onChange={e=>setMeasInput(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"13px 14px", color:"#e2e2f0", fontSize:16, fontFamily:"'Figtree',sans-serif" }}/>
              </div>
            ))}
            <button onClick={saveMeas} style={{ width:"100%", background:ACC, border:"none", borderRadius:14, padding:15, color:"#080810", fontSize:15, fontWeight:800, cursor:"pointer", marginTop:6 }}>Guardar medición</button>
          </div>
        </div>
      )}

      {/* ══ CHECK-IN MODAL ══ */}
      {checkinOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={() => setCheckinOpen(false)}>
          <div style={{ background:"#13131f", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:500, padding:20, paddingBottom:36, maxHeight:"85vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:36, height:4, background:"rgba(255,255,255,0.15)", borderRadius:100, margin:"0 auto 16px" }}/>
            <div style={{ fontFamily:"'Bebas Neue'", fontSize:22, letterSpacing:2, marginBottom:6 }}>CHECK-IN SEMANAL</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:20 }}>3 preguntas, 30 segundos</div>
            {[
              { key:"physical", label:"¿Cómo te sientes físicamente?", opts:["Muy mal","Regular","Bien","Muy bien"] },
              { key:"anxiety", label:"¿Cómo está la ansiedad?", opts:["Muy alta","Alta","Controlada","Tranquila"] },
              { key:"training", label:"¿Cumpliste el objetivo de entreno?", opts:["Nada","Poco","Casi","Sí, todo"] },
            ].map(q => (
              <div key={q.key} style={{ marginBottom:18 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:"rgba(255,255,255,0.8)" }}>{q.label}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6 }}>
                  {q.opts.map((opt,i) => (
                    <button key={i} onClick={() => setCheckinDraft(d=>({...d,[q.key]:i+1}))} style={{ background:checkinDraft[q.key]===i+1?ACC+"25":"rgba(255,255,255,0.04)", border:checkinDraft[q.key]===i+1?`1.5px solid ${ACC}`:"1.5px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"8px 4px", cursor:"pointer", color:checkinDraft[q.key]===i+1?ACC:"rgba(255,255,255,0.55)", fontSize:11, fontWeight:600 }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ fontSize:10, letterSpacing:2, fontWeight:800, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>NOTA (opcional)</div>
            <textarea value={checkinDraft.note} onChange={e=>setCheckinDraft(d=>({...d,note:e.target.value}))} placeholder="Algo que quieras recordar de esta semana..." style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px 12px", color:"#e2e2f0", fontSize:13, resize:"none", height:65, fontFamily:"'Figtree',sans-serif", marginBottom:16 }}/>
            <button onClick={saveCheckin} style={{ width:"100%", background:ACC, border:"none", borderRadius:14, padding:15, color:"#080810", fontSize:15, fontWeight:800, cursor:"pointer" }}>Guardar check-in</button>
          </div>
        </div>
      )}

      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:500, height:50, background:"linear-gradient(transparent, #080810)", pointerEvents:"none" }}/>
    </div>
  );
}

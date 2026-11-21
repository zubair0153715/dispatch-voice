/* DispatchVoice — AI voice agents for US truck dispatching.
   Original code. Browser-only: Web Speech API (STT + TTS), localStorage.
   All loads, brokers, trucks and rates are SIMULATED demo data. */
"use strict";

/* ================= DATA (simulated demo data) ================= */
const TRUCKS = [
  { id: "T1", driver: "Mike Carter",    truck: "Dry Van",   unit: "Unit 101", location: "Dallas, TX",     status: "Available", load: null },
  { id: "T2", driver: "Ayesha Khan",    truck: "Reefer",    unit: "Unit 207", location: "Chicago, IL",    status: "Available", load: null },
  { id: "T3", driver: "James Okafor",   truck: "Flatbed",   unit: "Unit 312", location: "Atlanta, GA",    status: "En Route",  load: "LD-104" },
  { id: "T4", driver: "Sofia Ramirez",  truck: "Step Deck", unit: "Unit 418", location: "Phoenix, AZ",    status: "Available", load: null },
  { id: "T5", driver: "David Nguyen",   truck: "Box Truck", unit: "Unit 520", location: "Columbus, OH",   status: "Loading",   load: "LD-109" },
];

const LOAD_POOL = [
  { id: "LD-101", from: "Dallas, TX",     to: "Atlanta, GA",     miles: 781,  rate: 1950, equip: "Dry Van",   broker: "Lone Star Freight (demo)", pickup: "Today 14:00" },
  { id: "LD-102", from: "Chicago, IL",    to: "Columbus, OH",    miles: 355,  rate: 1050, equip: "Reefer",    broker: "Midwest Cold Chain (demo)", pickup: "Today 16:00" },
  { id: "LD-103", from: "Houston, TX",    to: "Nashville, TN",   miles: 857,  rate: 2300, equip: "Dry Van",   broker: "Gulf Coast Logistics (demo)", pickup: "Tomorrow 08:00" },
  { id: "LD-104", from: "Atlanta, GA",    to: "Charlotte, NC",   miles: 245,  rate: 720,  equip: "Flatbed",   broker: "Peach State Hauling (demo)", pickup: "Today 10:00" },
  { id: "LD-105", from: "Phoenix, AZ",    to: "Denver, CO",      miles: 820,  rate: 2150, equip: "Step Deck", broker: "Desert Sky Transport (demo)", pickup: "Tomorrow 09:00" },
  { id: "LD-106", from: "Kansas City, MO",to: "Memphis, TN",     miles: 395,  rate: 1150, equip: "Dry Van",   broker: "Heartland Freight (demo)", pickup: "Today 18:00" },
  { id: "LD-107", from: "Columbus, OH",   to: "Indianapolis, IN",miles: 176,  rate: 560,  equip: "Box Truck", broker: "Buckeye Express (demo)", pickup: "Today 12:00" },
  { id: "LD-108", from: "Laredo, TX",     to: "Dallas, TX",      miles: 425,  rate: 1300, equip: "Reefer",    broker: "Border Fresh Logistics (demo)", pickup: "Tomorrow 07:00" },
  { id: "LD-109", from: "Columbus, OH",   to: "Pittsburgh, PA",  miles: 185,  rate: 640,  equip: "Box Truck", broker: "Buckeye Express (demo)", pickup: "Today 09:00" },
  { id: "LD-110", from: "Salt Lake City, UT", to: "Las Vegas, NV", miles: 421, rate: 1250, equip: "Flatbed", broker: "Mountain West Carriers (demo)", pickup: "Tomorrow 11:00" },
  { id: "LD-111", from: "Jacksonville, FL", to: "Savannah, GA",  miles: 140,  rate: 480,  equip: "Dry Van",   broker: "First Coast Freight (demo)", pickup: "Today 15:00" },
  { id: "LD-112", from: "Omaha, NE",      to: "Des Moines, IA",  miles: 135,  rate: 520,  equip: "Reefer",    broker: "Prairie Cold Chain (demo)", pickup: "Today 13:00" },
];

const AGENTS = [
  { id: "zara",    name: "Zara",    role: "Load Finder",     emoji: "🔍", pitch: 1.15, rate: 1.05,
    desc: "Scans the (simulated) load board, matches loads to your trucks by equipment, lane and $/mile.",
    greeting: "Hi, this is Zara, your load finder at DispatchVoice. Tell me which truck is free, or the equipment type, and I will find the best paying load for it." },
  { id: "omar",    name: "Omar",    role: "Rate Negotiator", emoji: "💰", pitch: 0.85, rate: 0.95,
    desc: "Calls the broker and negotiates the rate up from the posted rate — ask, counter, hold, then accept or walk away.",
    greeting: "Omar here, rate negotiator. Give me a load number and the posted rate, and I will push the broker up. I never accept the first offer." },
  { id: "daniyal", name: "Daniyal", role: "Dispatcher",      emoji: "🗺️", pitch: 1.0,  rate: 1.0,
    desc: "Assigns the load, plans the route, gives pickup and delivery instructions, and handles delays.",
    greeting: "Daniyal, dispatch. Which load are we moving today, and which driver is taking it? I will lay out pickup, route and delivery." },
  { id: "sara",    name: "Sara",    role: "Check-Call Agent",emoji: "📞", pitch: 1.2,  rate: 1.05,
    desc: "Calls drivers for status updates — loaded, en route, delivered — logs every check-call and flags delays.",
    greeting: "Hi, Sara from DispatchVoice check-calls. Driver, are you loaded, en route, or delivered? And is everything on schedule?" },
  { id: "bilal",   name: "Bilal",   role: "Paperwork Agent", emoji: "📄", pitch: 0.9,  rate: 0.95,
    desc: "Collects the bill of lading, proof of delivery and rate confirmation — reads the checklist aloud, item by item.",
    greeting: "Bilal here, paperwork. I will walk you through the document checklist for this load — bill of lading, proof of delivery, and rate confirmation." },
  { id: "hina",    name: "Hina",    role: "Billing Agent",   emoji: "🧾", pitch: 1.1,  rate: 1.0,
    desc: "Builds the invoice from the delivered load, explains detention and layover charges, and confirms factoring.",
    greeting: "Hello, Hina from billing. I have your delivered load ready to invoice. I will walk through the charges, detention if any, and confirm factoring." },
];

const SCENARIOS = [
  { id: "find-load",   agent: "zara",    label: "Find a load for a free truck" },
  { id: "negotiate",   agent: "omar",    label: "Negotiate a load rate with a broker" },
  { id: "dispatch",    agent: "daniyal", label: "Dispatch a load to a driver" },
  { id: "checkcall",   agent: "sara",    label: "Driver check-call (status update)" },
  { id: "paperwork",   agent: "bilal",   label: "Collect BOL / POD / rate confirmation" },
  { id: "billing",     agent: "hina",    label: "Invoice walkthrough + factoring" },
];

/* ================= STATE ================= */
const state = {
  loads: LOAD_POOL.map(l => ({ ...l, status: l.id === "LD-104" || l.id === "LD-109" ? "Booked" : "Open" })),
  booked: [],          // {loadId, truckId, driver, finalRate, postedRate, uplift, miles, lane}
  callLog: loadLog(),  // from localStorage
  activeCall: null,    // {agent, scenario, step, data, lines[], startedAt, timer}
};

function loadLog() {
  try { return JSON.parse(localStorage.getItem("dispatchvoice_calls") || "[]"); }
  catch (e) { return []; }
}
function saveLog() {
  try { localStorage.setItem("dispatchvoice_calls", JSON.stringify(state.callLog)); } catch (e) {}
}
const $ = id => document.getElementById(id);
const money = n => "$" + Number(n).toLocaleString("en-US");
const rpm = l => (l.rate / l.miles).toFixed(2);

/* ================= TABS ================= */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    $("tab-" + btn.dataset.tab).classList.add("active");
    if (btn.dataset.tab === "log") renderLog();
    if (btn.dataset.tab === "analytics") renderAnalytics();
  });
});

/* ================= DISPATCH BOARD ================= */
function renderTrucks() {
  $("truckCards").innerHTML = TRUCKS.map(t => {
    const badge = t.status === "Available" ? "badge" : t.status === "Off Duty" ? "badge off" : "badge busy";
    return `<div class="card">
      <h4>${t.driver} <span class="${badge}">${t.status}</span></h4>
      <p>${t.unit} · ${t.truck}</p>
      <p>📍 ${t.location}</p>
      <p>${t.load ? "Load: <b>" + t.load + "</b>" : "No active load"}</p>
    </div>`;
  }).join("");
}

function renderActiveLoads() {
  const el = $("activeLoads");
  if (!state.booked.length) {
    el.innerHTML = `<p class="muted">No loads booked yet this session. Book one from the load board below, or let Zara find one by voice.</p>`;
    return;
  }
  el.innerHTML = `<div class="cards">` + state.booked.map(b => `
    <div class="card"><h4>${b.loadId} — ${b.lane}</h4>
      <p>Driver: ${b.driver} · ${b.miles} miles</p>
      <p>Final rate: <span class="big">${money(b.finalRate)}</span> (${rpm({ rate: b.finalRate, miles: b.miles })} $/mile)</p>
      <p>Posted: ${money(b.postedRate)} · Negotiation uplift: <b style="color:#4ade80">+${money(b.uplift)}</b></p>
    </div>`).join("") + `</div>`;
}

function renderBoard() {
  const equip = $("equipFilter").value, sort = $("sortBoard").value;
  let list = state.loads.filter(l => l.status === "Open");
  if (equip) list = list.filter(l => l.equip === equip);
  list.sort((a, b) => sort === "rate-desc" ? b.rate - a.rate : sort === "miles-asc" ? a.miles - b.miles : (b.rate / b.miles) - (a.rate / a.miles));
  $("loadCards").innerHTML = list.length ? list.map(l => `
    <div class="card load-card">
      <p class="lane">${l.from} → ${l.to}</p>
      <p>${l.id} · ${l.equip} · ${l.miles} miles · Pickup ${l.pickup}</p>
      <p>Broker: ${l.broker}</p>
      <p>Rate: <span class="big">${money(l.rate)}</span> · <span class="rpm">${rpm(l)} $/mile</span></p>
      <button class="btn primary" onclick="bookLoad('${l.id}')">📦 Book this load</button>
      <button class="btn" onclick="negotiateLoad('${l.id}')">💰 Negotiate (Omar)</button>
    </div>`).join("") : `<p class="muted">No open loads match this filter.</p>`;
  renderTopStats();
}

function renderTopStats() {
  const booked = state.booked.length;
  const revenue = state.booked.reduce((s, b) => s + b.finalRate, 0);
  const uplift = state.booked.reduce((s, b) => s + b.uplift, 0);
  const avgRpm = booked ? (state.booked.reduce((s, b) => s + b.finalRate / b.miles, 0) / booked).toFixed(2) : "—";
  $("topStats").innerHTML = `
    <div class="stat"><b>${booked}</b><span>loads booked</span></div>
    <div class="stat"><b>${money(revenue)}</b><span>booked revenue</span></div>
    <div class="stat"><b>${avgRpm}</b><span>avg $/mile</span></div>
    <div class="stat"><b>+$${uplift}</b><span>negotiation uplift</span></div>`;
}

window.bookLoad = function (loadId) {
  const load = state.loads.find(l => l.id === loadId);
  const truck = TRUCKS.find(t => t.status === "Available");
  if (!load || load.status !== "Open") return;
  if (!truck) { alert("No truck is Available right now. Free one up first (demo: all trucks reset on page reload)."); return; }
  load.status = "Booked";
  truck.status = "En Route"; truck.load = loadId;
  state.booked.push({ loadId, truckId: truck.id, driver: truck.driver, finalRate: load.rate, postedRate: load.rate, uplift: 0, miles: load.miles, lane: load.from + " → " + load.to });
  renderTrucks(); renderBoard(); renderActiveLoads();
};

window.negotiateLoad = function (loadId) {
  switchTab("calls");
  $("agentSelect").value = "omar";
  syncScenarios();
  $("scenarioSelect").value = "negotiate";
  startCall("omar", "negotiate", { loadId });
};

function switchTab(name) {
  document.querySelector(`.tab[data-tab="${name}"]`).click();
}

function refreshBoard() {
  // Simulated refresh: shuffle a couple of posted rates slightly, keep it honest.
  state.loads.filter(l => l.status === "Open").forEach(l => {
    if (Math.random() < 0.4) l.rate = Math.max(300, Math.round(l.rate * (0.95 + Math.random() * 0.1) / 10) * 10);
  });
  renderBoard();
}
$("refreshBoardBtn").addEventListener("click", refreshBoard);
$("equipFilter").addEventListener("change", renderBoard);
$("sortBoard").addEventListener("change", renderBoard);

/* ================= VOICE ENGINE (Web Speech API) ================= */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSTT = !!SpeechRec;
const hasTTS = "speechSynthesis" in window;
let recognition = null, listening = false, speaking = false;

if (!hasSTT) {
  const n = $("voiceSupport");
  n.textContent = "⚠️ Speech recognition is not available in this browser — use Chrome or Edge for voice, or type your replies below. The agent will still speak.";
  n.classList.add("show");
}

function pickVoice(agent) {
  const voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith("en"));
  if (!voices.length) return null;
  const idx = AGENTS.findIndex(a => a.id === agent.id);
  const pref = voices.find(v => /google us english/i.test(v.name)) || voices[0];
  // Spread agents across available voices so each sounds different.
  return voices[(idx * 2 + (agent.pitch > 1 ? 1 : 0)) % voices.length] || pref;
}

function speak(text, agent, onEnd) {
  if (!hasTTS) { if (onEnd) onEnd(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = agent.pitch; u.rate = agent.rate;
  const v = pickVoice(agent);
  if (v) u.voice = v;
  u.onstart = () => { speaking = true; setCallState("speaking", "🗣️ Agent speaking… (speak to interrupt)"); };
  u.onend = () => { speaking = false; if (onEnd) onEnd(); };
  u.onerror = () => { speaking = false; if (onEnd) onEnd(); };
  speechSynthesis.speak(u);
}

function startListening() {
  if (!hasSTT || !state.activeCall) return;
  try { if (recognition) recognition.stop(); } catch (e) {}
  recognition = new SpeechRec();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = e => {
    const text = e.results[0][0].transcript.trim();
    handleUserTurn(text, "voice");
  };
  recognition.onerror = () => { listening = false; setMic("🎤 Mic: error — type your reply instead"); };
  recognition.onend = () => { listening = false; if (state.activeCall) setMic("🎤 Mic: idle"); };
  try {
    recognition.start();
    listening = true;
    setMic("🎤 Mic: listening…");
    setCallState("listening", "👂 Listening…");
  } catch (e) { setMic("🎤 Mic: could not start — type instead"); }
}

/* Barge-in: user speech (or the Interrupt button) cancels the agent mid-sentence. */
function bargeIn() {
  if (speaking) speechSynthesis.cancel();
  speaking = false;
  setCallState("listening", "✋ Interrupted — listening to you…");
  startListening();
}
$("interruptBtn").addEventListener("click", bargeIn);

function setMic(t) { $("micStatus").textContent = t; }
function setCallState(cls, t) {
  const el = $("callState");
  el.className = cls === "speaking" ? "state-speaking" : cls === "listening" ? "state-listening" : "state-idle";
  el.textContent = t;
}

/* ================= DIALOGUE ENGINES (one per agent) ================= */
/* Each engine: step-based. handleUserTurn routes the user's words through it.
   intents are keyword-based and forgiving (yes/no, numbers, status words). */
const yesRe = /\b(yes|yeah|yep|sure|ok|okay|correct|right|good|go ahead|book it|accept)\b/i;
const noRe = /\b(no|nope|not|reject|pass|skip|walk away)\b/i;
const numRe = /\$?\s?(\d{2,5}(?:,\d{3})?)/;

function findLoad(id) { return state.loads.find(l => l.id === String(id).toUpperCase()); }

const ENGINES = {
  /* --- Zara: find a load --- */
  zara(call, text) {
    const d = call.data;
    if (call.step === 0) {
      const equipMatch = ["dry van", "reefer", "flatbed", "step deck", "box truck"].find(e => text.toLowerCase().includes(e));
      const truck = TRUCKS.find(t => text.toLowerCase().includes(t.driver.split(" ")[0].toLowerCase()));
      d.equip = equipMatch || (truck ? truck.truck : null);
      const matches = state.loads.filter(l => l.status === "Open" && (!d.equip || l.equip.toLowerCase() === d.equip.toLowerCase()))
        .sort((a, b) => (b.rate / b.miles) - (a.rate / a.miles)).slice(0, 3);
      if (!matches.length) return { say: "I checked the board and found no open loads for that equipment right now. Try another equipment type, or refresh the board.", done: false };
      d.matches = matches;
      call.step = 1;
      const list = matches.map((m, i) => `Option ${i + 1}: ${m.id}, ${m.from} to ${m.to}, ${m.miles} miles, ${money(m.rate)}, that's ${rpm(m)} dollars a mile`).join(". ");
      return { say: `Here are the top ${matches.length} paying loads${d.equip ? " for " + d.equip : ""}. ${list}. Which option do you want — say option 1, 2 or 3?`, done: false };
    }
    if (call.step === 1) {
      const n = parseInt((text.match(/[123]/) || [])[0] || "0", 10);
      const pick = d.matches && d.matches[n - 1];
      if (!pick) return { say: "I did not catch which option. Say option 1, 2 or 3.", done: false };
      call.step = 2; d.pick = pick;
      return { say: `${pick.id}, ${pick.from} to ${pick.to}, ${money(pick.rate)} for ${pick.miles} miles. Shall I book it for your free truck, or hand it to Omar to negotiate the rate first? Say book it, or negotiate.`, done: false };
    }
    if (yesRe.test(text) || /book/i.test(text)) {
      bookLoad(d.pick.id);
      return { say: `Booked. ${d.pick.id} is now assigned and on your dispatch board. Anything else?`, done: true };
    }
    if (/negotiat/i.test(text)) {
      return { say: "Good call — handing you to Omar for the negotiation. Start a new call with Omar and pick the negotiate scenario.", done: true, handoff: "omar" };
    }
    return { say: "Say book it to confirm, or negotiate to push the rate up first.", done: false };
  },

  /* --- Omar: negotiate --- */
  omar(call, text) {
    const d = call.data;
    if (call.step === 0) {
      const load = d.loadId ? findLoad(d.loadId) : findLoad((text.match(/LD-\d+/i) || [])[0]);
      const posted = load ? load.rate : (parseInt(((text.match(numRe) || [])[1] || "").replace(",", ""), 10) || 0);
      if (!load && !posted) return { say: "Give me the load number, like LD-101, or the posted rate, and I will start the negotiation.", done: false };
      d.load = load; d.posted = posted;
      d.target = Math.round(posted * 1.12);   // ask +12%
      d.floor = Math.round(posted * 1.05);    // walk away below +5%
      d.round = 1;
      call.step = 1;
      return { say: `Posted rate is ${money(posted)}${load ? " for " + load.id + ", " + load.from + " to " + load.to : ""}. I am calling the broker now. I will open at ${money(d.target)} — twelve percent over posted. Broker, what is your best rate? Go ahead and answer as the broker.`, done: false, brokerTurn: true };
    }
    const offer = parseInt(((text.match(numRe) || [])[1] || "").replace(",", ""), 10) || 0;
    if (!offer) {
      if (noRe.test(text)) return { say: "No number yet. Broker, give me a dollar figure — what can you do on this load?", done: false, brokerTurn: true };
      return { say: "I need a dollar figure from the broker. What rate are you offering?", done: false, brokerTurn: true };
    }
    d.lastOffer = offer;
    if (offer >= d.target) {
      call.step = 9;
      return { say: `Done — ${money(offer)} accepted. That is ${money(offer - d.posted)} over the posted rate. I will mark this load negotiated.`, done: true, finalRate: offer };
    }
    if (d.round >= 3) {
      if (offer >= d.floor) {
        call.step = 9;
        return { say: `Three rounds is enough — I will take ${money(offer)}. That is still ${money(offer - d.posted)} over posted. Deal closed.`, done: true, finalRate: offer };
      }
      return { say: `Broker, ${money(offer)} is below my floor of ${money(d.floor)}. I have to walk away from this one — there are better loads on the board.`, done: true, walkedAway: true };
    }
    d.round++;
    const counter = Math.round((offer + d.target) / 2);
    return { say: `${money(offer)} is too low — the truck costs more than that to run. Meet me at ${money(counter)} and we have a deal. What do you say, broker?`, done: false, brokerTurn: true };
  },

  /* --- Daniyal: dispatch --- */
  daniyal(call, text) {
    const d = call.data;
    if (call.step === 0) {
      const load = findLoad((text.match(/LD-\d+/i) || [])[0]);
      const truck = TRUCKS.find(t => text.toLowerCase().includes(t.driver.split(" ")[0].toLowerCase()));
      if (!load) return { say: "Which load are we dispatching? Give me the load number, like LD-101.", done: false };
      d.load = load; d.truck = truck || TRUCKS.find(t => t.status === "Available");
      call.step = 1;
      return { say: `${load.id}: pickup ${load.from}, ${load.pickup}. Delivery ${load.to}, ${load.miles} miles. Driver ${d.truck ? d.truck.driver : "to be assigned"}. Confirm the driver is ready to roll — say yes to dispatch, or no to hold.`, done: false };
    }
    if (call.step === 1) {
      if (yesRe.test(text)) {
        if (d.load.status === "Open") bookLoad(d.load.id);
        call.step = 2;
        return { say: `Dispatched. Route: ${d.load.from} to ${d.load.to} via the interstate, ${d.load.miles} miles, about ${Math.round(d.load.miles / 55)} hours driving. Driver, call Sara for check-calls on the road. Any delay — tell me now, or say all good.`, done: false };
      }
      if (noRe.test(text)) return { say: "Holding the load. Tell me when the driver is ready and I will dispatch.", done: true };
      return { say: "Say yes to dispatch now, or no to hold it.", done: false };
    }
    if (/delay/i.test(text) || /traffic|breakdown|late/i.test(text)) {
      return { say: "Delay noted — I am informing the broker and pushing the delivery window. Driver, keep me updated every hour. I have flagged this load as delayed on the board.", done: true, delayed: true };
    }
    return { say: "All good — drive safe. Check in with Sara at pickup and delivery.", done: true };
  },

  /* --- Sara: check-call --- */
  sara(call, text) {
    const d = call.data;
    if (call.step === 0) {
      const truck = TRUCKS.find(t => text.toLowerCase().includes(t.driver.split(" ")[0].toLowerCase()));
      d.truck = truck || TRUCKS.find(t => t.load) || TRUCKS[2];
      call.step = 1;
      return { say: `Check-call for driver ${d.truck.driver}${d.truck.load ? ", load " + d.truck.load : ""}. What is your status — loaded, en route, or delivered?`, done: false };
    }
    const t = text.toLowerCase();
    if (/\bdelivered\b/.test(t)) {
      call.step = 9;
      return { say: "Delivered — thank you. I am logging the delivery and handing the load to Bilal for paperwork and Hina for billing. Safe parking, driver.", done: true, status: "delivered" };
    }
    if (/\bloaded\b/.test(t)) {
      call.step = 2;
      return { say: "Loaded, copy that. Are you rolling on time, or is there a delay I should flag?", done: false, status: "loaded" };
    }
    if (/en route|on the road|driving|rolling/.test(t)) {
      call.step = 2;
      return { say: "En route, copy that. How many miles to delivery, and are you on schedule?", done: false, status: "en route" };
    }
    if (call.step === 2) {
      if (/delay|late|behind|traffic/.test(t)) return { say: "Delay flagged — I am notifying dispatch and the broker now. Keep me posted, driver.", done: true, delayed: true };
      return { say: "On schedule — logged. Next check-call in two hours. Drive safe.", done: true };
    }
    return { say: "I need a status word: loaded, en route, or delivered.", done: false };
  },

  /* --- Bilal: paperwork --- */
  bilal(call, text) {
    const d = call.data;
    d.items = d.items || [
      { key: "bol", label: "Bill of Lading (BOL)", done: false },
      { key: "pod", label: "Proof of Delivery (POD)", done: false },
      { key: "ratecon", label: "Rate Confirmation", done: false },
    ];
    if (call.step === 0) {
      const load = findLoad((text.match(/LD-\d+/i) || [])[0]);
      d.load = load || state.loads.find(l => l.status === "Booked");
      call.step = 1; d.idx = 0;
      return { say: `Paperwork for ${d.load ? d.load.id : "this load"}. Three documents. First: the Bill of Lading — do you have it signed? Say yes, or no.`, done: false };
    }
    const item = d.items[d.idx];
    if (yesRe.test(text)) {
      item.done = true;
      d.idx++;
      if (d.idx >= d.items.length) {
        return { say: "All three documents confirmed — BOL, POD and rate confirmation. The file is complete and ready for Hina to invoice.", done: true };
      }
      const next = d.items[d.idx];
      return { say: `${item.label} confirmed. Next: ${next.label} — do you have it? Say yes, or no.`, done: false };
    }
    if (noRe.test(text)) {
      return { say: `${item.label} is missing. Please send a clear photo of it before we can invoice. I will keep this file open — say the document name again when you have it.`, done: false };
    }
    return { say: `Please answer yes or no for the ${item.label}.`, done: false };
  },

  /* --- Hina: billing --- */
  hina(call, text) {
    const d = call.data;
    if (call.step === 0) {
      const booked = state.booked[0];
      const load = findLoad((text.match(/LD-\d+/i) || [])[0]);
      d.amount = load ? load.rate : (booked ? booked.finalRate : 1800);
      d.loadId = load ? load.id : (booked ? booked.loadId : "LD-101");
      d.detention = 0;
      call.step = 1;
      return { say: `Invoice for ${d.loadId}: line haul ${money(d.amount)}. Was there any detention at pickup or delivery? If yes, tell me the hours — detention pays 65 dollars an hour after the first two free hours.`, done: false };
    }
    if (call.step === 1) {
      const hrs = parseInt(((text.match(/(\d+)\s*(hour|hr)/i) || [])[1] || "0"), 10);
      if (/no|none|zero/.test(text.toLowerCase()) || hrs === 0) {
        call.step = 2;
        return { say: `No detention — invoice total stays ${money(d.amount)}. Shall I send it to factoring at 3 percent, or direct-bill the broker on 30-day terms? Say factoring, or direct bill.`, done: false };
      }
      if (hrs > 0) {
        d.detention = Math.max(0, hrs - 2) * 65;
        call.step = 2;
        return { say: `${hrs} hours detention — first two hours free, so ${money(d.detention)} detention added. Invoice total is now ${money(d.amount + d.detention)}. Factoring at 3 percent, or direct bill on 30-day terms?`, done: false };
      }
      return { say: "Tell me the detention hours as a number, or say none.", done: false };
    }
    if (/factor/i.test(text)) {
      const total = d.amount + d.detention, fee = Math.round(total * 0.03);
      return { say: `Factored. Invoice ${money(total)}, factoring fee ${money(fee)}, you receive ${money(total - fee)} within 24 hours. Invoice closed.`, done: true, invoiced: total };
    }
    if (/direct|bill/i.test(text)) {
      return { say: `Direct-billed to the broker on 30-day terms — invoice ${money(d.amount + d.detention)}. I will chase it on day 25 if unpaid.`, done: true, invoiced: d.amount + d.detention };
    }
    return { say: "Say factoring, or direct bill.", done: false };
  },
};

/* ================= CALL LIFECYCLE ================= */
function addLine(who, text) {
  const call = state.activeCall;
  const line = { who, text, at: new Date().toLocaleTimeString() };
  if (call) call.lines.push(line);
  const box = $("transcript");
  if (call && call.lines.length === 1) box.innerHTML = "";
  const p = document.createElement("p");
  p.innerHTML = `<span class="who-${who}">${who === "agent" ? call.agent.name + ":" : who === "user" ? "You:" : "System:"}</span> ${escapeHtml(text)}
    ${who === "agent" ? `<button class="replay-btn" title="Replay this line" onclick="replayLine(this)">🔊</button>` : ""}`;
  p.dataset.text = text;
  p.dataset.agent = call ? call.agent.id : "";
  box.appendChild(p);
  box.scrollTop = box.scrollHeight;
}
function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

window.replayLine = function (btn) {
  const p = btn.closest("p");
  const agent = AGENTS.find(a => a.id === p.dataset.agent) || AGENTS[0];
  speak(p.dataset.text, agent);
};

function syncScenarios() {
  const agentId = $("agentSelect").value;
  const opts = SCENARIOS.filter(s => s.agent === agentId);
  $("scenarioSelect").innerHTML = opts.map(s => `<option value="${s.id}">${s.label}</option>`).join("");
}

function startCall(agentId, scenarioId, presetData) {
  const agent = AGENTS.find(a => a.id === agentId);
  const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS.find(s => s.agent === agentId);
  endCall(true); // close any previous call quietly
  state.activeCall = { agent, scenario, step: 0, data: presetData || {}, lines: [], startedAt: Date.now(), timer: null, outcome: "in progress" };
  $("transcript").innerHTML = "";
  $("callAgentName").textContent = `${agent.emoji} ${agent.name} — ${agent.role}`;
  $("callScenario").textContent = scenario.label;
  $("agentFace").textContent = agent.emoji;
  $("startCallBtn").disabled = true;
  $("endCallBtn").disabled = false;
  $("interruptBtn").disabled = false;
  $("textReply").disabled = false; $("sendTextBtn").disabled = false; $("listenBtn").disabled = false;
  state.activeCall.timer = setInterval(() => {
    const s = Math.floor((Date.now() - state.activeCall.startedAt) / 1000);
    $("callTimer").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }, 1000);
  agentSay(agent.greeting);
}

function agentSay(text, after) {
  addLine("agent", text);
  speak(text, state.activeCall.agent, () => {
    if (!state.activeCall) return;
    if (after) after();
    else startListening(); // agent finished -> listen for the reply
  });
}

function handleUserTurn(text, source) {
  const call = state.activeCall;
  if (!call) return;
  if (speaking) { speechSynthesis.cancel(); speaking = false; } // barge-in on voice input
  addLine("user", text + (source === "voice" ? "" : ""));
  const engine = ENGINES[call.agent.id];
  let res;
  try { res = engine(call, text); }
  catch (e) { res = { say: "Sorry, I missed that — could you say it once more?", done: false }; }
  if (res.finalRate && call.data.load) {
    // Omar closed a negotiation: record uplift on the booked load, or book it.
    const load = call.data.load;
    const uplift = res.finalRate - (call.data.posted || load.rate);
    const existing = state.booked.find(b => b.loadId === load.id);
    if (existing) { existing.finalRate = res.finalRate; existing.uplift = uplift; }
    else {
      const truck = TRUCKS.find(t => t.status === "Available");
      if (truck) {
        load.status = "Booked"; truck.status = "En Route"; truck.load = load.id;
        state.booked.push({ loadId: load.id, truckId: truck.id, driver: truck.driver, finalRate: res.finalRate, postedRate: call.data.posted || load.rate, uplift, miles: load.miles, lane: load.from + " → " + load.to });
      }
    }
    renderTrucks(); renderBoard(); renderActiveLoads();
  }
  if (res.done) {
    call.outcome = res.walkedAway ? "walked away" : res.delayed ? "delay flagged" : "completed";
    agentSay(res.say, () => setTimeout(() => endCall(false), 1200));
  } else {
    agentSay(res.say);
  }
}

function endCall(silent) {
  const call = state.activeCall;
  if (call) {
    clearInterval(call.timer);
    try { if (recognition) recognition.stop(); } catch (e) {}
    try { speechSynthesis.cancel(); } catch (e) {}
    speaking = false; listening = false;
    if (!silent) {
      call.durationSec = Math.round((Date.now() - call.startedAt) / 1000);
      call.endedAt = new Date().toISOString();
      state.callLog.unshift({ agent: call.agent.name, role: call.agent.role, scenario: call.scenario.label, outcome: call.outcome, durationSec: call.durationSec, lines: call.lines, at: call.endedAt });
      saveLog();
      addLine("sys", `Call ended — ${call.outcome}, ${call.durationSec}s, ${call.lines.length} turns. Saved to Call Log.`);
    }
    state.activeCall = null;
  }
  $("startCallBtn").disabled = false;
  $("endCallBtn").disabled = true;
  $("interruptBtn").disabled = true;
  $("textReply").disabled = true; $("sendTextBtn").disabled = true; $("listenBtn").disabled = true;
  $("callAgentName").textContent = "No active call";
  $("callScenario").textContent = ""; $("callTimer").textContent = "00:00";
  setCallState("idle", "Idle");
  setMic("🎤 Mic: idle");
}

$("startCallBtn").addEventListener("click", () => startCall($("agentSelect").value, $("scenarioSelect").value));
$("endCallBtn").addEventListener("click", () => endCall(false));
$("listenBtn").addEventListener("click", () => { if (speaking) bargeIn(); else startListening(); });
$("sendTextBtn").addEventListener("click", sendText);
$("textReply").addEventListener("keydown", e => { if (e.key === "Enter") sendText(); });
function sendText() {
  const v = $("textReply").value.trim();
  if (!v || !state.activeCall) return;
  $("textReply").value = "";
  handleUserTurn(v, "text");
}
$("agentSelect").addEventListener("change", syncScenarios);

/* ================= CALL LOG ================= */
function renderLog() {
  const el = $("callLog");
  if (!state.callLog.length) { el.innerHTML = `<p class="muted">No calls yet. Make a voice call first.</p>`; return; }
  el.innerHTML = state.callLog.map((c, i) => `
    <div class="log-entry">
      <h4>${c.agent} — ${c.role} · ${c.scenario}</h4>
      <p class="meta">${new Date(c.at).toLocaleString()} · ${c.durationSec}s · Outcome: <b>${c.outcome}</b> · ${c.lines.length} turns</p>
      ${c.lines.map(l => `<p><span class="who-${l.who}">${l.who === "agent" ? c.agent + ":" : l.who === "user" ? "You:" : "System:"}</span> ${escapeHtml(l.text)}
        ${l.who === "agent" ? `<button class="replay-btn" title="Replay" onclick="replayLogLine(${i}, ${c.lines.indexOf(l)})">🔊</button>` : ""}</p>`).join("")}
    </div>`).join("");
}
window.replayLogLine = function (ci, li) {
  const c = state.callLog[ci];
  const agent = AGENTS.find(a => a.name === c.agent) || AGENTS[0];
  speak(c.lines[li].text, agent);
};
$("clearLogBtn").addEventListener("click", () => {
  if (!confirm("Clear the whole call log?")) return;
  state.callLog = []; saveLog(); renderLog();
});

/* ================= ANALYTICS ================= */
function renderAnalytics() {
  const booked = state.booked;
  const revenue = booked.reduce((s, b) => s + b.finalRate, 0);
  const uplift = booked.reduce((s, b) => s + b.uplift, 0);
  const avgRpm = booked.length ? (booked.reduce((s, b) => s + b.finalRate / b.miles, 0) / booked.length).toFixed(2) : "—";
  const calls = state.callLog.length;
  const completed = state.callLog.filter(c => c.outcome === "completed").length;
  $("analyticsCards").innerHTML = `
    <div class="card"><h4>Loads booked</h4><p class="big">${booked.length}</p></div>
    <div class="card"><h4>Booked revenue</h4><p class="big">${money(revenue)}</p></div>
    <div class="card"><h4>Avg $/mile (booked)</h4><p class="big">${avgRpm}</p></div>
    <div class="card"><h4>Negotiation uplift</h4><p class="big">+$${uplift}</p></div>
    <div class="card"><h4>Voice calls</h4><p class="big">${calls}</p><p>${completed} completed</p></div>
    <div class="card"><h4>Demo data</h4><p>All figures are simulated practice numbers — no real money.</p></div>`;
  $("upliftTable").innerHTML = booked.length ? `<table>
    <tr><th>Load</th><th>Lane</th><th>Posted</th><th>Final</th><th>Uplift</th></tr>
    ${booked.map(b => `<tr><td>${b.loadId}</td><td>${b.lane}</td><td>${money(b.postedRate)}</td><td>${money(b.finalRate)}</td><td style="color:#4ade80">+${money(b.uplift)}</td></tr>`).join("")}
  </table>` : `<p class="muted">No negotiated loads yet — use Omar on a load to see uplift here.</p>`;
}

/* ================= AGENTS TAB ================= */
function renderAgents() {
  $("agentCards").innerHTML = AGENTS.map(a => `
    <div class="card"><h4>${a.emoji} ${a.name} — ${a.role}</h4>
      <p>${a.desc}</p>
      <p>Voice: pitch ${a.pitch}, rate ${a.rate} (distinct per agent)</p>
      <p class="muted">“${a.greeting}”</p>
      <button class="btn primary" onclick="callAgent('${a.id}')">📞 Call ${a.name}</button>
    </div>`).join("");
}
window.callAgent = function (agentId) {
  switchTab("calls");
  $("agentSelect").value = agentId;
  syncScenarios();
  startCall(agentId, $("scenarioSelect").value);
};

/* ================= INIT ================= */
$("agentSelect").innerHTML = AGENTS.map(a => `<option value="${a.id}">${a.emoji} ${a.name} — ${a.role}</option>`).join("");
syncScenarios();
renderTrucks(); renderBoard(); renderActiveLoads(); renderAgents(); renderLog(); renderAnalytics();
if ("speechSynthesis" in window) speechSynthesis.getVoices();
if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};

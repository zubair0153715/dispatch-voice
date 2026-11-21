# DispatchVoice — AI Voice Agents for Truck Dispatching

A US truck-dispatching company run by **AI voice agents** — free to run,
no API key, no paid service, no card. Everything works in the browser.

- **6 voice agents** — Zara (Load Finder), Omar (Rate Negotiator),
  Daniyal (Dispatcher), Sara (Check-Call Agent), Bilal (Paperwork Agent),
  Hina (Billing Agent)
- **Real voice calls in the browser** — mic → SpeechRecognition → agent
  dialogue engine → speechSynthesis, with **barge-in** (speak over the
  agent any time; it stops and listens). Free via the Web Speech API.
- **Live dispatch board** — 5 owner-operators, active loads, simulated
  load-board feed with lanes, miles, rates and $/mile. Book a load or
  send it to Omar to negotiate first.
- **Voice call simulator** — pick an agent + scenario, press Call, talk
  to the agent; live transcript with TTS replay of any line.
- **Call log + transcripts** saved in localStorage; analytics (loads
  booked, avg $/mile, negotiation uplift $).

## Quick start

```bash
git clone https://github.com/zubair0153715/dispatch-voice
cd dispatch-voice
# open index.html in Chrome or Edge — no server, no build step
```

Use **Chrome or Edge** for speech recognition (Web Speech API). In other
browsers the agents still speak, and you can type replies instead.

## How a call works

```
You speak (mic)
  -> browser SpeechRecognition (free, Chrome/Edge)
  -> agent dialogue engine (scripted rules per agent + scenario)
  -> reply text -> browser speechSynthesis (free, device voices)
You speak over the agent -> speech is cancelled instantly (barge-in)
```

## The six agents

| Agent | Role | What it does |
|---|---|---|
| **Zara** | Load Finder | Finds loads on the (simulated) board, matches by equipment, lane and $/mile; offers top 3, books or hands to Omar |
| **Omar** | Rate Negotiator | Negotiates the broker up from the posted rate: opens at +12%, counters, holds a +5% floor, accepts or walks away after 3 rounds |
| **Daniyal** | Dispatcher | Assigns the load, plans the route, gives pickup/delivery instructions, handles delays |
| **Sara** | Check-Call Agent | Calls drivers for status — loaded / en route / delivered — logs the check-call, flags delays |
| **Bilal** | Paperwork Agent | Walks the BOL → POD → Rate Confirmation checklist aloud, confirms each item |
| **Hina** | Billing Agent | Builds the invoice, adds detention ($65/hr after 2 free hours), explains factoring (3%) vs direct bill |

Each agent has its own voice (distinct pitch/rate) and greeting.

## Honest limits

- **Load board is simulated demo data** — no real DAT / Truckstop
  account, no real brokers, no real loads. Rates are practice numbers.
- **No real phone calls.** Voice works in the browser only. Real PSTN
  calls need Twilio or similar — paid, not included.
- **No real money.** Invoices, detention and factoring figures are demo.
- **Speech recognition needs Chrome / Edge.** Other browsers get a text
  box; the agent still answers by voice.
- **Call "recordings" are transcripts + TTS replay**, not stored audio.
  Logs live in your browser's localStorage only — nothing is uploaded.
- **No fake clients, brokers or loads** are presented as real anywhere.

## Tests

```bash
node --check app.js
node /tmp/dv-test.js   # headless DOM-stub run: 19 checks over all 6 dialogue engines
```

## Licence

MIT. Original code by Lapis for Zubair Ali / DispatchVoice.
Pattern studied from Sadaa (sadaa call-centre voice agents) — original
code, nothing copied.

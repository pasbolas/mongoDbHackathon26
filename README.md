# Anchor ⚓
> **"A privacy-first adaptive assistance system for people living with dementia that learns when NOT to intervene."**  
> Instead of constantly reminding someone what to do, Anchor learns how that individual performs familiar everyday activities, recognizes when their current behavior differs meaningfully from their personal pattern, and uses previous successful interventions to determine whether to **WAIT**, offer a subtle cue, escalate to a clearer cue, or **stop helping**.

---

## 🌟 The Core Idea

Most assistive systems assume that whenever an activity stalls, the AI should immediately tell the user what to do. For someone living with dementia, excessive prompting creates learned helplessness, frustration, and accelerates cognitive disengagement.

**Anchor asks a different question:**
> *How little does AI need to do for you? When should the system do absolutely nothing?*

1. **Silence is the Goal**: When an individual performs their routine independently, the assistant intentionally does nothing.
2. **Task Uncertainty, Not Medical Diagnosis**: Anchor does not claim "you are confused". It measures: *"Sarah's current task behavior differs from her recent successful executions."*
3. **Assistance is Bidirectional**: Dementia is progressive. If independence improves, cues vanish. If support needs increase, assistance safely recalibrates upwards.
4. **Privacy-First Architecture**: Computer vision runs strictly on local edge devices. Raw video frames are discarded immediately. Only high-level semantic event records are stored in MongoDB Atlas.

---

## 🍃 MongoDB Atlas Architecture

MongoDB Atlas serves as Anchor's **longitudinal episodic memory**:

1. **Atlas Vector Search (`$vectorSearch` over `episodes`)**:
   - Represents situations as dense semantic vectors (completed items, remaining items, inactivity duration, bag reopenings).
   - Retrieves semantically similar previous episodes using cosine similarity (e.g. *"Episode #17 (93% similarity): Inactivity after packing wallet, keys, phone — Subtle reminder successfully resolved activity"*).
2. **Actionable Triggers vs. Time-Series TTL (Section 17)**:
   - **`live_events`**: Standard Atlas collection with change streams to power real-time Atlas Database Triggers for intervention logic.
   - **`sensor_history`**: Time-series collection with automatic data expiration (`expireAfterSeconds: 604800` — 7 days) ensuring privacy data retention limits.
3. **Document Store (`task_profiles`, `session_metrics`)**:
   - Stores Sarah's per-item assistance profile (`attempts`, `independent`, `promptHistory` for subtle vs. explicit cues).

---

## 🎯 Demo MVP: Packing a Bag (Sarah)

- **Objects**: Wallet, Keys, Phone, Notebook, Water Bottle.
- **Normal Sequence**: `open_bag` → `pack_wallet` → `pack_keys` → `pack_phone` → `pack_notebook` → `pack_water` → `close_bag`.
- **The 3 Demo Executions (Section 19)**:
  - **Execution 1 (Session 1)**: Sarah packs wallet, keys, phone, and stops. Anchor waits, detects task uncertainty, and provides a subtle verbal question: *"Anything else you normally take with you?"* Sarah packs notebook. Stored as subtle cue successful.
  - **Execution 2 (Session 2)**: Sarah pauses at the same point. Atlas Vector Search retrieves Episode #17. Anchor adapts by providing an even shorter nudge: *"Anything else?"* Sarah remembers independently.
  - **Execution 3 (Session 3 — The Demo Moment)**: Sarah pauses briefly. Anchor observes and waits. Sarah remembers the notebook herself. **Anchor says NOTHING.** *"It worked. The AI did nothing."*

---

## 📊 Observable Measurements (Section 20)

Anchor does not invent arbitrary "independence percentages". It tracks observable ground truth:

| Session | Independent Steps | Prompts Required | Avg Prompt Level |
| :--- | :--- | :--- | :--- |
| **Session 1** | 3 / 5 | 2 | 2.0 |
| **Session 2** | 4 / 5 | 1 | 1.0 |
| **Session 3** | 5 / 5 | 0 | 0.0 |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build and start
npm run build
npm start

# 3. Open browser
http://localhost:5000
```

*(Optional) Configure MongoDB Atlas URI in `.env` or connect dynamically via the in-app Atlas tab:*
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/anchor_guardian?retryWrites=true&w=majority
PORT=5000
```
*(If no URI is specified, Anchor automatically runs using its high-fidelity local hybrid store with vector search and JSON persistence.)*

---

## 🔬 Research Foundation

- **Errorless Learning & Vanishing Cues**: Systematic review of 26 studies on error-reducing dementia rehabilitation (*PubMed Central*).
- **Just-in-Time Adaptive Interventions (JITAI)**: National Institute on Aging (NIA) guidelines for delivering the right intensity of intervention at the right time.
- **Prompt Granularity in Dementia Care**: *JMIR Aging* (2024) research demonstrating that optimal prompt type and granularity vary by individual and task.

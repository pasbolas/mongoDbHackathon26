# Adaptive Memory Guardian 🛡️
> **"How little does AI need to do for you?"**  
> An AI accessibility assistant for people living with Alzheimer’s and dementia that learns everyday activity routines, detects confusion or hesitation, and provides the **minimum amount of assistance necessary** — gradually reducing that assistance as independent performance returns.

---

## 🌟 The Core Philosophy

Most AI assistants optimize for doing **more** for you. For someone living with dementia, excessive assistance creates learned helplessness and accelerates cognitive decline. 

**Adaptive Memory Guardian optimizes for intervening LESS.**
- **Silence is a Feature**: When a person progresses naturally through an activity, the AI intentionally stays quiet.
- **Vanishing Cues**: Assistance begins at the lowest effective intensity (Level 1 subtle nudge) and steps back as independent performance improves.
- **Errorless Learning**: Grounded in peer-reviewed dementia cognitive rehabilitation research (*PubMed Central*), progressively withholding cues following successful recall until tasks are performed autonomously.

---

## 🍃 Why MongoDB Atlas?

MongoDB Atlas serves as the **longitudinal memory system** of the assistant:

1. **MongoDB Atlas Vector Search (`$vectorSearch`)**:
   - Embeds the user’s real-time physical context (recent actions, location, idle duration, repeated cupboard/fridge checks).
   - Searches historical confusion incidents in the `situations_vector` collection using cosine similarity to retrieve past successful interventions (e.g. *"94% similarity: Cupboard checked twice, couldn't locate mug — Resolved with Level 1 cue"*).
2. **MongoDB Time-Series Collections (`events`)**:
   - Stores real-time behavioral streams (`timestamp`, `task`, `action`, `currentStep`, `metadata`) with high ingest throughput and granular temporal querying.
3. **Flexible Document Model (`routines`, `longitudinal_metrics`)**:
   - Stores personalized routines, step-by-step cue variations (Levels 1, 2, 3), and adaptive timeout thresholds that widen as memory strengthens.
4. **Dual-Mode Architecture**:
   - Plug-and-play compatibility with live MongoDB Atlas clusters via `MONGODB_URI`.
   - Built-in high-fidelity local hybrid store with vector cosine similarity search and persistence for instant evaluation without external setup.

---

## 🚀 Features in this MVP

- **Interactive Kitchen Perception Simulator**:
  - Live simulation of John's morning tea routine: *Fill Kettle → Boil Water → Retrieve Mug → Take Tea Bag → Pour Water → Add Milk*.
  - Manual action triggers simulating computer-vision events (opening cupboards, boiling kettle, searching drawers, cognitive hesitation).
- **Interactive Judge Demo Scenarios (One-Click)**:
  - 🟢 **Scenario 1: Full Independence**: Flawless autonomous execution. Demonstrates the AI's deliberate choice to remain silent and celebrate 100% independence.
  - 🟡 **Scenario 2: Loop Confusion & Vector Search**: John repeatedly opens and closes the cupboard. The system detects the anomaly, queries MongoDB Vector Search, and delivers a minimal Level 1 cue (*"Your mug is nearby"*).
  - 🔴 **Scenario 3: Severe Hesitation & Adaptive Escalation**: Persistent idle causes Level 1 nudge to escalate smoothly to Level 2 contextual prompt (*"Your mug is in the cupboard beside the kettle"*).
- **Vanishing Assistance Longitudinal Dashboard**:
  - Tracks 4-week progression:
    - **Week 1**: 72% independence (7 prompts required, Level 3 cues needed).
    - **Week 2**: 81% independence (4 prompts required, Level 2 cues).
    - **Week 3**: 89% independence (2 prompts required, Level 1 cues).
    - **Week 4 (Current)**: 95% independence (1 prompt required, 4 of 6 steps now completely autonomous Level 0).
  - Step-by-step assistance profile breakdown.
- **MongoDB Atlas Live Inspector**:
  - In-app modal displaying live documents across collections (`routines`, `events`, `situations_vector`, `prompt_history`, `longitudinal_metrics`).
  - Dynamic URI connection panel to test live MongoDB Atlas clusters.
  - Visual breakdown of the MongoDB `$vectorSearch` aggregation pipeline.
- **Gentle Speech Synthesis (Web Speech API)**:
  - Real voice cues spoken with a calm cadence, with quick mute/unmute toggle.

---

## 🛠️ Quick Start

### Prerequisites
- Node.js (v18+ or v22+)
- npm

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pasbolas/mongoDbHackathon26.git
   cd mongoDbHackathon26
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build and start**:
   ```bash
   npm run build
   npm start
   ```

4. **Open in your browser**:
   ```
   http://localhost:5000
   ```

*(Optional) For active frontend hot-reloading development:*
```bash
npm run dev
# Vite runs on http://localhost:5173, backend runs on http://localhost:5000
```

### Configuring MongoDB Atlas (Optional)
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Provide your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/adaptive_guardian?retryWrites=true&w=majority
PORT=5000
```
*Note: If no URI is provided, the application runs automatically using the built-in local hybrid store with vector search and persistence.*

---

## 🔬 Scientific & Clinical Research Foundation

1. **Errorless Learning & Vanishing Cues**:
   - *Errorless learning of everyday tasks in people with dementia*, PubMed Central (PMC).
   - Review of 26 studies confirming that people living with dementia maintain meaningful everyday task recall when prompts are systematically faded (**vanishing cues**).
2. **Just-in-Time Adaptive Interventions (JITAI)**:
   - *National Institute on Aging (NIA)* research guidelines for aging and dementia: delivering interventions at the precise moment of need, tailored in magnitude.
3. **Personalized Multistep Prompting**:
   - *Optimizing Technology-Based Prompts for People Living With Dementia*, PubMed (2024). Confirms that prompt granularity must be individualized and verbal instruction should be minimal.

---

## 📂 Project Structure

```
.
├── server/
│   ├── index.js                  # Express server & API routes
│   ├── db.js                     # MongoDB Atlas client & local vector fallback
│   ├── seed.js                   # Seed data (routines, vector embeddings, metrics)
│   ├── routes/
│   │   └── api.js                # REST API, SSE streaming, Atlas inspector
│   └── engine/
│       ├── guardian.js           # Decision engine & confusion detector
│       ├── vectorSearch.js       # Atlas Vector Search ($vectorSearch) & embeddings
│       └── vanishingCues.js      # Errorless learning & prompt decay algorithm
├── src/
│   ├── main.jsx                  # React 19 entrypoint
│   ├── App.jsx                   # Main layout, SSE listener & state coordinator
│   ├── index.css                 # Tailwind CSS styling
│   ├── components/
│   │   ├── Header.jsx            # Branding, DB status, sound toggle
│   │   ├── ScenarioBar.jsx       # 1-click automated judge scenarios
│   │   ├── KitchenSimulator.jsx  # Interactive physical kitchen stations
│   │   ├── GuardianCopilot.jsx   # Real-time prompt card & perception stream
│   │   ├── LongitudinalDashboard.jsx # 4-week vanishing cues charts
│   │   └── AtlasInspectorModal.jsx   # Live MongoDB Atlas document viewer
│   └── utils/
│       └── speech.js             # Web Speech API gentle voice synthesis
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 🏆 Hackathon Value Proposition

- **Originality**: Inverts standard assistant design by measuring success through **how little AI intervenes**.
- **MongoDB Atlas Integration**: Leverages Vector Search for cognitive context matching, Time-Series for behavior perception, and Document store for longitudinal routines.
- **Feasibility & Dignity**: Respects the autonomy and self-worth of individuals living with dementia.

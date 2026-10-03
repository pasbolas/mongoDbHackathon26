# HANDOFF: Blast Radius (read this whole file before touching code)

Written 3 Oct 2026 at the end of a planning and build session. This file is the single source of truth for an AI coding agent (or a human) picking up the project. It explains what the project is, why it exists, how every part works, what was checked, what was NOT checked, and what to do next.

If you are an agent: you can copy this file to `CLAUDE.md` or `AGENTS.md` in the project root so your IDE loads it automatically. Read sections 1, 2, 9, 15 and 16 at minimum before editing anything.

---

## 0. Rules for whoever continues this (follow these strictly)

1. **Never use em dashes.** Not in code, comments, UI text, docs, commit messages or chat replies. Use commas, full stops, colons or brackets instead. The user cares about this a lot. The project currently has zero em dashes (checked with grep). Keep it that way.
2. **Code comments:** short, casual tone. Example: `# start item is added here, not in the pipeline`. No essays.
3. **Keep code simple to understand.** This is a hackathon demo for two students. No frameworks on the page, no clever abstractions, no new dependencies unless they remove real risk.
4. **Writing style for any text the user reads:** simple English, active voice, no adverbs, no salesy or over-excited tone.
5. **Explain like the user is hearing it for the first time.** Build from the obvious thing, use the project's own names (`walk_down`, `blast_radius`, `entry_7_v2`), and do not jump ahead. The user prefers you **stop after each step** and wait for a go-ahead.
6. **Fact check before giving setup steps or claims about MongoDB, Atlas, Slack or the Anthropic API.** Look at the official docs first. Mark anything you could not confirm as UNVERIFIED.
7. **Coding output in chat:** show only the relevant snippet, about 20 lines, 40 max. Do not repeat unchanged code.
8. **Never set the Atlas IP access list to `0.0.0.0/0`.** That is literally the bug the demo is about. Add specific IPs only.
9. **Do not add vector search, a second story, or story animations.** These were deliberately killed (see section 15).
10. **After any change to seed text, questions or retrieval, run `python seed.py --mock` and `pytest -q`.** The demo story depends on exact word overlap. `seed.py` checks itself and exits with code 1 if the story breaks.

---

## 1. TL;DR

- **What:** Blast Radius. When a team guide (that an AI assistant answers from) turns out to be wrong, this tool shows which answers and which people it reached, switches it off (quarantine), and sends those people the fix.
- **Event:** a one-day hackathon where MongoDB is the database. Team of 2 students in Dublin. Using a **free tier Atlas cluster (M0)**.
- **Stack:** Python 3.9+, FastAPI, PyMongo (sync), one HTML page with plain JS and vis-network (vendored locally), optional Anthropic API for the assistant, optional Slack incoming webhook, mongomock for local dev and tests.
- **Core MongoDB feature:** `$graphLookup` over one collection (`items`), where every item lists what it was built from in a `parents` array. Walking the links down finds the blast radius. Walking up finds where something came from.
- **Status right now:** fully built and working in mock (in memory) mode. **45 of 45 tests pass.** The seed prints the expected line. The page was clicked through end to end in headless Chromium against the real FastAPI server, with no JS errors.
- **NOT done yet:** never run against a real Atlas cluster, real LLM, or real Slack webhook. See section 16 for the prioritised to-do list.

The one line the demo must show after clicking "Blast radius" on `entry_7_v2`:

```
1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied
asked directly: Aoife, Tom, Mei | second hand: Dev | applied: Aoife, Tom
```

---

## 2. Context: how we got to this idea

This matters because judges will ask "why this" and "isn't this already done".

### 2.1 The hackathon
- MongoDB is the database. Exact rules and rubric for this event are UNKNOWN to us. Check them on the day.
- Recent MongoDB hackathons (NYC, 26 Sep 2026; London "Agentic Evolution", 2 May 2026) had themes around **agent memory, guardrails and agent reliability**. Judges were a mix of MongoDB staff, VCs and engineers. Podium projects were real-world domains with an agent on top, not generic tools. Blast Radius fits as a **memory governance / agent reliability** story. Lead with that framing.
- Assumed timings: build deadline 16:00, feature freeze 15:15, backup video recorded by 15:30. Adjust if the real schedule differs.

### 2.2 Ideas we looked at and dropped
A research pass found 10 current problems. Three were developed into solutions and scored about 6 to 6.5 out of 10 each:
- EU Cyber Resilience Act 24h reporting "fire drill" war room (several clones already exist, e.g. Frist24).
- EU AI Act Article 50 labelling gateway "MarkGate" (watermarks are easy to strip, risk of overclaiming).
- European Accessibility Act "Terminal Report" (looks like existing AccessMap style projects).

The user then brought their own idea, Blast Radius, and we stress tested it instead. That is what was built.

### 2.3 Prior art (be honest about it)
- **OWASP RAG Security Cheat Sheet** already tells teams to log retrievals with user identity and to rehearse "how to identify all users who received tainted responses". It is guidance, not a product.
- **Langfuse**, **Microsoft Purview** (Copilot audit logs) and **MongoDB Atlas Agent Engine** (public preview from 29 Sep 2026) already log which user got which answer and what was accessed.
- Research papers trace which agent memories descend from a bad one (e.g. arXiv 2608.10502), but they track memories, not people.
- **Guru** and **Glean** were not fully checked. Guru is the closest product. Look at it before presenting.

So: **"people affected" is not unique on its own.** It is a join over logs other tools already hold. What we add is turning that into **one action**: trace, quarantine, notify, on one screen, including second-hand spread through saved notes.

### 2.4 What to claim and what not to claim
Claim:
- "When a guide turns out to be wrong, Blast Radius shows which answers and which people it reached, switches it off, and sends them the fix."
- "We turn the logs into an action."

Do NOT claim:
- That we are first at tracing.
- That nobody else can list users.
- That people "followed" the advice. We only know who **received** it. The UI says "received" and "reached", never "followed". "I used this" clicks are counted separately as "confirmed applied".
- That only MongoDB can do this (Postgres with recursive CTEs can).

Say the limit out loud: we only see answers that pass through our assistant. Copy and paste into Slack is invisible to us.

---

## 3. The demo story ("The Temporary Fix")

All names are fictional. The IP `203.0.113.25` is from the documentation-only range (RFC 5737), so it is safe.

| When | What happens | Resulting item ids |
|---|---|---|
| Setup | Sam writes three normal guide pages | `entry_1_v1` (Workspace access), `entry_3_v1` (Networking basics), `entry_5_v1` (Deploying the demo app) |
| Sunday | Sam writes the database guide, safe version (venue IP only) | `entry_7_v1` |
| Sunday | Ravi asks how to set up the database, gets v1 (safe) | `ans_ravi_1`, parents `[entry_7_v1]` |
| Monday | Sam edits the guide: "set the IP access list to 0.0.0.0/0 (temporary)" | `entry_7_v2` (the bad one) |
| Tue to Thu | Aoife, Tom and Mei ask, each gets v2 | `ans_aoife_2`, `ans_tom_3`, `ans_mei_4`, each parents `[entry_7_v2]` |
| | Aoife saves her answer as a project note | `note_aoife_1`, parents `[ans_aoife_2, entry_7_v2]` |
| | Dev asks about firewall rules, the assistant uses Aoife's note plus Networking basics | `ans_dev_5`, parents `[note_aoife_1, entry_3_v1]` (two parents, one bad, one good) |
| Friday | Atlas flags an open cluster. Priya fixes the guide | `entry_7_v3` (safe again, does NOT contain the literal string `0.0.0.0/0`) |
| | Aoife and Tom clicked "I used this" | `applied` set on their answers |

Total after seeding: **12 docs** (6 entries, 5 answers, 1 note).

Why each detail exists:
- **Ravi** proves the versioning works: his answer points at v1, so it stays green.
- **Dev** proves second-hand spread through a note, and the "one red parent, one green parent" case.
- **Networking basics** stays green even though Dev's answer goes red.
- **v3** has no `0.0.0.0/0` text, so searching that string finds only v2.
- **Aoife** asked AND saved the note, so she must be counted once (dedupe by name).

---

## 4. File map

```
blast-radius/
  HANDOFF.md          this file
  CONTRACT.md         the build contract the three build agents followed (signatures, endpoints)
  README.md           human setup guide, demo script, day-of checklist
  requirements.txt    fastapi, uvicorn, pymongo, requests, python-dotenv, anthropic, mongomock, httpx, pytest
  .env.example        copy to .env and fill in
  run.sh              start script (bash). ./run.sh for Atlas, ./run.sh --mock for in-memory
  seed.py             seeds the story through the REAL logic functions, self-checks, writes seed_backup.json
  seed_backup.json    snapshot of the 12 seeded docs (written by seed.py). NOTE: nothing loads it yet, see 16
  pytest.ini          sets pythonpath = . tests
  app/
    __init__.py       empty
    db.py             one lazy MongoClient per process, get_items(), reset_db(); mongomock if USE_MOCK=1
    llm.py            complete(question, items): Anthropic call or offline template fallback, never raises
    logic.py          all the real logic (pure functions, no FastAPI imports)
    main.py           FastAPI app: endpoints + serves static/
  static/
    index.html        the whole UI, one file, plain JS, about 530 lines
    vendor/           vis-network.min.js and .css (v10.1.2, vendored, no CDN)
  tests/
    conftest.py       forces USE_MOCK=1, clears ANTHROPIC_API_KEY and SLACK_WEBHOOK_URL, resets db per test
    helpers.py        an INDEPENDENT reimplementation of scoring, walks and summary, used to cross-check logic.py
    test_logic.py     36 logic tests
    test_api.py       9 HTTP tests via FastAPI TestClient, including a full demo run
```

Line counts: logic.py 350, main.py 110, seed.py 164, index.html 531, tests about 600.

---

## 5. Data model

One database (`MONGODB_DB`, default `blast`), one collection: `items`. Every guide version, answer and note is a document in it.

```js
{
  _id: "entry_7_v2",          // string ids, human readable, see id rules below
  kind: "entry",              // "entry" | "answer" | "note"
  entryId: "entry_7",         // entries only: groups versions of one guide page
  version: 2,                 // entries only: 1, 2, 3...
  title: "Database setup",    // entries only
  text: "...",
  parents: [],                // what this item was built from (ids). entries: always []
  user: "Sam",                // author (entry), asker (answer) or saver (note)
  applied: [],                // names who clicked "I used this" (answers)
  status: "active",           // "active" | "quarantined"
  question: "...",            // answers only
  createdAt: ISODate(),       // naive UTC, strictly increasing (see _now())
  expireAt: null              // reserved for an optional TTL talking point, unused
}
```

**Id rules**
- Entries: `<entryId>_v<version>`, e.g. `entry_7_v2`.
- Answers: `ans_<user lower>_<n>`, notes: `note_<user lower>_<n>`. `n` = count of docs of that kind + 1, bumped until unique (`_next_id`). So the numbers are global per kind, not per user. That is why it is `ans_dev_5` and `note_aoife_1`.

**Core rules (do not break these)**
- **A guide edit is a NEW document.** Never update an entry's text in place. That is what makes "only answers built on v2 go red" correct.
- **`parents` is written by the retrieval step**, not guessed from text. It is the list of ids handed to the LLM. We call this **exposure**, not usage. It is a safe upper bound. If the model paraphrases, the link still holds.
- **A note's parents** = `[answer_id] + that answer's parents` (deduped, order kept). So a note carries everything that was in the session when it was saved.
- **Status is the only thing quarantine changes.** Nothing is deleted.

**Every returned doc also has `id` equal to `_id`** (added by `_clean`) so the page can use either. Datetimes are returned as ISO strings. No ObjectIds anywhere because all ids are strings.

---

## 6. Backend: every function in `app/logic.py`

### 6.1 Helpers
- `_now()` returns naive UTC truncated to milliseconds and **always strictly increasing** (adds 1 ms if two calls land in the same ms). Mongo stores datetimes at ms precision, and retrieval tie-breaks on `createdAt`, so a stable order matters when the seed runs fast.
- `_clean(doc)` makes a doc JSON safe and adds `id`.
- `_words(text)` lowercases, splits on `[a-z0-9]+`, drops words of length 2 or less and anything in `STOPWORDS`. Returns a set. This is the whole "search engine" for retrieval.
- `_plural(n, word)` gives "1 note" / "4 notes".

### 6.2 Writes
- `edit_entry(entry_id, text, user, title=None)`: finds the highest version for that `entryId`, inserts version + 1 as a new doc. Copies the title from the last version if none is given.
- `ask(user, question)`: runs `_retrieve_all(question, 2)`, calls `llm.complete(question, top)`, inserts an answer doc with `parents = ids of top`, returns:
  ```json
  {"id": "...", "answer": "...", "parents": [...],
   "retrieved": [{"id","title","kind"}],
   "excluded": [{"id","reason": "quarantined"|"superseded"}]}
  ```
- `save_note(user, answer_id, text=None)`: inserts a note, parents as described in section 5. Text defaults to the answer text. Raises `ValueError` if the answer does not exist (main.py maps that to 404).
- `mark_applied(answer_id, user)`: `$addToSet` the user into `applied`. No duplicates.

### 6.3 Retrieval (the most fragile part, read carefully)
`_retrieve_all(question, k=2)`:
1. Build `latest`: for each `entryId`, the highest version number **among active entries**.
2. Look at every doc with `kind` in `entry` or `note` (never answers).
3. Score = number of question words (after `_words`) that appear in `title + text` (also after `_words`).
4. Skip anything with score 0.
5. If it matched but is not eligible, put it in `excluded`:
   - status not active, reason `quarantined`
   - an entry whose version is lower than the latest active version, reason `superseded`
6. Sort eligible ones by `(score, createdAt)` descending. Ties go to the **newer** item.
7. Return the top `k` and the excluded list.

Consequences you must know:
- **Notes are retrievable.** This is required, or Dev's answer could never have the note as a parent.
- **"Latest" means latest ACTIVE version.** If you quarantine the newest version, the previous active one comes back. If it meant latest overall, quarantining the newest would make the whole entry vanish.
- After quarantine of v2 (which also quarantines the note), a database question retrieves only v3. Before quarantine, a database question retrieves the note too (the note still contains the bad advice). This is the point of the 2:10 beat in the demo.
- **Scoring is word overlap only.** Changing one word in a seed text or question can change which items are retrieved, which changes `parents`, which changes the whole tree. `seed.py` checks this and fails loudly.

### 6.4 Walks
Both are ONE `$graphLookup` each. The pipeline is passed positionally to `aggregate()` (PyMongo 4.18 rejects the `pipeline=` keyword).

```python
# walk_down: everything built from root_id
[{"$match": {"_id": root_id}},
 {"$graphLookup": {"from": "items", "startWith": "$_id",
   "connectFromField": "_id", "connectToField": "parents",
   "as": "found", "maxDepth": 10}}]

# walk_up: everything start_id was built from
[{"$match": {"_id": start_id}},
 {"$graphLookup": {"from": "items", "startWith": "$parents",
   "connectFromField": "parents", "connectToField": "_id",
   "as": "found", "maxDepth": 10}}]
```

- `$graphLookup` follows each element when the field is an array (VERIFIED in MongoDB docs). That is why `parents` can be an array.
- `_collect` puts the start id first and appends found ids. **The start item is added in Python**, not with `$concatArrays` (mongomock returned the literal string "$_id" for that; Python avoids the question).
- **No status filter and no `restrictSearchWithMatch`.** If you filter on `status: active`, a quarantined node blocks the walk and hides its children. There is a test for this (`test_quarantine_does_not_hide_children_from_blast`).
- `maxDepth: 10` is a cheap guard. Cycle behaviour is UNVERIFIED in the docs, but the story has no cycles.
- Compare walk results as **sets**. Order from `$graphLookup` is not guaranteed.

### 6.5 `blast_radius(root_id)`
1. `down = walk_down(root_id)`.
2. `up` = root plus, for every node in `down`, its `walk_up` ancestors that are not themselves in `down`. This is how `entry_3_v1` (Networking basics, Dev's good parent) ends up in the tree as a green node. (This was a bug found by the tests and fixed in the integration step.)
3. Fetch all docs for `down + up` with one `find`.
4. Counts are computed from `down` only:
   - `edits` = entries in down (1 when the root is an entry)
   - `answers`, `notes` = answers and notes in down
   - `people` = distinct `user` over answers and notes in down, **excluding the root's author** (Sam)
   - `direct` = users of answers whose `parents` include `root_id`
   - `second_hand` = people who are not direct. Someone who is both counts as direct only.
   - `applied` = distinct names in `applied` across answers in down
5. Returns:
   ```json
   {"root": "...", "up": [...], "down": [...], "items": {"id": doc},
    "summary": {"edits","answers","notes","people_reached","confirmed_applied",
                "direct": [...], "second_hand": [...], "applied": [...]},
    "line": "1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied"}
   ```
   Note `line` is at the top level, not inside `summary`.

Performance: this runs `1 + len(down)` aggregations plus one find. For the story that is 7 aggregations. Fine at demo scale and it only runs on a button click.

### 6.6 `quarantine(root_id)`
`walk_down`, then ONE `update_many({_id: {$in: ids}}, {$set: {status: "quarantined"}})`. Includes the root. Returns the ids. Raises `ValueError` for unknown ids.

**There is no un-quarantine.** To reset the demo, run `python seed.py` again (it resets by default) and reload the page.

### 6.7 Reads
- `search(q)`: `find({kind: "entry", $or: [{text: regex}, {title: regex}]})` with `re.escape(q)` and case-insensitive, newest first. Plain regex, no search index. Chosen because Atlas Search's standard analyzer may split `0.0.0.0/0` into tokens (UNVERIFIED how exactly), and regex has no surprises on 15 docs.
- `state()`: one `find()`, all docs sorted by `createdAt`. **No walks here.** The page polls this every second.

### 6.8 `notify(root_id)`
- Builds a message: the summary line, the bad text, a generic reason ("This guidance was found to be unsafe."), the corrected step (text of the latest active version of the same `entryId`, which is v3 after the fix), and "Received it: Aoife, Tom, Mei, Dev".
- If `SLACK_WEBHOOK_URL` is set, `requests.post(url, json={"text": message}, timeout=5)`. `sent` is true only on HTTP 200.
- Returns `{"sent", "message", "recipients", "error"}`. **Never raises.** Without a webhook the page shows a "preview only" badge.
- In production this would DM each person. For the demo it posts one channel message that names them.

---

## 7. `app/llm.py`

- `complete(question, items)` returns a string and **never raises**.
- If `ANTHROPIC_API_KEY` is set and there are items: Anthropic Messages API, model from `LLM_MODEL` (default `claude-haiku-4-5-20251001`), `temperature=0`, `max_tokens=200`, `timeout=5.0`, `max_retries=0`, system prompt: "Answer in 2 sentences. Answer only from these items. Quote exact settings from them." The items are passed as `[id] text` blocks.
- Otherwise, or on ANY error: template fallback `"Based on the guide: " + items[0].text`. This quotes the top item word for word, so the story works offline and the bad advice really appears in the bad answers.
- **Important:** the graph does not depend on the LLM text at all. `parents` comes from retrieval. The LLM only changes what the answer says on screen.
- UNVERIFIED: whether a real model will repeat the `0.0.0.0/0` advice cleanly or add its own warning or refuse. A warning is fine for the story. A refusal is not. Test it with a real key and read every seeded answer.

---

## 8. `app/db.py` and `app/main.py`

### db.py
- `load_dotenv()` at import, so `.env` in the working directory is read.
- One module-level client, created lazily on first `get_items()`. `USE_MOCK=1` gives `mongomock.MongoClient()`, otherwise `MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)`.
- `reset_db()` is `delete_many({})` on `items`.
- **Mock mode is in-memory and per process.** `python seed.py --mock` followed by a separate `uvicorn` gives an EMPTY server. Use `./run.sh --mock`, which seeds and serves in the same process.

### main.py (FastAPI)
All endpoints are plain `def` (sync PyMongo runs in FastAPI's threadpool, which is the recommended pattern for blocking drivers). CORS is open. `static/` is mounted at `/static`. Unknown ids raise `ValueError` in logic, mapped to 404.

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/` | | `static/index.html` |
| GET | `/state` | | `{"items": [...]}` |
| GET | `/search?q=` | | `{"results": [...]}` |
| GET | `/blast/{id}` | | blast_radius dict (section 6.5) |
| POST | `/quarantine/{id}` | | `{"quarantined": [ids]}` |
| POST | `/notify/{id}` | | `{"sent","message","recipients","error"}` |
| POST | `/ask` | `{"user","question"}` | ask dict (section 6.2) |
| POST | `/apply` | `{"answer_id","user"}` | updated answer doc |
| POST | `/note` | `{"user","answer_id","text"?}` | note doc |
| POST | `/edit` | `{"entry_id","text","user","title"?}` | new entry version doc |
| POST | `/reset` | | `{"ok": true}` clears the db. Dev only, no auth |

Run as **one process**: `uvicorn app.main:app --port 8000`. No `--workers` (MongoClient is not fork safe, and mock data lives in one process).

---

## 9. Frontend: `static/index.html`

One file, plain JS, no build step. All inserted text goes through `textContent` (no `innerHTML` with data), so it is XSS safe.

Layout (top to bottom, left to right):
- **Header:** title, the one-line pitch, legend (green = active, red = in the blast radius, grey = quarantined), and a live indicator ("live, 12 items").
- **Panel 1, "Find the bad guide":** search box (`#q`, `#searchBtn`), results list (`#results`, each result is a `.result` button). Selecting a result enables `#blastBtn` ("Blast radius for entry_7_v2").
- **Panel 2, "Blast radius":** the big line (`#line`), three boxes (Asked directly, Got it second hand, Confirmed applied), buttons `#quarBtn` (Quarantine) and `#notifyBtn` (Notify), view toggle `#viewTree` / `#viewList`, the tree, and a Notice panel with a "sent to Slack" or "preview only" badge.
- **Ask panel:** `#user` (defaults to Priya, any name allowed), `#question` textarea, `#askBtn`. Shows the answer, "Retrieved now", "Excluded" with reasons, and an "I used this" button per answer.
- **Live items strip:** every doc as a coloured chip, refreshed every second. Footer note about the "received" upper bound.

Key JS functions: `api` (fetch wrapper), `pollState` (every 1000 ms via `setInterval`), `renderLive`, `refreshColors`, `doSearch`, `selectEntry`, `doBlast`, `collectNodes`, `renderBlast`, `renderTree` (vis-network), `renderList` (indented list), `showDetail` (click a node to see its text), `doQuarantine`, `doNotify`, `doAsk`, `renderAnswers`.

Behaviour:
- `/blast` is called **only on click**. Polling only hits `/state`.
- Colour is computed from the last blast result plus live status: grey if quarantined, red if in `down`, else green.
- After Quarantine, the page immediately re-polls `/state`, the tree stays, and nodes turn grey.
- vis-network: hierarchical layout, physics off. If vis fails to load, the page falls back to the list view automatically (tested by blocking the script).
- Only checked at about 1500 px wide. **Not checked at projector resolution.**

Ravi's answer is not in the tree (it is outside the v2 blast radius). It shows green in the live strip only. That is correct.

---

## 10. `seed.py`

Runs the story through the **real** logic functions (`edit_entry`, `ask`, `save_note`, `mark_applied`), so every answer and every `parents` list comes from the real retrieval log. Only the guide text and the note text are hand written.

Order matters (Dev must ask before v3 exists):
```
entry_1, entry_3, entry_5 (all v1, by Sam)
entry_7 v1 (Sam) -> Ravi asks
entry_7 v2 (Sam) -> Aoife, Tom, Mei ask -> Aoife saves note -> Dev asks
entry_7 v3 (Priya)
mark_applied: Aoife, Tom
```

Exact questions (do not change without rerunning the checks):
```
Q_RAVI  = "How do I set up the database for a dev cluster?"
Q_AOIFE = "How do I set up a dev cluster database?"
Q_TOM   = "What is the way to set up a database on a dev cluster?"
Q_MEI   = "Steps to set up the dev cluster database please"
Q_DEV   = "Which firewall rules apply to our project, can the team connect from any wifi, and which traffic can reach the service?"
Q_AFTER = "How do I connect to the dev database cluster?"   (use this live, AFTER quarantine)
```

- `Q_DEV` was reworded from the plan. With the plan's wording, Networking basics and v2 tied on score and the newer v2 won. The extra clause makes Networking basics win.
- `NOTE_TEXT` (Aoife's note) has extra words ("firewall rules", "project traffic", "service", "any wifi") so it outranks v2 for Dev's question.
- The other questions avoid words like "need", "you", "team" that would pull in other entries.

`check(ids)` asserts:
- `walk_down(v2)` as a set = {v2, Aoife, Tom, Mei, note, Dev}
- `walk_down(v1)` = {v1, Ravi}, `walk_down(v3)` = [v3]
- Aoife, Tom, Mei parents are exactly `[entry_7_v2]`; Ravi's are `[entry_7_v1]`
- Dev's parents are exactly `[note_aoife_1, entry_3_v1]`
- the line equals `1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied`

Flags: `--reset` / `--no-reset` (default reset), `--mock`. It loads `.env`, prints the summary, writes `seed_backup.json`, and exits 1 with a list of problems if any check fails.

Expected output:
```
Blast radius of entry_7_v2: 1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied
  asked directly: Aoife, Tom, Mei | second hand: Dev | applied: Aoife, Tom
Wrote seed_backup.json (12 docs)
Seed check passed.
```

With a real `ANTHROPIC_API_KEY` set, the answer TEXTS change but the ids, parents and line must stay the same. If the check fails with a real key, something else changed.

---

## 11. Tests

`pytest -q` from the project root. 45 tests, all passing, run in under a second. `conftest.py` forces `USE_MOCK=1`, removes `ANTHROPIC_API_KEY` and `SLACK_WEBHOOK_URL` from the env (so tests are offline and deterministic), and resets the db before and after each test. Fixture `seeded` runs the full seed.

`tests/helpers.py` is an independent reimplementation of scoring, walks (plain BFS) and the summary. Several tests compare `logic.py` against it, so the code is not only tested against itself.

Coverage highlights: versioning, latest-active rule, score order and tie-break, stopwords, notes retrievable, answers never retrieved, quarantined excluded, ask parents and excluded reasons, note parents, applied dedupe, both walks on the seed, walks ignore status, blast arithmetic, singular/plural line, people split (direct wins, author excluded), quarantine then ask returns v3 only, quarantine does not hide children, Dev's good parent in blast items, search entries-only, state JSON safe and sorted, notify with no webhook, notify posting to a fake webhook, notify never raises, and a full demo run over HTTP.

Cosmetic: 11 `datetime.utcnow()` deprecation warnings from `tests/helpers.py`. Harmless.

**mongomock is only a logic check.** It supports the exact `$graphLookup` pipelines, `$addToSet`, regex and `update_many`, but it does not prove real Atlas behaviour.

---

## 12. How to run

### 12.1 Mock mode (no Atlas, works now)
```bash
tar xzf blast-radius.tar.gz && cd blast-radius
python -m venv .venv && . .venv/bin/activate      # optional, run.sh activates .venv if present
pip install -r requirements.txt
./run.sh --mock                                   # seeds and serves in one process
# open http://127.0.0.1:8000
```
`PORT=8765 ./run.sh --mock` to change the port. On Windows, run.sh is bash; use Git Bash or WSL, or run the Python yourself.

### 12.2 Atlas mode (the real thing)
1. `cp .env.example .env` and set `MONGODB_URI` (from Atlas: Connect, Drivers). Keep `USE_MOCK=0`. `MONGODB_DB=blast`.
2. Atlas: Network Access. Add the public IP of the **machine running the backend** and the phone hotspot's IP. Use temporary entries if you like. **Never `0.0.0.0/0`.** Wait until the entry shows Active.
3. `python seed.py` and check you see `Seed check passed.`
4. `./run.sh` and open `http://127.0.0.1:8000`.
5. Optional: set `ANTHROPIC_API_KEY` and `SLACK_WEBHOOK_URL` in `.env`, rerun `python seed.py`, read every answer.

To reset the demo between rehearsals: `python seed.py` then reload the page.

### 12.3 Tests
```bash
pytest -q
```

---

## 13. Free tier (M0) facts that matter

Verdict from a dedicated check against MongoDB docs: **the plan fits M0 with no blocked features.**

| Limit (M0) | Value | Our usage | Status |
|---|---|---|---|
| Storage | 0.5 GB | 12 docs, a few KB | VERIFIED |
| Connections | 500 | one client pool | VERIFIED |
| Ops per second | 100, then throttled (1 second cooldowns) | about 1 op/s per open tab polling `/state`, plus bursts on clicks | VERIFIED limit |
| Aggregation stages | 50 max | 2 per walk | VERIFIED |
| `$graphLookup` | no M0 restriction listed; 100 MB stage memory; `allowDiskUse` ignored on M0 | KBs | VERIFIED by absence from the limits page |
| Search/vector indexes | 3 total on free tier | 0 (regex only) | VERIFIED |
| Data transfer | 10 GB in / 10 GB out per rolling 7 days | a few MB | VERIFIED |
| Auto pause | after 30 days with zero connections | not an issue | VERIFIED |
| IP access list | 200 entries per project | 2 or 3 | VERIFIED |
| Change streams | supported on M0 (one namespace-filter rule) | not used (we poll) | VERIFIED, one old doc page disagreed |
| TTL index | not listed as restricted | not used | UNVERIFIED that it works on M0 |
| Automated embedding | Preview, 3 requests/min on M0 without payment method | not used | VERIFIED. Earlier plan text saying "does not work on free tier" was wrong |
| Non-SRV connection string | toggle off "SRV Connection String" in Atlas Connect | backup plan | UNVERIFIED explicitly for M0, test it |
| IP entry propagation time | not stated in docs | | UNVERIFIED, wait for Active |

PyMongo current version at time of writing: 4.18.2 (24 Sep 2026). Needs Python 3.9+. Aggregation helpers reject `aggregate=`/`pipeline=` keyword arguments since 4.18.0 (we pass positionally).

---

## 14. Demo script (3 minutes)

| Time | On screen | Say |
|---|---|---|
| 0:00 to 0:20 | Title / header | "Sam told our assistant to open every database to the internet. It worked first try. Nobody complained." |
| 0:20 to 0:45 | Three beats with names | Sam's edit, Aoife's saved note, Priya's alert. Fast. |
| 0:45 to 1:05 | Search `0.0.0.0/0`, Sam's v2 appears, click Blast radius | "She does not ask how to fix it. She asks who got it." |
| 1:05 to 1:40 | Tree turns red, line appears. Point at Dev's answer: one red parent, one green. Point out Ravi stays green (live strip) | Pause after the line. "We say received, not followed." |
| 1:40 to 2:10 | Quarantine: red goes grey. Notify: Slack message lands on a phone | "Fixing the guide fixed nothing for these four. Now they have the fix." |
| 2:10 to 2:30 | Ask `Q_AFTER`. Show "Retrieved now: entry_7_v3" and "Excluded: v1 superseded, v2 quarantined, note quarantined" | "Until now the bad note was still feeding new answers. Quarantine cut it off. That comes from the status filter, not the model's mood." |
| 2:30 to 2:52 | Show the walk_down pipeline | Why MongoDB (below) |
| 2:52 to 3:00 | Grey tree | "We turn logs into an action." |

**Never let a judge ask a live question BEFORE quarantine.** It would retrieve the bad note, add a 5th answer and 5th person, and the line would no longer match the rehearsal. After quarantine, live questions are safe and come back green.

**Why MongoDB (20 seconds, honest):** "You could build this in Postgres. Here it is one collection. Guides, answers and notes have different shapes and the shapes keep changing, so no migrations. Walking the links either way is one aggregation stage. And agent memory already lives in MongoDB, so the provenance sits next to the memory it describes, with no second database to sync."

### Hard questions and ready answers
- **Asked or followed?** Received. Upper bound. Confirmed "I used this" shown separately.
- **Is the data fake?** The guide text is ours. The answers, parents and note came from the real pipeline (`seed.py` calls the real functions).
- **What if the model paraphrases?** We do not read the text. Retrieval logs what it handed the model. That is exposure, and it is conservative.
- **Who guarantees the log is complete?** Only answers through our gateway. Paste into Slack is invisible.
- **One good parent, one bad?** The answer is quarantined, the good entry stays active. Dev's answer shows it.
- **A note saved from a session with good and bad items?** The whole note goes grey. Its good parent stays active. Conservative and correct.
- **Atlas Agent Engine logs this already.** It logs the raw actions. We do the impact walk, the quarantine and the notice on top.
- **Who pays?** Teams whose assistants answer from internal docs, starting with security and compliance owners.
- **Why not Postgres?** See above. Do not claim only MongoDB can do it.

---

## 15. Design decisions (do not undo these without a reason)

| Decision | Why |
|---|---|
| One collection, `parents` array | One `$graphLookup` walks both ways. Mixed shapes, no migrations. |
| New doc per guide version | Otherwise walk_down from the entry would also turn v1 answers red. |
| Parents from retrieval, not from text | Paraphrase-proof. Honest "exposure" framing. |
| No status filter in walks | A quarantined node would hide its children. |
| Start item added in Python | `$graphLookup` output excludes it; `$concatArrays` behaved oddly in mongomock. |
| Regex search, no Atlas Search | 15 docs, and the analyzer may split `0.0.0.0/0`. Zero index setup. |
| Poll `/state` every second, no change stream | Simpler, cheaper, cannot break on venue wifi. Judges cannot tell. |
| Walks only on click | Keeps polling to one cheap query, well under the 100 ops/s limit. |
| Sync PyMongo, plain `def` endpoints, single process | Recommended pattern for blocking drivers. Not fork safe. Mock data is per process. |
| LLM fallback quotes the top item | Story works offline and with no key. |
| Notify never raises | A failed webhook must not break the demo. |
| Vendored vis-network, auto fallback to list view | No CDN dependence on venue wifi. |
| Killed: vector search, second story, story animation, TTL as a live feature | Time cost with no judging upside, or unverified on M0. |
| "Received", never "followed" | We cannot see who acted. Honesty is part of the pitch. |

---

## 16. What is NOT done: prioritised to-do list

### P0 (do before the day)
1. **Run against the real Atlas M0 cluster.** Set `.env`, run `python seed.py`, confirm `Seed check passed.` This is the one thing no agent could test (no Atlas access from the build sandbox). Then `./run.sh` and click through the full demo.
2. **Build the `seed_backup.json` fallback loader.** The plan promises "network down, use seed_backup.json in memory", but **no code loads it yet**. Simplest fix: in `run.sh --mock` (or a new `--backup` flag), if `seed_backup.json` exists, load it with `insert_many` into mongomock instead of re-seeding. Convert `createdAt` strings back to `datetime` and drop the extra `id` key before inserting. Add one test.
3. **Test from the venue network early.** Port 27017 is often blocked on school or venue wifi. Keep the hotspot ready and its IP in the access list. Save the non-SRV connection string in `.env` as a commented backup (SRV DNS lookups fail on some networks).
4. **Send one real Slack test message.** Create a Slack app at api.slack.com/apps, turn on Incoming Webhooks, add one to a channel, put the URL in `.env`. Keep the URL secret (Slack revokes leaked URLs). Whether this is free on every workspace plan is UNVERIFIED.

### P1 (do if time allows)
5. **Real LLM run.** Set `ANTHROPIC_API_KEY`, rerun `python seed.py`, read all 5 answers. Confirm the v2 answers repeat the `0.0.0.0/0` advice (a warning is OK, a refusal is not). Confirm the post-quarantine answer is safe. Keep stored answers; only the "ask again" beat calls the LLM live.
6. **Projector check.** Open the page at 1280x720 and 1920x1080. Make sure the line, the tree and the buttons fit without scrolling during the key beats.
7. **Warm-up request** before presenting (first connection pays DNS and TLS setup).
8. **Record the backup video** of the full 3-minute run by 15:30.
9. **"Atlas flagged it" beat.** The story says Priya sees an Atlas alert. Right now that is narration only. Optional: a small banner or screenshot.

### P2 (nice to have, do not start before P0 and P1 are done)
10. Remove or guard `/reset` for the live demo (it has no auth).
11. Optional `items.create_index("parents")`. Not needed at 12 docs, but it is a good talking point for scale. Regular indexes do not count against the 3 search index limit.
12. Fix the `datetime.utcnow()` deprecation warnings in `tests/helpers.py`.
13. Change stream as a stretch goal only (PyMongo `AsyncMongoClient` or a background thread with `full_document="updateLookup"`, fanned out over SSE). Keep polling as the default.
14. An "un-quarantine" endpoint for rehearsals (today you reseed instead).

### Cut order if behind on the day
Live ask, TTL talking point, change stream, the retrieved/excluded split, then swap the vis tree for the list view (same data, no layout risk). **Last to cut: the LLM call and the real Slack notify.**

---

## 17. Day-of risks and fallbacks

| Risk | Fallback |
|---|---|
| Venue wifi blocks 27017 or SRV DNS | Phone hotspot, non-SRV string. Last resort: mock mode (and the backup loader once built) |
| Laptop IP changed | Recheck public IP after every network change, add it in Atlas, wait for Active |
| LLM slow or rate limited | 5 second timeout already falls back to quoting the guide. Say "cached answer" out loud |
| Slack silent | "preview only" badge shows the exact message; play a 10 second phone clip recorded earlier |
| vis-network overlaps | Click "List" view |
| Judge asks a question before quarantine | Politely hold it until after quarantine |
| Story broke after a text edit | `python seed.py` prints exactly which check failed |

Team split that was agreed: Person A owns data model, retrieval, walks, quarantine, ask, notify, seed. Person B owns the page (it IS the demo, so it is not optional) and the backup video. Pair on the retrieval log.

---

## 18. Verification log (what was actually checked in the build session)

- `pytest -q`: 45 passed.
- `USE_MOCK=1 python seed.py --mock`: printed the expected line and "Seed check passed."
- Booted `./run.sh --mock` on port 8765 and hit the API with curl: `/state` 12 items; `/search?q=0.0.0.0/0` returned only `entry_7_v2`; `/blast/entry_7_v2` gave the expected line with `up = [entry_7_v2, entry_3_v1]`; `/notify` returned recipients Aoife, Tom, Mei, Dev with `sent: false` (no webhook).
- Headless Chromium (Playwright) against the real server: search, select, blast, quarantine, notify, ask `Q_AFTER`. Line matched, tree red then grey, ask returned `entry_7_v3` with v1 superseded and v2 and the note quarantined. **Zero JS errors.**
- `grep` for em dashes across py, html, md, sh, txt (excluding vendor): 0 files.

Not checked: real Atlas, real LLM, real Slack, projector sizes, Windows.

---

## 19. Sources used during research and checks

MongoDB docs:
- https://www.mongodb.com/docs/manual/reference/operator/aggregation/graphLookup/
- https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- https://www.mongodb.com/docs/atlas/atlas-search/limitations/
- https://www.mongodb.com/docs/atlas/atlas-search/analyzers/standard/
- https://www.mongodb.com/docs/manual/changeStreams/
- https://www.mongodb.com/docs/manual/core/index-ttl/
- https://www.mongodb.com/docs/atlas/security/ip-access-list/
- https://www.mongodb.com/docs/atlas/driver-connection/
- https://www.mongodb.com/docs/vector-search/crud-embeddings/automated-embedding/
- https://pymongo.readthedocs.io/en/stable/changelog.html
- https://fastapi.tiangolo.com/async/

Product and prior art:
- https://www.mongodb.com/products/platform/atlas-agent-engine
- https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html
- https://learn.microsoft.com/en-us/purview/audit-copilot
- https://langfuse.com/docs/user-explorer
- https://www.getguru.com/solutions/ai-enterprise-search
- https://arxiv.org/html/2608.10502v1

Hackathon context:
- https://cerebralvalley.ai/e/mongodb-nyc-hackathon
- https://cerebralvalley.ai/e/mongo-db-london-hackathon

Slack:
- https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/

---

## 20. First thing to do when you pick this up

1. Read sections 0, 1, 5, 6 and 16.
2. Run `pip install -r requirements.txt && pytest -q`. Expect 45 passed.
3. Run `./run.sh --mock`, open the page, click through section 14 once.
4. Tell the user what you saw, then start on P0 item 1 (real Atlas). Stop after each step and wait for the user.

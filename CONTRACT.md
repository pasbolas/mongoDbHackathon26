# Blast Radius build contract

Plan: /home/claude/blast-radius-v2.md (read it first). Project root: /home/claude/blast-radius/
Stack: Python 3.9+, FastAPI, PyMongo (sync), requests, python-dotenv, mongomock for local dev and tests.
Never use em dashes anywhere (code comments, docs, UI text). Code comments short and casual. Keep code simple.

## File ownership (write ONLY your own files)
- BACKEND agent: app/__init__.py, app/db.py, app/llm.py, app/logic.py, app/main.py, requirements.txt, .env.example
- PAGE agent: static/index.html, static/vendor/* (only that)
- SEED agent: seed.py, seed_backup.json, tests/*, README.md, run.sh

## Env vars
- MONGODB_URI (Atlas string), MONGODB_DB (default "blast"), USE_MOCK=1 (use mongomock, in memory, no Atlas)
- ANTHROPIC_API_KEY (optional), LLM_MODEL (default "claude-haiku-4-5-20251001")
- SLACK_WEBHOOK_URL (optional)

## Data model: ONE collection `items` in db MONGODB_DB
```
{ _id, kind: "entry"|"answer"|"note", entryId (entries only, e.g. "entry_7"), version (entries only, int),
  title (entries only), text, parents: [ids], user, applied: [names], status: "active"|"quarantined",
  question (answers only), createdAt: datetime, expireAt: null }
```
Ids: entries "entry_7_v2". Answers "ans_<user lower>_<n>". Notes "note_<user lower>_<n>". n is a counter from a Mongo-side count of existing docs + 1 (any unique rule is fine).
Never edit an entry in place: a new version is a new doc. Each doc has "title" only for entries.

## app/db.py
- `get_items()` returns the pymongo Collection (one MongoClient created once, module level lazy; mongomock if USE_MOCK=1).
- `reset_db()` drops all docs in items (used by seed and tests).

## app/llm.py
- `complete(question: str, items: list[dict]) -> str`. Uses Anthropic SDK if ANTHROPIC_API_KEY set (temperature 0, max_tokens 200, 5 second timeout, system: "Answer in 2 sentences. Answer only from these items. Quote exact settings from them."), otherwise OR on any error returns a template fallback: the text of items[0] (first sentence pair) prefixed with "Based on the guide: ". The fallback must quote the top item text so the story works offline.

## app/logic.py (pure functions over get_items(), no FastAPI imports)
- `edit_entry(entry_id: str, text: str, user: str, title: str|None=None) -> dict`  new version doc (version = max existing + 1, copy title if not given, parents [])
- `latest_active_entries() -> list[dict]`  latest ACTIVE version per entryId
- `retrieve(question: str, k: int = 2) -> list[dict]`  candidates: kind in (entry, note), status active; for entries only the latest active version; score = count of question words (lowercase, strip punctuation, drop stopwords, length>2) found as words in title+text; keep score>=1; sort by score desc, then createdAt desc; top k. Notes must be retrievable.
- `ask(user: str, question: str) -> dict` returns {"id", "answer", "parents": [ids], "retrieved": [{"id","title","kind"}], "excluded": [{"id","reason"}]}; inserts an answer doc (parents = retrieved ids, status active). `excluded` lists docs that matched >=1 word but were not eligible: reason "quarantined" or "superseded" (an older version while a newer active one exists).
- `save_note(user: str, answer_id: str, text: str|None=None) -> dict`  note doc: parents = [answer_id] + that answer's parents (deduped, order kept); text defaults to the answer text
- `mark_applied(answer_id: str, user: str) -> dict`  adds user to answer.applied (no duplicates); returns the updated doc
- `walk_down(root_id: str) -> list[str]`  uses ONE $graphLookup aggregation: startWith "$_id", connectFromField "_id", connectToField "parents", maxDepth 10, NO status filter, NO restrictSearchWithMatch, pipeline passed positionally; returns [root_id] + found ids (python adds root)
- `walk_up(start_id: str) -> list[str]`  $graphLookup startWith "$parents", connectFromField "parents", connectToField "_id", maxDepth 10; returns [start_id] + found ids
- `blast_radius(root_id: str) -> dict` {"root", "up": ids, "down": ids, "items": {id: doc} for down+up, "summary": {"edits":1,"answers":n,"notes":n,"people_reached":n,"confirmed_applied":n,"direct":[names],"second_hand":[names],"applied":[names]}, "line": "1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied"}.
  Rules: people = dedupe by name of `user` over answers AND notes in down (not the entry author, not the root). direct = users of answers whose parents include root_id. second_hand = people reached who are not direct (a person who is both counts as direct only). confirmed_applied = distinct names in `applied` of answers in down. "line" uses singular/plural correctly ("1 answer", "1 note").
- `quarantine(root_id: str) -> list[str]`  walk_down then ONE update_many $set status quarantined on those ids (include root). Returns ids.
- `search(q: str) -> list[dict]`  regex find over kind "entry" with re.escape, case insensitive
- `state() -> list[dict]`  one find, all docs sorted by createdAt (no walks!)
- `notify(root_id: str) -> dict`  builds message: bad text, why it is wrong (generic: "This guidance was found to be unsafe"), corrected step = text of the latest active version of the same entryId when root is an entry, names of the people reached. Posts to SLACK_WEBHOOK_URL with requests (timeout 5) if set. Returns {"sent": bool, "message": str, "recipients": [names], "error": str|None}. Never raises.
All returned docs must be JSON safe (createdAt as ISO string; do not return ObjectId).

## app/main.py (FastAPI, plain `def` endpoints, lifespan not needed since db.py is lazy; serves ./static)
- GET /  -> static/index.html
- GET /state -> {"items": [...]}
- GET /search?q= -> {"results": [...]}
- GET /blast/{id} -> blast_radius(id)
- POST /quarantine/{id} -> {"quarantined": [ids]}
- POST /notify/{id} -> notify(id)
- POST /ask {"user","question"} -> ask(...)
- POST /apply {"answer_id","user"} -> doc
- POST /note {"user","answer_id","text"?} -> doc
- POST /edit {"entry_id","text","user","title"?} -> doc
- POST /reset -> {"ok": true}  (clears db; only for dev)
- Static files mounted at /static. CORS open for dev.
Run: `uvicorn app.main:app --port 8000` (single process).

## static/index.html (single file, no build step)
- Fetch /state every 1000 ms, render. Colors: green = active, red = in the blast radius (only after "Blast radius" clicked, from /blast), grey = quarantined.
- Search box (calls /search), results list of entries with version, author. Click a result then button "Blast radius" calls /blast/{id}. Shows the `line` big, the tree (vis-network, hierarchical, physics off, fixed layout; edges parent -> child; vendor the JS locally in static/vendor/, get it with `npm pack vis-network` or similar, do not rely on a CDN) with a toggle for a simple indented list view that does NOT need vis (also the automatic fallback if vis fails to load).
- Buttons: Quarantine (POST /quarantine/{id}, items turn grey live), Notify (POST /notify/{id}, shows the message and recipients in a panel, plus a "sent to Slack" or "preview only" badge).
- Ask panel: user dropdown or text, question box, POST /ask, shows the answer, "retrieved now" ids and "excluded" ids with reasons, and an "I used this" button per answer (POST /apply).
- Show people split: "asked directly" and "got it second hand", and confirmed applied.
- Clear, big, dark-on-light, readable on a projector. No em dashes in UI text. Text says "received", never "followed".

## seed.py
Runs through the REAL logic functions (not raw inserts for answers). Order: v1, Ravi, v2, Aoife, Tom, Mei, note, Dev, v3. Seeds entries entry_1, entry_3, entry_5, entry_7 v1 (safe), v2 (bad), v3 (fix) exactly as in the plan's Seed data section. Mark Aoife and Tom applied. Then prints the blast radius summary line. Flags: `--reset` clears first (default on), `--mock` sets USE_MOCK=1. After seeding, writes seed_backup.json (all docs). Expected: walk_down(entry_7_v2) = v2, Aoife, Tom, Mei, the note, Dev; line "1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied"; direct Aoife, Tom, Mei; second hand Dev; Ravi stays active and out of the walk.
Note: with the no-LLM fallback the answers quote the retrieved item, so retrieval tuning decides the story. Aoife's note text must contain extra words that make Dev's question retrieve [note, entry_3_v1] (not v3, because v3 does not exist yet at that point).

## Tests (tests/, pytest, USE_MOCK=1)
Cover: edit_entry versioning, retrieve rules (latest active only, notes retrievable, quarantined excluded), ask parents, save_note parents, walk_up, walk_down, blast_radius arithmetic from the plan, people split, quarantine then ask returns v3 only, notify message content with no webhook, and the HTTP endpoints through FastAPI TestClient.

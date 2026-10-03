# Blast Radius

When a team guide turns out to be wrong, Blast Radius shows which answers and which people it reached, switches it off, and sends them the fix.

It sits in front of an AI assistant that answers from team guides and saved notes. Every answer logs which guide pages it was built from. When a page is bad, one walk through those links finds everything built on it. Then you quarantine it and notify the people.

We say "received", never "followed". We only see answers that pass through our assistant. We count "I used this" clicks separately.

## 60 second setup

```bash
cd blast-radius
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill it in
```

In `.env`:

```
MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=blast
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...   # optional, for real Notify
ANTHROPIC_API_KEY=...                                    # optional, template answers without it
```

In Atlas, go to Network Access and add the IP of the machine that runs the backend, plus your phone hotspot. Never add `0.0.0.0/0`. That is the exact mistake this demo is about.

No Atlas yet? Add `--mock` to anything below. It uses an in memory database.

## Run it

```bash
python seed.py            # clears items, seeds the story, prints the summary line, writes seed_backup.json
./run.sh                  # server on http://127.0.0.1:8000
./run.sh --mock           # seeds in memory and serves, no Atlas needed
pytest -q                 # tests (they always use the in memory database)
```

After `python seed.py` you should see:

```
Blast radius of entry_7_v2: 1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied
```

`seed.py` has `--mock` and `--no-reset` too. It uses the real functions in `app/logic.py`, so answers and parents come from the retrieval log. Only the guide text is hand written. Order: v1, Ravi, v2, Aoife, Tom, Mei, note, Dev, v3.

## The 3 minute demo

| Time | On screen | Say |
|---|---|---|
| 0:00 to 0:20 | Title card | "Sam told our assistant to open every database to the internet. It worked first try. Nobody complained." |
| 0:20 to 0:45 | Three beats: Sam's edit, Aoife's note, Priya's alert | Tell it fast. |
| 0:45 to 1:05 | Priya searches `0.0.0.0/0`. v2 appears. Click Blast radius. | "She does not ask how to fix it. She asks who got it." |
| 1:05 to 1:40 | Tree turns red. Line: 1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied. Point at Dev's answer (one red parent, one green). Point at Ravi's green answer. | Pause. "We say received, not followed." |
| 1:40 to 2:10 | Click Quarantine, red goes grey. Click Notify, Slack message lands on the phone. | "Fixing the guide fixed nothing for these four. Now they have the fix." |
| 2:10 to 2:30 | Ask again: "How do I connect to the dev database cluster?" Retrieved now: v3. Excluded: v2 and the note. | "Quarantine cut it off. This comes from the status filter, not the model's mood." |
| 2:30 to 2:52 | Show the walk down query | One collection, one aggregation stage. No second database to sync. |
| 2:52 to 3:00 | Grey tree | "We turn logs into an action." |

Do not let a judge ask a live question before quarantine. It would pull in the bad note and the line becomes 5 answers and 5 people. After quarantine it is safe.

Questions to know:
- Asked or followed? Received. It is an upper bound. "I used this" clicks are shown apart.
- Who guarantees the log is complete? Only answers through our gateway. Paste into Slack is invisible.
- One good parent, one bad? The answer is quarantined. The good page stays active.
- Say it honestly: you could build this in Postgres. Here it is one collection, and agent memory already lives in MongoDB.

## Day-of checklist

The night before:
- [ ] Run `python seed.py` on the real Atlas cluster, check the summary line
- [ ] Click Blast radius once against Atlas
- [ ] Send one real Slack test message with Notify, then re-seed
- [ ] Test the non-SRV connection string from Atlas as a backup

At the venue:
- [ ] Add the backend machine's public IP and the phone hotspot to the Atlas access list. Recheck after every network change.
- [ ] Test the connection from venue wifi early. Port 27017 is often blocked. Keep the hotspot ready.
- [ ] Start with `./run.sh` (one process, no `--workers`)
- [ ] Make one warm-up request (open the page, run one search) before the demo
- [ ] Feature freeze at 15:15 if the deadline is 16:00
- [ ] Run the whole script on the demo laptop three times out loud
- [ ] Record the backup video by 15:30

## Fallbacks

| Problem | Do this |
|---|---|
| Venue network down | Use the phone hotspot |
| Still no Atlas | `./run.sh --mock`. Same story, in memory. |
| Data got messy | `python seed.py` again, it resets first |
| LLM slow or down | After 5 seconds the answer falls back to a template that quotes the top guide. Say "cached" out loud. |
| Slack silent | The page still shows the message as "preview only". Play the 10 second phone clip. |
| Page will not draw the tree | It falls back to the indented list view on its own |

`seed_backup.json` has every seeded doc. If the cluster is gone, `./run.sh --mock` rebuilds the same data in memory.

## Free tier limits that matter

- Atlas free (M0): about 100 operations per second. The page polls `/state` once a second, which is one `find`. The walks run only on button clicks.
- M0 has a 500 connection cap. We create one `MongoClient` and run one uvicorn process.
- 512 MB storage. We use about 15 documents.
- Slack incoming webhooks have a rate limit of about 1 message per second. One Notify click is fine.
- The LLM call has a 5 second timeout and temperature 0 so answers repeat.

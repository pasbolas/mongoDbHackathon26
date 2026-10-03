import os
import re
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional

import requests

from app.db import get_items, get_kb, get_logs
from app.llm import complete

STOPWORDS = set("""
the and for are but not you all can had her was one our out has have how what
which who when where why this that with from they will would there their then
them than these those into does did our your about any can could should may
might must shall also just very more most some such only own same too our
""".split())

_last_time = [None]


def _now() -> datetime:
    # naive utc, always going up so sort order is stable even in the same ms
    t = datetime.now(timezone.utc).replace(tzinfo=None)
    t = t.replace(microsecond=(t.microsecond // 1000) * 1000)
    last = _last_time[0]
    if last is not None and t <= last:
        t = last + timedelta(milliseconds=1)
    _last_time[0] = t
    return t


def _clean(doc: Optional[dict]) -> Optional[dict]:
    """Make a doc JSON safe (iso dates, no ObjectId)."""
    if doc is None:
        return None
    out = {}
    for k, v in doc.items():
        if isinstance(v, datetime):
            v = v.isoformat()
        elif k == "_id":
            v = str(v)
        out[k] = v
    out["id"] = out["_id"]
    return out


def _words(text: str) -> set:
    found = re.findall(r"[a-z0-9]+", (text or "").lower())
    return set(w for w in found if len(w) > 2 and w not in STOPWORDS)


def _next_id(prefix: str, kind: str, user: str) -> str:
    items = get_items()
    n = items.count_documents({"kind": kind}) + 1
    base = "%s_%s_" % (prefix, user.lower().replace(" ", "_"))
    while items.find_one({"_id": base + str(n)}):
        n += 1
    return base + str(n)


# ---------- writes ----------

def edit_entry(
    entry_id: str,
    text: str,
    user: str,
    title: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> dict:
    items = get_items()
    kb = get_kb()
    last = items.find_one({"entryId": entry_id}, sort=[("version", -1)])
    version = (last["version"] + 1) if last else 1
    if title is None:
        title = last.get("title") if last else entry_id
    if category is None and last:
        category = last.get("category", "General")
    if tags is None and last:
        tags = last.get("tags", [])
    doc = {
        "_id": "%s_v%d" % (entry_id, version),
        "kind": "entry",
        "entryId": entry_id,
        "version": version,
        "title": title,
        "text": text,
        "parents": [],
        "user": user,
        "applied": [],
        "status": "active",
        "category": category or "General",
        "tags": tags or [],
        "createdAt": _now(),
        "expireAt": None,
    }
    items.insert_one(doc.copy())
    kb.insert_one(doc.copy())
    return _clean(doc)


def create_kb_entry(
    title: str,
    text: str,
    user: str,
    category: Optional[str] = "General",
    tags: Optional[List[str]] = None,
) -> dict:
    """Create a brand new guide in knowledge_base (version 1)."""
    slug = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
    if not slug:
        slug = "guide"
    entry_id = f"entry_{slug}"
    items = get_items()
    base_id = entry_id
    counter = 1
    while items.find_one({"entryId": entry_id}):
        entry_id = f"{base_id}_{counter}"
        counter += 1
    return edit_entry(entry_id, text, user, title=title, category=category, tags=tags or [])


def list_kb_entries(category: Optional[str] = None, active_only: bool = False) -> List[dict]:
    """List knowledge base articles, grouped by entryId with their versions and metadata."""
    kb = get_kb()
    query = {}
    if active_only:
        query["status"] = "active"
    if category and category != "all":
        query["category"] = category

    docs = list(kb.find(query).sort("createdAt", 1))
    grouped = {}
    for d in docs:
        eid = d.get("entryId", d["_id"])
        if eid not in grouped:
            grouped[eid] = {
                "entryId": eid,
                "title": d.get("title", eid),
                "category": d.get("category", "General"),
                "tags": d.get("tags", []),
                "versions": [],
                "latestVersion": 1,
                "latestText": "",
                "latestUser": d.get("user", "Unknown"),
                "status": "active",
                "updatedAt": d.get("createdAt"),
            }
        grouped[eid]["versions"].append({
            "id": d["_id"],
            "version": d.get("version", 1),
            "text": d.get("text", ""),
            "user": d.get("user", ""),
            "status": d.get("status", "active"),
            "createdAt": d.get("createdAt").isoformat() if hasattr(d.get("createdAt"), "isoformat") else str(d.get("createdAt")),
        })
        if d.get("version", 1) >= grouped[eid]["latestVersion"]:
            grouped[eid]["latestVersion"] = d.get("version", 1)
            grouped[eid]["latestText"] = d.get("text", "")
            grouped[eid]["latestUser"] = d.get("user", "")
            grouped[eid]["status"] = d.get("status", "active")
            grouped[eid]["updatedAt"] = d.get("createdAt").isoformat() if hasattr(d.get("createdAt"), "isoformat") else str(d.get("createdAt"))
            if d.get("title"):
                grouped[eid]["title"] = d["title"]

    return list(grouped.values())


def get_kb_entry(entry_id: str) -> dict:
    """Get full details and all versions of a specific knowledge base entry."""
    kb = get_kb()
    versions = list(kb.find({"entryId": entry_id}).sort("version", 1))
    if not versions:
        raise ValueError("Knowledge base entry not found: " + entry_id)
    latest = versions[-1]
    return {
        "entryId": entry_id,
        "title": latest.get("title", entry_id),
        "category": latest.get("category", "General"),
        "tags": latest.get("tags", []),
        "latestVersion": latest.get("version", 1),
        "status": latest.get("status", "active"),
        "versions": [_clean(v) for v in versions],
    }


def list_logs(kind: Optional[str] = None, user: Optional[str] = None, status: Optional[str] = None) -> List[dict]:
    """Query logs collection for agent answers and saved notes."""
    logs = get_logs()
    query = {}
    if kind and kind != "all":
        query["kind"] = kind
    if user and user != "all":
        query["user"] = user
    if status and status != "all":
        query["status"] = status
    found = logs.find(query).sort("createdAt", -1)
    return [_clean(d) for d in found]


def latest_active_entries() -> List[dict]:
    best = {}  # entryId -> doc
    for d in get_items().find({"kind": "entry", "status": "active"}):
        cur = best.get(d["entryId"])
        if cur is None or d["version"] > cur["version"]:
            best[d["entryId"]] = d
    return [_clean(d) for d in best.values()]


def retrieve(question: str, k: int = 2) -> List[dict]:
    return _retrieve_all(question, k)[0]


def _retrieve_all(question: str, k: int = 2):
    """Returns (top k docs, excluded list)."""
    qwords = _words(question)
    items = get_items()
    latest = {}  # entryId -> newest active version number
    for d in items.find({"kind": "entry", "status": "active"}):
        if d["version"] > latest.get(d["entryId"], 0):
            latest[d["entryId"]] = d["version"]

    scored = []
    excluded = []
    for d in items.find({"kind": {"$in": ["entry", "note"]}}):
        score = len(qwords & _words((d.get("title") or "") + " " + d.get("text", "")))
        if score < 1:
            continue
        if d["status"] != "active":
            excluded.append({"id": d["_id"], "reason": "quarantined"})
        elif d["kind"] == "entry" and d["version"] < latest.get(d["entryId"], 0):
            excluded.append({"id": d["_id"], "reason": "superseded"})
        else:
            scored.append((score, d))
    scored.sort(key=lambda p: (p[0], p[1]["createdAt"]), reverse=True)
    top = [_clean(d) for _, d in scored[:k]]
    return top, excluded


def ask(user: str, question: str) -> dict:
    from app.agent import AIAgent
    agent = AIAgent()
    return agent.execute_query(user, question)


def save_note(user: str, answer_id: str, text: Optional[str] = None) -> dict:
    items = get_items()
    logs = get_logs()
    ans = items.find_one({"_id": answer_id})
    if ans is None:
        raise ValueError("answer not found: " + answer_id)
    parents = []
    for p in [answer_id] + list(ans.get("parents", [])):
        if p not in parents:
            parents.append(p)
    doc = {
        "_id": _next_id("note", "note", user),
        "kind": "note",
        "text": text if text else ans["text"],
        "parents": parents,
        "user": user,
        "applied": [],
        "status": "active",
        "createdAt": _now(),
        "expireAt": None,
    }
    items.insert_one(doc.copy())
    logs.insert_one(doc.copy())
    return _clean(doc)


def mark_applied(answer_id: str, user: str) -> dict:
    items = get_items()
    logs = get_logs()
    res = items.update_one({"_id": answer_id}, {"$addToSet": {"applied": user}})
    if res.matched_count == 0:
        raise ValueError("answer not found: " + answer_id)
    logs.update_one({"_id": answer_id}, {"$addToSet": {"applied": user}})
    return _clean(items.find_one({"_id": answer_id}))


# ---------- walks ----------

def walk_down(root_id: str) -> List[str]:
    pipeline = [
        {"$match": {"_id": root_id}},
        {"$graphLookup": {
            "from": "items",
            "startWith": "$_id",
            "connectFromField": "_id",
            "connectToField": "parents",
            "as": "found",
            "maxDepth": 10,
        }},
    ]
    return _collect(root_id, pipeline)


def walk_up(start_id: str) -> List[str]:
    pipeline = [
        {"$match": {"_id": start_id}},
        {"$graphLookup": {
            "from": "items",
            "startWith": "$parents",
            "connectFromField": "parents",
            "connectToField": "_id",
            "as": "found",
            "maxDepth": 10,
        }},
    ]
    return _collect(start_id, pipeline)


def _collect(root_id: str, pipeline: list) -> List[str]:
    ids = [root_id]  # start item is added here, not in the pipeline
    for row in get_items().aggregate(pipeline):
        for f in row.get("found", []):
            if f["_id"] not in ids:
                ids.append(f["_id"])
    return ids


def _plural(n: int, word: str) -> str:
    return "%d %s%s" % (n, word, "" if n == 1 else "s")


def blast_radius(root_id: str) -> dict:
    items = get_items()
    root = items.find_one({"_id": root_id})
    if root is None:
        raise ValueError("item not found: " + root_id)
    down = walk_down(root_id)
    # walk up from every node in the blast radius, so good parents
    # (like Networking basics for Dev's answer) show up in the tree too
    up = [root_id]
    for node_id in down:
        for pid in walk_up(node_id):
            if pid not in down and pid not in up:
                up.append(pid)
    docs = {}
    for d in items.find({"_id": {"$in": list(set(down + up))}}):
        docs[d["_id"]] = d

    in_down = [docs[i] for i in down if i in docs]
    answers = [d for d in in_down if d["kind"] == "answer"]
    notes = [d for d in in_down if d["kind"] == "note"]
    edits = [d for d in in_down if d["kind"] == "entry"]

    # people: answers and notes only, not the author of the root
    author = root.get("user")
    people = []
    for d in answers + notes:
        if d["user"] != author and d["user"] not in people:
            people.append(d["user"])
    direct = []
    for d in answers:
        if root_id in d.get("parents", []) and d["user"] in people and d["user"] not in direct:
            direct.append(d["user"])
    second_hand = [p for p in people if p not in direct]
    applied = []
    for d in answers:
        for name in d.get("applied", []):
            if name not in applied:
                applied.append(name)

    line = "%s, %s, %s, %d %s reached, %d confirmed applied" % (
        _plural(len(edits), "edit"), _plural(len(answers), "answer"),
        _plural(len(notes), "note"), len(people),
        "person" if len(people) == 1 else "people", len(applied))
    return {
        "root": root_id,
        "up": up,
        "down": down,
        "items": {i: _clean(d) for i, d in docs.items()},
        "summary": {
            "edits": len(edits),
            "answers": len(answers),
            "notes": len(notes),
            "people_reached": len(people),
            "confirmed_applied": len(applied),
            "direct": direct,
            "second_hand": second_hand,
            "applied": applied,
        },
        "line": line,
    }


def quarantine(root_id: str) -> List[str]:
    items = get_items()
    kb = get_kb()
    logs = get_logs()
    if items.find_one({"_id": root_id}) is None:
        raise ValueError("item not found: " + root_id)
    ids = walk_down(root_id)
    items.update_many({"_id": {"$in": ids}}, {"$set": {"status": "quarantined"}})
    kb.update_many({"_id": {"$in": ids}}, {"$set": {"status": "quarantined"}})
    logs.update_many({"_id": {"$in": ids}}, {"$set": {"status": "quarantined"}})
    return ids


# ---------- reads ----------

def search(q: str) -> List[dict]:
    rx = {"$regex": re.escape(q), "$options": "i"}
    found = get_items().find({"kind": "entry", "$or": [{"text": rx}, {"title": rx}]})
    return [_clean(d) for d in found.sort("createdAt", -1)]


def state() -> List[dict]:
    return [_clean(d) for d in get_items().find().sort("createdAt", 1)]


# ---------- notify ----------

def notify(root_id: str) -> dict:
    out = {"sent": False, "message": "", "recipients": [], "error": None}
    try:
        root = get_items().find_one({"_id": root_id})
        if root is None:
            out["error"] = "item not found: " + root_id
            return out
        br = blast_radius(root_id)
        recipients = br["summary"]["direct"] + br["summary"]["second_hand"]
        fix = ""
        if root["kind"] == "entry":
            good = get_items().find_one(
                {"entryId": root["entryId"], "status": "active"}, sort=[("version", -1)])
            if good:
                fix = good["text"]
        lines = [
            "Blast Radius alert: " + br["line"],
            "Bad guidance: " + root["text"],
            "Why it is wrong: This guidance was found to be unsafe.",
        ]
        if fix:
            lines.append("Corrected step: " + fix)
        lines.append("Received it: " + (", ".join(recipients) if recipients else "nobody"))
        out["message"] = "\n".join(lines)
        out["recipients"] = recipients

        url = os.environ.get("SLACK_WEBHOOK_URL")
        if url:
            try:
                r = requests.post(url, json={"text": out["message"]}, timeout=5)
                out["sent"] = r.status_code == 200
                if not out["sent"]:
                    out["error"] = "slack returned %d" % r.status_code
            except Exception as e:
                out["error"] = str(e)
    except Exception as e:
        out["error"] = str(e)
    return out

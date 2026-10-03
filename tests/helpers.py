"""Independent re-implementations, so tests do not just compare code to itself."""
import re

STOP = set("a an the and or but of to in on at for from with by is are was were "
           "be do does did how what which who when where why this that these "
           "those it its i me my we our you your can could should would may "
           "any some as if so than then there their they them not no".split())


def words(text):
    found = re.findall(r"[a-z0-9]+", text.lower())
    return {w for w in found if len(w) > 2 and w not in STOP}


def expected_retrieve(docs, question, k=2):
    """Plain python version of the retrieval rules, over a list of raw docs."""
    q = words(question)
    entries = [d for d in docs if d["kind"] == "entry" and d["status"] == "active"]
    latest = {}
    for d in entries:
        e = d["entryId"]
        if e not in latest or d["version"] > latest[e]["version"]:
            latest[e] = d
    pool = list(latest.values())
    pool += [d for d in docs if d["kind"] == "note" and d["status"] == "active"]
    scored = []
    for d in pool:
        s = len(q & words((d.get("title") or "") + " " + d["text"]))
        if s >= 1:
            scored.append((s, d["createdAt"], d["_id"]))
    scored.sort(key=lambda t: (t[0], t[1]), reverse=True)
    return [t[2] for t in scored[:k]]


def descendants(docs, root):
    """BFS down the parents links, ignoring status."""
    by_parent = {}
    for d in docs:
        for p in d.get("parents", []):
            by_parent.setdefault(p, []).append(d["_id"])
    seen, todo = {root}, [root]
    while todo:
        cur = todo.pop()
        for c in by_parent.get(cur, []):
            if c not in seen:
                seen.add(c)
                todo.append(c)
    return seen


def ancestors(docs, start):
    by_id = {d["_id"]: d for d in docs}
    seen, todo = {start}, [start]
    while todo:
        cur = todo.pop()
        for p in by_id[cur].get("parents", []):
            if p not in seen:
                seen.add(p)
                todo.append(p)
    return seen


def expected_summary(docs, root):
    by_id = {d["_id"]: d for d in docs}
    down = descendants(docs, root) - {root}
    got = [by_id[i] for i in down]
    answers = [d for d in got if d["kind"] == "answer"]
    notes = [d for d in got if d["kind"] == "note"]
    author = by_id[root]["user"]
    people = {d["user"] for d in answers + notes} - {author}
    direct = {d["user"] for d in answers if root in d["parents"]} - {author}
    applied = {n for d in answers for n in d.get("applied", [])}
    return {
        "answers": len(answers), "notes": len(notes),
        "people": people, "direct": direct,
        "second_hand": people - direct, "applied": applied,
    }


def plural(n, word):
    return "%d %s%s" % (n, word, "" if n == 1 else "s")

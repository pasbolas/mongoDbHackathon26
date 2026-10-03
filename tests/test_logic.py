import pytest

from app import logic
from app.db import get_items
from helpers import (expected_retrieve, expected_summary, descendants,
                     ancestors, plural)

LINE = "1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied"


def raw():
    return list(get_items().find({}))


def doc(id_, kind, parents=(), user="X", status="active", **kw):
    d = {"_id": id_, "kind": kind, "parents": list(parents), "user": user,
         "applied": [], "status": status, "text": kw.pop("text", "t"),
         "expireAt": None}
    from datetime import datetime
    d["createdAt"] = kw.pop("createdAt", datetime.utcnow())
    d.update(kw)
    get_items().insert_one(d)
    return d


# ---------- edit_entry ----------
def test_edit_entry_versions():
    a = logic.edit_entry("entry_9", "first", "Sam", title="Nine")
    b = logic.edit_entry("entry_9", "second", "Priya")
    c = logic.edit_entry("entry_9", "third", "Sam", title="New title")
    assert [a["_id"], b["_id"], c["_id"]] == ["entry_9_v1", "entry_9_v2", "entry_9_v3"]
    assert [a["version"], b["version"], c["version"]] == [1, 2, 3]
    assert b["title"] == "Nine"          # title copied
    assert c["title"] == "New title"
    assert b["parents"] == [] and b["kind"] == "entry" and b["status"] == "active"
    assert get_items().count_documents({"entryId": "entry_9"}) == 3
    # v1 untouched
    assert get_items().find_one({"_id": "entry_9_v1"})["text"] == "first"


def test_latest_active_entries():
    logic.edit_entry("entry_1", "one", "Sam", title="One")
    logic.edit_entry("entry_2", "two a", "Sam", title="Two")
    logic.edit_entry("entry_2", "two b", "Sam")
    got = {d["_id"] for d in logic.latest_active_entries()}
    assert got == {"entry_1_v1", "entry_2_v2"}
    logic.quarantine("entry_2_v2")
    got = {d["_id"] for d in logic.latest_active_entries()}
    assert got == {"entry_1_v1", "entry_2_v1"}


# ---------- retrieve ----------
def test_retrieve_latest_active_only():
    logic.edit_entry("entry_4", "alpha banana cherry", "Sam", title="Fruit")
    logic.edit_entry("entry_4", "alpha banana cherry mango", "Sam")
    got = [d["_id"] for d in logic.retrieve("alpha banana cherry")]
    assert got == ["entry_4_v2"]


def test_retrieve_score_order_and_k():
    logic.edit_entry("entry_1", "zebra", "Sam", title="a")
    logic.edit_entry("entry_2", "zebra yellow", "Sam", title="b")
    logic.edit_entry("entry_3", "zebra yellow xylophone", "Sam", title="c")
    got = [d["_id"] for d in logic.retrieve("zebra yellow xylophone")]
    assert got == ["entry_3_v1", "entry_2_v1"]
    assert len(logic.retrieve("zebra yellow xylophone", k=3)) == 3


def test_retrieve_tie_prefers_newer():
    logic.edit_entry("entry_1", "walrus", "Sam", title="a")
    logic.edit_entry("entry_2", "walrus", "Sam", title="b")
    assert logic.retrieve("walrus", k=1)[0]["_id"] == "entry_2_v1"


def test_retrieve_stopwords_and_short_words_do_not_score():
    logic.edit_entry("entry_1", "the and for you to it", "Sam", title="zz")
    assert logic.retrieve("the and for you to it") == []
    assert logic.retrieve("no match here qqqq") == []


def test_retrieve_matches_whole_words_and_title():
    logic.edit_entry("entry_1", "clusters are big", "Sam", title="Quokka")
    assert logic.retrieve("cluster") == []           # not a word match
    assert [d["_id"] for d in logic.retrieve("quokka")] == ["entry_1_v1"]


def test_retrieve_notes_are_retrievable():
    ans = logic.ask("Aoife", "anything")
    note = logic.save_note("Aoife", ans["id"], "pelican migration schedule")
    got = [d["_id"] for d in logic.retrieve("pelican schedule")]
    assert got == [note["_id"]]


def test_retrieve_never_returns_answers():
    logic.edit_entry("entry_1", "walrus tusk", "Sam", title="a")
    logic.ask("Aoife", "walrus tusk")
    kinds = {d["kind"] for d in logic.retrieve("walrus tusk", k=5)}
    assert kinds <= {"entry", "note"}


def test_retrieve_quarantined_excluded():
    logic.edit_entry("entry_1", "walrus tusk", "Sam", title="a")
    logic.quarantine("entry_1_v1")
    assert logic.retrieve("walrus tusk") == []


def test_retrieve_matches_independent_scorer(seeded):
    docs = raw()
    for q in ["How do I connect to the dev database cluster?",
              "firewall rules for the team project",
              "deploy the demo app container",
              "invite to the shared project"]:
        want = expected_retrieve(docs, q)
        got = [d["_id"] for d in logic.retrieve(q)]
        assert got == want, q


# ---------- ask ----------
def test_ask_parents_and_doc():
    logic.edit_entry("entry_1", "walrus tusk", "Sam", title="Walrus")
    r = logic.ask("Aoife", "tell me about the walrus tusk")
    assert r["id"].startswith("ans_aoife_")
    assert r["parents"] == ["entry_1_v1"]
    assert [x["id"] for x in r["retrieved"]] == ["entry_1_v1"]
    assert r["retrieved"][0]["kind"] == "entry" and r["retrieved"][0]["title"] == "Walrus"
    assert "walrus" in r["answer"].lower()
    d = get_items().find_one({"_id": r["id"]})
    assert d["kind"] == "answer" and d["parents"] == ["entry_1_v1"]
    assert d["user"] == "Aoife" and d["status"] == "active" and d["applied"] == []
    assert d["question"] == "tell me about the walrus tusk"


def test_ask_excluded_reasons():
    logic.edit_entry("entry_1", "walrus tusk", "Sam", title="Walrus")
    logic.edit_entry("entry_1", "walrus tusk ivory", "Sam")
    logic.edit_entry("entry_2", "walrus tusk", "Sam", title="Other")
    logic.quarantine("entry_2_v1")
    r = logic.ask("Tom", "walrus tusk ivory")
    assert r["parents"] == ["entry_1_v2"]
    ex = {x["id"]: x["reason"] for x in r["excluded"]}
    assert ex == {"entry_1_v1": "superseded", "entry_2_v1": "quarantined"}


def test_ask_with_no_match_still_logs_answer():
    r = logic.ask("Tom", "qqqq zzzz")
    assert r["parents"] == [] and r["retrieved"] == []
    assert get_items().find_one({"_id": r["id"]}) is not None


def test_answer_ids_unique():
    ids = {logic.ask("Tom", "qqqq")["id"] for _ in range(4)}
    assert len(ids) == 4


# ---------- save_note ----------
def test_save_note_parents_and_text():
    logic.edit_entry("entry_1", "walrus tusk", "Sam", title="a")
    logic.edit_entry("entry_2", "walrus ivory", "Sam", title="b")
    r = logic.ask("Aoife", "walrus tusk ivory")
    note = logic.save_note("Aoife", r["id"])
    assert note["kind"] == "note" and note["id" if "id" in note else "_id"].startswith("note_aoife_")
    assert note["parents"] == [r["id"]] + r["parents"]
    assert note["text"] == r["answer"]
    custom = logic.save_note("Aoife", r["id"], "my own words")
    assert custom["text"] == "my own words"
    assert len(set(custom["parents"])) == len(custom["parents"])


# ---------- mark_applied ----------
def test_mark_applied_no_duplicates():
    r = logic.ask("Tom", "qqqq")
    logic.mark_applied(r["id"], "Tom")
    d = logic.mark_applied(r["id"], "Tom")
    d = logic.mark_applied(r["id"], "Mei")
    assert d["applied"] == ["Tom", "Mei"]


# ---------- walks ----------
def test_walk_down_seed(seeded):
    ids = seeded
    down = logic.walk_down(ids["v2"])
    assert down[0] == ids["v2"]
    assert set(down) == {ids[k] for k in ("v2", "aoife", "tom", "mei", "note", "dev")}
    assert len(down) == len(set(down))
    assert set(logic.walk_down(ids["v1"])) == {ids["v1"], ids["ravi"]}
    assert logic.walk_down(ids["v3"]) == [ids["v3"]]
    # same as the independent BFS
    assert set(down) == descendants(raw(), ids["v2"])


def test_walk_up_seed(seeded):
    ids = seeded
    up = logic.walk_up(ids["dev"])
    assert up[0] == ids["dev"]
    assert set(up) == {ids["dev"], ids["note"], ids["aoife"], ids["v2"], "entry_3_v1"}
    assert set(up) == ancestors(raw(), ids["dev"])
    assert logic.walk_up(ids["v2"]) == [ids["v2"]]


def test_walks_ignore_status(seeded):
    ids = seeded
    logic.quarantine(ids["v2"])
    assert set(logic.walk_down(ids["v2"])) == {ids[k] for k in
        ("v2", "aoife", "tom", "mei", "note", "dev")}
    assert ids["v2"] in logic.walk_up(ids["dev"])


# ---------- blast radius ----------
def test_blast_radius_seed(seeded):
    ids = seeded
    b = logic.blast_radius(ids["v2"])
    assert b["line"] == LINE
    s = b["summary"]
    assert (s["edits"], s["answers"], s["notes"]) == (1, 4, 1)
    assert s["people_reached"] == 4 and s["confirmed_applied"] == 2
    assert set(s["direct"]) == {"Aoife", "Tom", "Mei"}
    assert s["second_hand"] == ["Dev"]
    assert set(s["applied"]) == {"Aoife", "Tom"}
    assert b["root"] == ids["v2"]
    assert set(b["down"]) == {ids[k] for k in ("v2", "aoife", "tom", "mei", "note", "dev")}
    assert ids["ravi"] not in b["items"] and ids["v1"] not in b["items"]
    assert ids["v3"] not in b["items"]


def test_blast_radius_matches_independent_summary(seeded):
    ids = seeded
    exp = expected_summary(raw(), ids["v2"])
    s = logic.blast_radius(ids["v2"])["summary"]
    assert s["answers"] == exp["answers"] and s["notes"] == exp["notes"]
    assert s["people_reached"] == len(exp["people"])
    assert set(s["direct"]) == exp["direct"]
    assert set(s["second_hand"]) == exp["second_hand"]
    assert set(s["applied"]) == exp["applied"]
    assert s["confirmed_applied"] == len(exp["applied"])
    want_line = "1 edit, %s, %s, %s reached, %d confirmed applied" % (
        plural(exp["answers"], "answer"), plural(exp["notes"], "note"),
        plural(len(exp["people"]), "person").replace("persons", "people"),
        len(exp["applied"]))
    assert logic.blast_radius(ids["v2"])["line"] == want_line


def test_blast_radius_ravi_and_v3(seeded):
    ids = seeded
    b = logic.blast_radius(ids["v1"])
    assert b["summary"]["answers"] == 1 and b["summary"]["notes"] == 0
    assert b["summary"]["direct"] == ["Ravi"]
    b3 = logic.blast_radius(ids["v3"])
    assert b3["summary"]["answers"] == 0 and b3["summary"]["people_reached"] == 0


def test_line_singular():
    doc("e_v1", "entry", user="Sam", entryId="e", version=1)
    doc("a1", "answer", ["e_v1"], user="Tom")
    doc("n1", "note", ["a1", "e_v1"], user="Tom")
    b = logic.blast_radius("e_v1")
    assert b["line"] == "1 edit, 1 answer, 1 note, 1 person reached, 0 confirmed applied"
    assert b["summary"]["people_reached"] == 1


def test_people_split_direct_wins_and_author_excluded():
    doc("e_v1", "entry", user="Sam", entryId="e", version=1)
    doc("a_tom", "answer", ["e_v1"], user="Tom", applied=["Tom"])
    doc("n_tom", "note", ["a_tom", "e_v1"], user="Tom")
    doc("a_dev", "answer", ["n_tom"], user="Dev")
    doc("a_dev2", "answer", ["a_tom"], user="Dev")            # Dev only second hand
    doc("a_sam", "answer", ["e_v1"], user="Sam")              # author asking: not counted
    doc("a_tom2", "answer", ["n_tom"], user="Tom")            # Tom is also direct
    s = logic.blast_radius("e_v1")["summary"]
    assert set(s["direct"]) == {"Tom"}
    assert set(s["second_hand"]) == {"Dev"}
    assert s["people_reached"] == 2
    assert s["confirmed_applied"] == 1


# ---------- quarantine ----------
def test_quarantine_marks_walk_and_keeps_others(seeded):
    ids = seeded
    got = logic.quarantine(ids["v2"])
    bad = {ids[k] for k in ("v2", "aoife", "tom", "mei", "note", "dev")}
    assert set(got) == bad
    status = {d["_id"]: d["status"] for d in raw()}
    for i, s in status.items():
        assert s == ("quarantined" if i in bad else "active"), i
    assert status[ids["ravi"]] == "active"
    assert status["entry_3_v1"] == "active"


def test_quarantine_then_ask_returns_v3_only(seeded):
    ids = seeded
    logic.quarantine(ids["v2"])
    r = logic.ask("Sana", "How do I connect to the dev database cluster?")
    assert r["parents"] == [ids["v3"]]
    assert [x["id"] for x in r["retrieved"]] == [ids["v3"]]
    ex = {x["id"]: x["reason"] for x in r["excluded"]}
    assert ex[ids["v2"]] == "quarantined"
    assert ex[ids["note"]] == "quarantined"
    assert ex[ids["v1"]] == "superseded"
    assert "0.0.0.0/0" not in r["answer"]


def test_quarantine_does_not_hide_children_from_blast(seeded):
    ids = seeded
    before = logic.blast_radius(ids["v2"])["line"]
    logic.quarantine(ids["v2"])
    assert logic.blast_radius(ids["v2"])["line"] == before == LINE


# ---------- seed story ----------
def test_seed_parents(seeded):
    ids = seeded
    by = {d["_id"]: d for d in raw()}
    for k in ("aoife", "tom", "mei"):
        assert by[ids[k]]["parents"] == [ids["v2"]], k
    assert by[ids["ravi"]]["parents"] == [ids["v1"]]
    assert by[ids["note"]]["parents"] == [ids["aoife"], ids["v2"]]
    assert by[ids["dev"]]["parents"] == [ids["note"], "entry_3_v1"]
    assert by[ids["aoife"]]["applied"] == ["Aoife"]
    assert by[ids["tom"]]["applied"] == ["Tom"]
    assert by[ids["mei"]]["applied"] == [] and by[ids["ravi"]]["applied"] == []
    assert "0.0.0.0/0" not in by[ids["v3"]]["text"]
    assert "0.0.0.0/0" in by[ids["v2"]]["text"]


def test_seed_is_repeatable():
    import seed
    a = seed.seed(reset=True)
    b = seed.seed(reset=True)
    assert a == b
    assert get_items().count_documents({}) == 12


# ---------- search ----------
def test_search_regex_entries_only(seeded):
    got = {d["_id"] for d in logic.search("0.0.0.0/0")}
    assert got == {seeded["v2"]}                      # note has it too, but is not an entry
    assert {d["_id"] for d in logic.search("FIREWALL")} == {"entry_3_v1"}
    assert logic.search("((") == []                   # re.escape, no crash


# ---------- state ----------
def test_state_sorted_and_json_safe(seeded):
    import json
    docs = logic.state()
    assert len(docs) == 12
    times = [d["createdAt"] for d in docs]
    assert times == sorted(times)
    assert all(isinstance(t, str) for t in times)
    json.dumps(docs)


# ---------- notify ----------
def test_notify_no_webhook(seeded, monkeypatch):
    monkeypatch.delenv("SLACK_WEBHOOK_URL", raising=False)
    ids = seeded
    r = logic.notify(ids["v2"])
    assert r["sent"] is False
    assert set(r["recipients"]) == {"Aoife", "Tom", "Mei", "Dev"}
    m = r["message"]
    assert "0.0.0.0/0" in m
    assert "unsafe" in m
    assert "Never open the list to the whole internet" in m   # text of v3
    for n in ("Aoife", "Tom", "Mei", "Dev"):
        assert n in m
    assert "Ravi" not in m


def test_notify_posts_to_webhook(seeded, monkeypatch):
    import requests
    monkeypatch.setenv("SLACK_WEBHOOK_URL", "https://hooks.example.test/x")
    calls = []

    class R:
        status_code = 200
        text = "ok"

        def raise_for_status(self):
            pass

    def fake_post(url, *a, **kw):
        calls.append((url, kw))
        return R()

    monkeypatch.setattr(requests, "post", fake_post)
    r = logic.notify(seeded["v2"])
    assert len(calls) == 1 and calls[0][0] == "https://hooks.example.test/x"
    assert r["sent"] is True and r["error"] is None


def test_notify_never_raises(seeded, monkeypatch):
    import requests
    monkeypatch.setenv("SLACK_WEBHOOK_URL", "https://hooks.example.test/x")

    def boom(*a, **kw):
        raise requests.ConnectionError("down")

    monkeypatch.setattr(requests, "post", boom)
    r = logic.notify(seeded["v2"])
    assert r["sent"] is False and r["error"]
    assert r["message"]


def test_blast_items_include_devs_good_parent(seeded):
    """Demo beat: Dev's answer has one red parent (the note) and one green (Networking basics).
    The tree needs entry_3_v1 in items, so blast_radius must walk up from the down items too."""
    b = logic.blast_radius(seeded["v2"])
    assert "entry_3_v1" in b["items"]
    assert b["items"]["entry_3_v1"]["status"] == "active"
    assert "entry_3_v1" not in b["down"]

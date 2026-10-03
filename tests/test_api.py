import json

import pytest
from fastapi.testclient import TestClient

from app.main import app

LINE = "1 edit, 4 answers, 1 note, 4 people reached, 2 confirmed applied"


@pytest.fixture
def client():
    return TestClient(app)


def test_index_served(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "html" in r.headers["content-type"]


def test_state_empty_and_seeded(client, seeded):
    items = client.get("/state").json()["items"]
    assert len(items) == 12
    json.dumps(items)
    assert all("_id" in d and "status" in d for d in items)


def test_search(client, seeded):
    r = client.get("/search", params={"q": "0.0.0.0/0"}).json()["results"]
    assert [d["_id"] for d in r] == [seeded["v2"]]
    assert client.get("/search", params={"q": "zzzzqq"}).json()["results"] == []


def test_blast_endpoint(client, seeded):
    b = client.get("/blast/" + seeded["v2"]).json()
    assert b["line"] == LINE
    assert b["root"] == seeded["v2"]
    assert seeded["ravi"] not in b["items"]
    assert b["summary"]["second_hand"] == ["Dev"]


def test_quarantine_and_state(client, seeded):
    r = client.post("/quarantine/" + seeded["v2"]).json()
    assert len(r["quarantined"]) == 6
    by = {d["_id"]: d["status"] for d in client.get("/state").json()["items"]}
    assert by[seeded["v2"]] == "quarantined" and by[seeded["dev"]] == "quarantined"
    assert by[seeded["ravi"]] == "active" and by["entry_3_v1"] == "active"


def test_notify_endpoint(client, seeded):
    r = client.post("/notify/" + seeded["v2"]).json()
    assert r["sent"] is False
    assert set(r["recipients"]) == {"Aoife", "Tom", "Mei", "Dev"}
    assert "0.0.0.0/0" in r["message"]


def test_ask_apply_note_edit_flow(client):
    e = client.post("/edit", json={"entry_id": "entry_1", "title": "Walrus",
                                   "text": "walrus tusk care", "user": "Sam"}).json()
    assert e["_id"] == "entry_1_v1"
    a = client.post("/ask", json={"user": "Tom", "question": "walrus tusk care"}).json()
    assert a["parents"] == ["entry_1_v1"]
    assert a["retrieved"][0]["id"] == "entry_1_v1"
    d = client.post("/apply", json={"answer_id": a["id"], "user": "Tom"}).json()
    assert d["applied"] == ["Tom"]
    n = client.post("/note", json={"user": "Tom", "answer_id": a["id"]}).json()
    assert n["kind"] == "note" and n["parents"] == [a["id"], "entry_1_v1"]
    n2 = client.post("/note", json={"user": "Tom", "answer_id": a["id"],
                                    "text": "custom"}).json()
    assert n2["text"] == "custom"
    e2 = client.post("/edit", json={"entry_id": "entry_1", "text": "new text",
                                    "user": "Priya"}).json()
    assert e2["_id"] == "entry_1_v2" and e2["title"] == "Walrus"


def test_reset(client, seeded):
    assert client.post("/reset").json() == {"ok": True}
    assert client.get("/state").json()["items"] == []


def test_full_demo_over_http(client, seeded):
    """The 3 minute demo, step by step, only through the API."""
    hit = client.get("/search", params={"q": "0.0.0.0/0"}).json()["results"][0]
    assert hit["version"] == 2
    assert client.get("/blast/" + hit["_id"]).json()["line"] == LINE
    client.post("/quarantine/" + hit["_id"])
    client.post("/notify/" + hit["_id"])
    a = client.post("/ask", json={"user": "Judge",
                                  "question": "How do I connect to the dev database cluster?"}).json()
    assert a["parents"] == [seeded["v3"]]
    assert {x["id"] for x in a["excluded"]} >= {seeded["v2"], seeded["note"]}
    # numbers did not move after the extra ask
    assert client.get("/blast/" + hit["_id"]).json()["line"] == LINE

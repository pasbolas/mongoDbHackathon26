from fastapi.testclient import TestClient
from app import logic
from app.db import get_kb, get_logs, get_items
from app.main import app

client = TestClient(app)


def test_kb_create_and_list():
    res = client.post("/kb", json={
        "title": "Production Deployment Standard",
        "text": "All services must run health checks every 30 seconds.",
        "user": "Priya",
        "category": "Deployment",
        "tags": ["prod", "health"]
    })
    assert res.status_code == 200
    doc = res.json()
    assert doc["title"] == "Production Deployment Standard"
    assert doc["version"] == 1
    assert doc["category"] == "Deployment"

    # Verify present in knowledge_base collection
    kb_doc = get_kb().find_one({"_id": doc["_id"]})
    assert kb_doc is not None
    assert kb_doc["user"] == "Priya"

    # List entries
    list_res = client.get("/kb")
    assert list_res.status_code == 200
    entries = list_res.json()["entries"]
    assert any(e["title"] == "Production Deployment Standard" for e in entries)


def test_kb_versioning():
    # Create v1
    v1 = logic.edit_entry("entry_firewall", "Allow port 443 only", "Sam", title="Firewall Rules")
    assert v1["version"] == 1

    # Add v2
    v2_res = client.post("/kb/entry_firewall/version", json={
        "text": "Allow port 443 and port 80 for redirects",
        "user": "Priya",
        "title": "Firewall Rules"
    })
    assert v2_res.status_code == 200
    v2 = v2_res.json()
    assert v2["version"] == 2
    assert v2["user"] == "Priya"

    # Get entry detail
    detail_res = client.get("/kb/entry_firewall")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["entryId"] == "entry_firewall"
    assert detail["latestVersion"] == 2
    assert len(detail["versions"]) == 2


def test_logs_collection_populated_on_ask_and_note():
    logic.edit_entry("entry_db", "Database host is mongo.internal:27017", "Sam", title="DB Host")
    ans = logic.ask("Aoife", "What is the database host?")

    # Verify answer is in logs collection
    logs_doc = get_logs().find_one({"_id": ans["id"]})
    assert logs_doc is not None
    assert logs_doc["kind"] == "answer"
    assert logs_doc["user"] == "Aoife"

    # Save note
    note = logic.save_note("Aoife", ans["id"], "My saved DB note")
    note_doc = get_logs().find_one({"_id": note["_id"]})
    assert note_doc is not None
    assert note_doc["kind"] == "note"

    # Query via API
    logs_res = client.get("/logs?kind=answer")
    assert logs_res.status_code == 200
    items = logs_res.json()["logs"]
    assert any(l["_id"] == ans["id"] for l in items)


def test_quarantine_syncs_across_all_collections(seeded):
    # seeded creates entry_7_v2 and descendants
    q_res = client.post("/quarantine/entry_7_v2")
    assert q_res.status_code == 200

    # Verify quarantined in items
    assert get_items().find_one({"_id": "entry_7_v2"})["status"] == "quarantined"
    # Verify quarantined in knowledge_base
    assert get_kb().find_one({"_id": "entry_7_v2"})["status"] == "quarantined"
    # Verify descendants quarantined in logs
    assert get_logs().find_one({"_id": seeded["aoife"]})["status"] == "quarantined"
    assert get_logs().find_one({"_id": seeded["note"]})["status"] == "quarantined"

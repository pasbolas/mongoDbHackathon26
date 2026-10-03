import re
import time
from typing import Dict, Any, List
from app.db import get_items, get_kb, get_logs
from app.llm import complete_with_metadata, get_active_model_name


class AIAgent:
    """Autonomous agent that queries MongoDB in real time and saves results into blast."""

    def __init__(self, name: str = "Blast Guardian Agent"):
        self.name = name

    def execute_query(self, user: str, question: str) -> Dict[str, Any]:
        start_time = time.time()
        trace_steps = []

        from app.logic import _words, _retrieve_all, _now, _next_id

        # Step 1: Real MongoDB MQL queries on knowledge_base and logs
        qwords = list(_words(question))
        kb_col = get_kb()
        logs_col = get_logs()

        if qwords:
            kb_filter = {"$or": [
                {"title": {"$regex": re.escape(w), "$options": "i"}} for w in qwords[:4]
            ] + [
                {"text": {"$regex": re.escape(w), "$options": "i"}} for w in qwords[:4]
            ]}
        else:
            kb_filter = {}

        kb_start = time.time()
        kb_matched_count = kb_col.count_documents(kb_filter) if kb_filter else kb_col.count_documents({})
        kb_latency = int((time.time() - kb_start) * 1000)

        trace_steps.append({
            "step": "query_knowledge_base",
            "collection": "blast.knowledge_base",
            "mql": f"db.knowledge_base.find({kb_filter})",
            "docs_matched": kb_matched_count,
            "latency_ms": max(1, kb_latency)
        })

        if qwords:
            notes_filter = {
                "kind": "note",
                "$or": [{"text": {"$regex": re.escape(w), "$options": "i"}} for w in qwords[:4]]
            }
        else:
            notes_filter = {"kind": "note"}

        note_start = time.time()
        note_matched_count = logs_col.count_documents(notes_filter)
        note_latency = int((time.time() - note_start) * 1000)

        trace_steps.append({
            "step": "query_notes_logs",
            "collection": "blast.logs",
            "mql": f"db.logs.find({notes_filter})",
            "docs_matched": note_matched_count,
            "latency_ms": max(1, note_latency)
        })

        # Step 2: Provenance guardrail analysis
        top, excluded = _retrieve_all(question, k=2)
        quarantined_hits = [x for x in excluded if x.get("reason") == "quarantined"]
        superseded_hits = [x for x in excluded if x.get("reason") == "superseded"]

        trace_steps.append({
            "step": "provenance_guardrails",
            "quarantined_blocked": [x["id"] for x in quarantined_hits],
            "superseded_blocked": [x["id"] for x in superseded_hits],
            "safe_sources_passed": [d["_id"] for d in top]
        })

        # Step 3: LLM reasoning and synthesis
        llm_start = time.time()
        answer_text, model_name = complete_with_metadata(question, top)
        llm_latency = int((time.time() - llm_start) * 1000)

        trace_steps.append({
            "step": "llm_synthesis",
            "model": model_name,
            "latency_ms": max(1, llm_latency)
        })

        total_latency = int((time.time() - start_time) * 1000)

        # Step 4: Persist answer and details into blast
        answer_id = _next_id("ans", "answer", user)
        trace_data = {
            "agent": self.name,
            "model": model_name,
            "total_time_ms": total_latency,
            "steps": trace_steps,
            "retrieved": [{"id": d["_id"], "title": d.get("title"), "kind": d["kind"]} for d in top],
            "excluded": excluded
        }

        doc = {
            "_id": answer_id,
            "kind": "answer",
            "text": answer_text,
            "parents": [d["_id"] for d in top],
            "user": user,
            "applied": [],
            "status": "active",
            "question": question,
            "agentTrace": trace_data,
            "createdAt": _now(),
            "expireAt": None,
        }

        get_items().insert_one(doc.copy())
        get_logs().insert_one(doc.copy())

        return {
            "id": doc["_id"],
            "answer": answer_text,
            "parents": doc["parents"],
            "retrieved": [{"id": d["_id"], "title": d.get("title"), "kind": d["kind"]} for d in top],
            "excluded": excluded,
            "agentTrace": trace_data
        }

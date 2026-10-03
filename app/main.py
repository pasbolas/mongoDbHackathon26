import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import logic
from app.db import reset_db

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC = os.path.join(BASE, "static")

app = FastAPI(title="Blast Radius")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class AskIn(BaseModel):
    user: str
    question: str


class ApplyIn(BaseModel):
    answer_id: str
    user: str


class NoteIn(BaseModel):
    user: str
    answer_id: str
    text: Optional[str] = None


class EditIn(BaseModel):
    entry_id: str
    text: str
    user: str
    title: Optional[str] = None


def _or_404(fn, *args):
    try:
        return fn(*args)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/")
def index():
    path = os.path.join(STATIC, "index.html")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="static/index.html not found")
    return FileResponse(path)


@app.get("/state")
def get_state():
    return {"items": logic.state()}


@app.get("/search")
def get_search(q: str = ""):
    return {"results": logic.search(q)}


@app.get("/blast/{item_id}")
def get_blast(item_id: str):
    return _or_404(logic.blast_radius, item_id)


@app.post("/quarantine/{item_id}")
def post_quarantine(item_id: str):
    return {"quarantined": _or_404(logic.quarantine, item_id)}


@app.post("/notify/{item_id}")
def post_notify(item_id: str):
    return logic.notify(item_id)


@app.post("/ask")
def post_ask(body: AskIn):
    return logic.ask(body.user, body.question)


@app.post("/apply")
def post_apply(body: ApplyIn):
    return _or_404(logic.mark_applied, body.answer_id, body.user)


@app.post("/note")
def post_note(body: NoteIn):
    return _or_404(logic.save_note, body.user, body.answer_id, body.text)


@app.post("/edit")
def post_edit(body: EditIn):
    return logic.edit_entry(body.entry_id, body.text, body.user, body.title)


class KBCreateIn(BaseModel):
    title: str
    text: str
    user: str
    category: Optional[str] = "General"
    tags: Optional[list] = None


class KBVersionIn(BaseModel):
    text: str
    user: str
    title: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list] = None


@app.get("/kb")
def get_kb(category: Optional[str] = None, active_only: bool = False):
    return {"entries": logic.list_kb_entries(category=category, active_only=active_only)}


@app.get("/kb/{entry_id}")
def get_kb_detail(entry_id: str):
    return _or_404(logic.get_kb_entry, entry_id)


@app.post("/kb")
def post_kb(body: KBCreateIn):
    return logic.create_kb_entry(body.title, body.text, body.user, body.category, body.tags)


@app.post("/kb/{entry_id}/version")
def post_kb_version(entry_id: str, body: KBVersionIn):
    return logic.edit_entry(entry_id, body.text, body.user, body.title, body.category, body.tags)


@app.get("/logs")
def get_logs(kind: Optional[str] = None, user: Optional[str] = None, status: Optional[str] = None):
    return {"logs": logic.list_logs(kind=kind, user=user, status=status)}


@app.post("/reset")
def post_reset():
    reset_db()
    return {"ok": True}


@app.post("/reseed")
def post_reseed():
    import seed
    seed.seed(reset=True)
    return {"ok": True}


class LLMConfigIn(BaseModel):
    provider: str
    api_key: str
    model: Optional[str] = None


@app.get("/config/llm")
def get_llm_config():
    from app.llm import get_active_model_name
    providers = []
    if os.environ.get("HOPLITE_API_KEY"):
        providers.append("hoplite")
    if os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"):
        providers.append("gemini")
    if os.environ.get("OPENAI_API_KEY"):
        providers.append("openai")
    if os.environ.get("GROQ_API_KEY"):
        providers.append("groq")
    if os.environ.get("ANTHROPIC_API_KEY"):
        providers.append("anthropic")
    return {
        "active_model": get_active_model_name(),
        "configured_providers": providers
    }


@app.post("/config/llm")
def post_llm_config(body: LLMConfigIn):
    prov = body.provider.lower().strip()
    key_name = f"{prov.upper()}_API_KEY"
    if prov == "hoplite":
        key_name = "HOPLITE_API_KEY"
        if body.model:
            os.environ["HOPLITE_MODEL"] = body.model
    elif prov == "gemini":
        key_name = "GEMINI_API_KEY"
        if body.model:
            os.environ["GEMINI_MODEL"] = body.model
    elif prov == "openai":
        key_name = "OPENAI_API_KEY"
        if body.model:
            os.environ["OPENAI_MODEL"] = body.model
    elif prov == "groq":
        key_name = "GROQ_API_KEY"
        if body.model:
            os.environ["GROQ_MODEL"] = body.model
    elif prov == "anthropic":
        key_name = "ANTHROPIC_API_KEY"
        if body.model:
            os.environ["LLM_MODEL"] = body.model

    os.environ[key_name] = body.api_key.strip()

    env_path = os.path.join(BASE, ".env")
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                lines = f.readlines()
        lines = [l for l in lines if not l.startswith(f"{key_name}=")]
        lines.append(f"{key_name}={body.api_key.strip()}\n")
        with open(env_path, "w") as f:
            f.writelines(lines)
    except Exception:
        pass

    from app.llm import get_active_model_name
    return {"ok": True, "active_model": get_active_model_name(), "provider": prov}


os.makedirs(STATIC, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC), name="static")

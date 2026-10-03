import os
from typing import List, Tuple
import requests

SYSTEM = ("Answer in 2 sentences. Answer only from these items. "
          "Quote exact settings from them.")


import re

def _fallback(items: List[dict], question: str = "") -> str:
    return _synthesize_local(question, items)


def _synthesize_local(question: str, items: List[dict]) -> str:
    """Intelligently synthesize answers targeting the user's specific question from retrieved items."""
    if not items:
        return "Based on the guide: no matching guide page was found."

    top_text = (items[0].get("text") or "").strip()
    title = items[0].get("title") or "the guide"

    if not question:
        return "Based on " + title + ": " + top_text

    # Split text into sentences
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", top_text) if s.strip()]
    if not sentences:
        return "Based on " + title + ": " + top_text

    q_words = set(re.findall(r"[a-z0-9]+", question.lower())) - {
        "how", "what", "which", "where", "who", "why", "the", "and", "for",
        "are", "is", "do", "i", "to", "a", "our", "my", "dev", "please", "can"
    }

    scored = []
    for idx, s in enumerate(sentences):
        s_words = set(re.findall(r"[a-z0-9]+", s.lower()))
        score = len(q_words & s_words)
        scored.append((score, idx, s))

    scored.sort(key=lambda x: (x[0], -x[1]), reverse=True)
    best_indices = sorted([x[1] for x in scored[:2] if x[0] > 0])

    if best_indices:
        selected = [sentences[i] for i in best_indices]
        answer = " ".join(selected)
    else:
        answer = " ".join(sentences[:2])

    return "Based on " + title + ": " + answer


def get_active_model_name() -> str:
    """Return the name of the active model or engine."""
    if os.environ.get("HOPLITE_API_KEY"):
        return os.environ.get("HOPLITE_MODEL", "hoplite-agent-v1")
    if os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"):
        return os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
    if os.environ.get("OPENAI_API_KEY"):
        return os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    if os.environ.get("GROQ_API_KEY"):
        return os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    if os.environ.get("ANTHROPIC_API_KEY"):
        return os.environ.get("LLM_MODEL", "claude-haiku-4-5-20251001")
    return "autonomous-knowledge-engine"


def complete_with_metadata(question: str, items: List[dict]) -> Tuple[str, str]:
    """Answer from items and return (text, model_name). Never raises."""
    if not items:
        return _fallback(items, question), "offline-empty"

    context = "\n\n".join(
        "[%s] %s" % (i.get("id", i.get("_id", "")), i.get("text", ""))
        for i in items)

    # 0. Hoplite.sh
    hoplite_key = os.environ.get("HOPLITE_API_KEY")
    if hoplite_key:
        model = os.environ.get("HOPLITE_MODEL", "hoplite-agent-v1")
        try:
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream",
                "X-Api-Key": hoplite_key
            }
            payload = {
                "jsonrpc": "2.0",
                "method": "hoplite_call_api",
                "params": {
                    "method": "POST",
                    "path": "/api/v1/chat/completions",
                    "body": {
                        "model": model,
                        "messages": [
                            {"role": "system", "content": SYSTEM},
                            {"role": "user", "content": f"Items:\n{context}\n\nQuestion: {question}"}
                        ],
                        "temperature": 0.0,
                        "max_tokens": 200
                    }
                },
                "id": 1
            }
            r = requests.post("https://api.hoplite.sh/mcp", headers=headers, json=payload, timeout=6.0)
            if r.status_code == 200:
                data = r.json()
                if "result" in data and data["result"].get("choices"):
                    choice = data["result"]["choices"][0]
                    if isinstance(choice, dict) and "message" in choice:
                        text = choice["message"].get("content", "").strip()
                    else:
                        text = choice.get("message", "").strip() if isinstance(choice, dict) else str(choice).strip()
                    if text:
                        return text, f"hoplite:{model}"
        except Exception:
            pass

    # 1. Google Gemini
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            prompt = f"System: {SYSTEM}\n\nContext items:\n{context}\n\nQuestion: {question}"
            r = requests.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.0, "maxOutputTokens": 200}
            }, timeout=6.0)
            if r.status_code == 200:
                data = r.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if text:
                    return text, model
        except Exception:
            pass

    # 2. OpenAI
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            r = requests.post(url, headers=headers, json={
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": f"Items:\n{context}\n\nQuestion: {question}"}
                ],
                "temperature": 0.0,
                "max_tokens": 200
            }, timeout=6.0)
            if r.status_code == 200:
                data = r.json()
                text = data["choices"][0]["message"]["content"].strip()
                if text:
                    return text, model
        except Exception:
            pass

    # 3. Groq
    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            r = requests.post(url, headers=headers, json={
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": f"Items:\n{context}\n\nQuestion: {question}"}
                ],
                "temperature": 0.0,
                "max_tokens": 200
            }, timeout=6.0)
            if r.status_code == 200:
                data = r.json()
                text = data["choices"][0]["message"]["content"].strip()
                if text:
                    return text, model
        except Exception:
            pass

    # 4. Anthropic
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        model = os.environ.get("LLM_MODEL", "claude-haiku-4-5-20251001")
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key, timeout=5.0, max_retries=0)
            msg = client.messages.create(
                model=model,
                max_tokens=200,
                temperature=0,
                system=SYSTEM,
                messages=[{"role": "user",
                           "content": f"Items:\n{context}\n\nQuestion: {question}"}],
            )
            out = "".join(b.text for b in msg.content if getattr(b, "text", None)).strip()
            if out:
                return out, model
        except Exception:
            pass

    # 5. Local knowledge engine fallback
    return _fallback(items, question), "autonomous-knowledge-engine"


def complete(question: str, items: List[dict]) -> str:
    """Answer from the items. Never raises."""
    text, _ = complete_with_metadata(question, items)
    return text

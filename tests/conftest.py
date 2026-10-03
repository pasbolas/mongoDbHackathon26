import os
import sys

os.environ["USE_MOCK"] = "1"
for k in ["ANTHROPIC_API_KEY", "HOPLITE_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY", "SLACK_WEBHOOK_URL"]:
    os.environ.pop(k, None)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def clean_db():
    import app.db
    from app.db import reset_db
    if app.db._client is not None and type(app.db._client).__name__ != "MongoClient" or os.environ.get("USE_MOCK") == "1":
        import mongomock
        if not isinstance(app.db._client, mongomock.MongoClient):
            app.db._client = mongomock.MongoClient()
    reset_db()
    yield
    reset_db()


@pytest.fixture
def seeded():
    import seed
    return seed.seed(reset=True)

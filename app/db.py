import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

_client = None  # one client per process, made on first use


def _make_client():
    if os.environ.get("USE_MOCK") == "1":
        import mongomock
        return mongomock.MongoClient()
    from pymongo import MongoClient
    uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    return MongoClient(uri, serverSelectionTimeoutMS=5000)


def get_items():
    """Return the items collection."""
    global _client
    if _client is None:
        _client = _make_client()
    return _client[os.environ.get("MONGODB_DB", "blast")]["items"]


def get_kb():
    """Return the dedicated knowledge_base collection."""
    global _client
    if _client is None:
        _client = _make_client()
    return _client[os.environ.get("MONGODB_DB", "blast")]["knowledge_base"]


def get_logs():
    """Return the dedicated logs collection."""
    global _client
    if _client is None:
        _client = _make_client()
    return _client[os.environ.get("MONGODB_DB", "blast")]["logs"]


def reset_db() -> None:
    """Drop all docs in items, knowledge_base, and logs (seed and tests)."""
    get_items().delete_many({})
    get_kb().delete_many({})
    get_logs().delete_many({})

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Key, Server } from 'lucide-react';

export default function DatabaseView({ dbStatus, onRefreshDbStatus }) {
  const [activeCollection, setActiveCollection] = useState('situations_vector');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customUri, setCustomUri] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState(null);

  const collections = [
    { id: 'situations_vector', label: 'situations_vector', role: 'Vector Search Index' },
    { id: 'events', label: 'events', role: 'Time-Series Behavioral Stream' },
    { id: 'routines', label: 'routines', role: 'Personal Baseline & Cue Levels' },
    { id: 'longitudinal_metrics', label: 'longitudinal_metrics', role: 'Weekly Progress History' },
    { id: 'prompt_history', label: 'prompt_history', role: 'Logged Interventions' }
  ];

  useEffect(() => {
    fetchDocuments(activeCollection);
  }, [activeCollection]);

  const fetchDocuments = async (colName) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/collection/${colName}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!customUri) return;
    setConnecting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: customUri })
      });
      const data = await res.json();
      if (data.result?.success) {
        setMessage({ type: 'success', text: 'Connected to MongoDB Atlas!' });
        if (onRefreshDbStatus) onRefreshDbStatus();
        fetchDocuments(activeCollection);
      } else {
        setMessage({ type: 'error', text: `Connection failed: ${data.result?.error}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Intro & Connection */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            MongoDB Atlas Data & Vector Search
          </h2>
          <p className="text-base text-neutral-400 mt-1">
            Status: <span className="text-white font-medium">{dbStatus?.mode || 'Local Store'}</span>
          </p>
        </div>

        {/* Connection Form */}
        <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="password"
            placeholder="Optional: mongodb+srv://<username>:<password>@cluster.mongodb.net/..."
            value={customUri}
            onChange={e => setCustomUri(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-neutral-500"
          />
          <button
            type="submit"
            disabled={connecting || !customUri}
            className="px-5 py-2.5 rounded-lg bg-white text-neutral-900 hover:bg-neutral-200 text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {connecting ? 'Connecting...' : 'Connect Atlas'}
          </button>
        </form>

        {message && (
          <div className={`text-sm p-3 rounded-lg ${
            message.type === 'success' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Collection Viewer */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-4">
        
        {/* Collection Selector Tabs */}
        <div className="flex space-x-2 border-b border-neutral-800 pb-4 overflow-x-auto">
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeCollection === col.id
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              <span className="font-mono">{col.id}</span>
              <span className="text-xs text-neutral-500">({col.role})</span>
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between text-sm text-neutral-400">
          <span>{documents.length} documents in <strong className="text-white font-mono">{activeCollection}</strong></span>
          <button
            onClick={() => fetchDocuments(activeCollection)}
            className="flex items-center gap-1.5 text-neutral-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* JSON Viewer */}
        <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-850 overflow-x-auto max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              Loading collection data...
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              No documents found.
            </div>
          ) : (
            <pre className="text-xs text-neutral-300 font-mono leading-relaxed">
              {JSON.stringify(documents, null, 2)}
            </pre>
          )}
        </div>

      </div>

    </div>
  );
}

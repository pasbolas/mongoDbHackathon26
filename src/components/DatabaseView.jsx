import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function DatabaseView({ dbStatus, onRefreshDbStatus }) {
  const [activeCollection, setActiveCollection] = useState('situations_vector');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customUri, setCustomUri] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState(null);

  const collections = [
    { id: 'situations_vector', label: 'situations_vector', role: 'Vector Search Index' },
    { id: 'events', label: 'events', role: 'Time-Series Stream' },
    { id: 'routines', label: 'routines', role: 'Routine Baseline' },
    { id: 'longitudinal_metrics', label: 'longitudinal_metrics', role: 'Weekly Progress' },
    { id: 'prompt_history', label: 'prompt_history', role: 'Logged Cues' }
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
        setMessage({ type: 'success', text: 'Connected to MongoDB Atlas cluster!' });
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
    <div className="space-y-8 max-w-3xl font-mono">

      {/* Intro Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
          MongoDB Atlas Storage
        </h2>
        <p className="text-base text-[#6e6e73] mt-1.5 leading-relaxed">
          Active storage engine: <span className="text-[#1d1d1f] font-semibold">{dbStatus?.mode || 'Local Hybrid Engine'}</span>.
        </p>
      </div>

      {/* Connection Form Card */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-[#1d1d1f]">
            Connect to MongoDB Atlas
          </h3>
          <p className="text-xs text-[#6e6e73] mt-0.5">
            Optional: Enter your cluster connection string to sync live documents and vector embeddings.
          </p>
        </div>

        <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="password"
            placeholder="mongodb+srv://<user>:<password>@cluster.mongodb.net/..."
            value={customUri}
            onChange={e => setCustomUri(e.target.value)}
            className="flex-1 bg-[#fbfbfd] border border-[#d1d1d6] rounded-xl px-4 py-2.5 text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#1d1d1f]"
          />
          <button
            type="submit"
            disabled={connecting || !customUri}
            className="px-5 py-2.5 rounded-xl bg-[#1d1d1f] text-white hover:bg-[#333336] text-xs font-semibold transition-all disabled:opacity-40 shadow-sm"
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </form>

        {message && (
          <div className={`text-xs p-3 rounded-xl ${
            message.type === 'success' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Collection Viewer Card */}
      <div className="rounded-3xl border border-[#e5e5ea] bg-white p-7 sm:p-8 space-y-5 shadow-sm">
        
        {/* Collection Selector Pills */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-[#e5e5ea]">
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCollection === col.id
                  ? 'bg-[#1d1d1f] text-white font-semibold shadow-sm'
                  : 'bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#e5e5ea]'
              }`}
            >
              <span>{col.label}</span>
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between text-xs text-[#6e6e73]">
          <span>{documents.length} documents in <strong className="text-[#1d1d1f]">{activeCollection}</strong></span>
          <button
            onClick={() => fetchDocuments(activeCollection)}
            className="flex items-center gap-1.5 text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* JSON Viewer */}
        <div className="bg-[#f5f5f7] rounded-2xl p-5 border border-[#e5e5ea] overflow-x-auto max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-[#86868b] text-xs">
              Loading collection data...
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-[#86868b] text-xs">
              No documents found.
            </div>
          ) : (
            <pre className="text-xs text-[#1d1d1f] leading-relaxed">
              {JSON.stringify(documents, null, 2)}
            </pre>
          )}
        </div>

      </div>

    </div>
  );
}

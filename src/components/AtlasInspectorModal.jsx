import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Search, 
  RefreshCw, 
  Check, 
  Layers, 
  Code, 
  Server, 
  Key, 
  ExternalLink 
} from 'lucide-react';

export default function AtlasInspectorModal({ 
  isOpen, 
  onClose, 
  dbStatus, 
  onConnectUri 
}) {
  const [activeTab, setActiveTab] = useState('situations_vector');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customUri, setCustomUri] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState(null);

  const collections = [
    { id: 'situations_vector', label: 'situations_vector (Vector Search)', badge: 'Atlas Vector Search' },
    { id: 'events', label: 'events (Behavior Stream)', badge: 'Time-Series' },
    { id: 'routines', label: 'routines (Personal Baseline)', badge: 'Document' },
    { id: 'longitudinal_metrics', label: 'longitudinal_metrics', badge: 'Metrics' },
    { id: 'prompt_history', label: 'prompt_history', badge: 'History' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCollectionDocs(activeTab);
    }
  }, [isOpen, activeTab]);

  const fetchCollectionDocs = async (colName) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/db/collection/${colName}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch collection docs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAtlas = async (e) => {
    e.preventDefault();
    if (!customUri) return;
    setConnecting(true);
    setConnectMessage(null);
    try {
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: customUri })
      });
      const data = await res.json();
      if (data.result?.success) {
        setConnectMessage({ type: 'success', text: 'Successfully connected to MongoDB Atlas cluster!' });
        fetchCollectionDocs(activeTab);
      } else {
        setConnectMessage({ type: 'error', text: `Failed to connect: ${data.result?.error || 'Invalid URI'}` });
      }
    } catch (err) {
      setConnectMessage({ type: 'error', text: err.message });
    } finally {
      setConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  MongoDB Atlas Live Inspector
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  dbStatus?.isAtlas 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                }`}>
                  {dbStatus?.mode || 'Local Hybrid Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect real-time collections, vector embeddings, and time-series documents
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Atlas Connection String Bar */}
        <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <form onSubmit={handleConnectAtlas} className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Connect to your MongoDB Atlas URI: mongodb+srv://<username>:<password>@cluster..."
                value={customUri}
                onChange={e => setCustomUri(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={connecting || !customUri}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <Server className="w-3.5 h-3.5" />
              <span>{connecting ? 'Connecting...' : 'Connect to Atlas'}</span>
            </button>
          </form>

          {connectMessage && (
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded ${
              connectMessage.type === 'success' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
            }`}>
              {connectMessage.text}
            </span>
          )}
        </div>

        {/* Atlas Vector Search Info Banner */}
        {activeTab === 'situations_vector' && (
          <div className="bg-emerald-950/30 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <strong>MongoDB Atlas $vectorSearch Stage:</strong> Queries historical cognitive situations via cosine similarity on dense vectors.
              </span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">
              index: situation_vector_index
            </span>
          </div>
        )}

        {/* Content Body: Tabs & Document Viewer */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Collection Tab Selector */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/40 p-3 space-y-1.5 flex-shrink-0 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
              Collections ({collections.length})
            </div>
            {collections.map(col => (
              <button
                key={col.id}
                onClick={() => setActiveTab(col.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex flex-col justify-between ${
                  activeTab === col.id
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span className="font-mono truncate">{col.id}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{col.badge}</span>
              </button>
            ))}
          </div>

          {/* Documents JSON Viewer */}
          <div className="flex-1 bg-slate-950 p-4 overflow-y-auto font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <span className="text-slate-400 text-xs">
                Collection: <strong className="text-emerald-400">{activeTab}</strong> ({documents.length} docs)
              </span>
              <button
                onClick={() => fetchCollectionDocs(activeTab)}
                className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 text-xs py-1 px-2 rounded hover:bg-slate-900 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-slate-500 text-center py-12">
                No documents found in this collection.
              </div>
            ) : (
              <pre className="text-[11px] leading-relaxed text-emerald-300/90 whitespace-pre-wrap selection:bg-slate-800">
                {JSON.stringify(documents, null, 2)}
              </pre>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

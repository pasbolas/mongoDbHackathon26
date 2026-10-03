import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '.data');

// Ensure local persistence directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create local data directory:', err.message);
  }
}

// In-Memory / Local JSON persistent MongoDB implementation
class LocalCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.documents = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`Could not load local collection ${this.name}, initializing empty:`, e.message);
    }
    return [];
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.documents, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error saving local collection ${this.name}:`, e.message);
    }
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async find(query = {}) {
    return this.documents.filter(doc => {
      for (const [key, value] of Object.entries(query)) {
        if (key.includes('.')) {
          const parts = key.split('.');
          let curr = doc;
          for (const p of parts) {
            curr = curr ? curr[p] : undefined;
          }
          if (curr !== value) return false;
        } else if (doc[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  async insertOne(doc) {
    const newDoc = {
      _id: doc._id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date(),
      ...doc
    };
    this.documents.push(newDoc);
    this._save();
    return { insertedId: newDoc._id, acknowledged: true };
  }

  async insertMany(docs) {
    const insertedIds = {};
    const created = docs.map((doc, idx) => {
      const id = doc._id || `id_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`;
      insertedIds[idx] = id;
      return {
        _id: id,
        createdAt: new Date(),
        ...doc
      };
    });
    this.documents.push(...created);
    this._save();
    return { insertedIds, acknowledged: true };
  }

  async updateOne(filter, update) {
    const index = this.documents.findIndex(doc => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] !== value) return false;
      }
      return true;
    });

    if (index === -1) return { matchedCount: 0, modifiedCount: 0 };

    let doc = this.documents[index];
    if (update.$set) {
      for (const [key, value] of Object.entries(update.$set)) {
        if (key.includes('.')) {
          const parts = key.split('.');
          let obj = doc;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) obj[parts[i]] = {};
            obj = obj[parts[i]];
          }
          obj[parts[parts.length - 1]] = value;
        } else {
          doc[key] = value;
        }
      }
    }
    if (update.$inc) {
      for (const [key, value] of Object.entries(update.$inc)) {
        if (key.includes('.')) {
          const parts = key.split('.');
          let obj = doc;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) obj[parts[i]] = {};
            obj = obj[parts[i]];
          }
          obj[parts[parts.length - 1]] = (obj[parts[parts.length - 1]] || 0) + value;
        } else {
          doc[key] = (doc[key] || 0) + value;
        }
      }
    }
    doc.updatedAt = new Date();
    this.documents[index] = doc;
    this._save();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }

  async deleteMany(filter = {}) {
    if (Object.keys(filter).length === 0) {
      const count = this.documents.length;
      this.documents = [];
      this._save();
      return { deletedCount: count };
    }
    const prev = this.documents.length;
    this.documents = this.documents.filter(doc => {
      for (const [key, value] of Object.entries(filter)) {
        if (doc[key] === value) return false;
      }
      return true;
    });
    this._save();
    return { deletedCount: prev - this.documents.length };
  }

  // Simulated Atlas Vector Search using cosine similarity
  async vectorSearch({ queryVector, path: vectorPath, limit = 5, minScore = 0.5 }) {
    const scoredDocs = this.documents.map(doc => {
      const docVec = doc[vectorPath] || doc.embedding;
      if (!Array.isArray(docVec) || docVec.length === 0) {
        return { ...doc, score: 0 };
      }
      const score = cosineSimilarity(queryVector, docVec);
      return { ...doc, score };
    });

    return scoredDocs
      .filter(d => d.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// Compute cosine similarity between two vectors
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
    this.isAtlas = false;
    this.atlasUri = process.env.MONGODB_URI || '';
    this.statusMessage = 'Initialized Local Embedded Store';
    this.localCollections = {
      episodes: new LocalCollection('episodes'),
      task_profiles: new LocalCollection('task_profiles'),
      live_events: new LocalCollection('live_events'),
      sensor_history: new LocalCollection('sensor_history'),
      session_metrics: new LocalCollection('session_metrics'),
    };
  }

  async connect(uri = this.atlasUri) {
    if (!uri || !uri.trim()) {
      console.log('ℹ️ No MongoDB Atlas URI provided. Operating in Local Hybrid Store mode.');
      this.isAtlas = false;
      this.statusMessage = 'Running with Local High-Fidelity MongoDB Store';
      return { success: true, mode: 'local' };
    }

    try {
      console.log('🔄 Connecting to MongoDB Atlas...');
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });

      await client.connect();
      await client.db('admin').command({ ping: 1 });

      this.client = client;
      this.db = client.db('anchor_guardian');
      this.atlasUri = uri;
      this.isAtlas = true;
      this.statusMessage = 'Connected to MongoDB Atlas';
      console.log('✅ Connected successfully to MongoDB Atlas cluster (anchor_guardian)!');
      return { success: true, mode: 'atlas' };
    } catch (err) {
      console.warn('⚠️ Could not connect to MongoDB Atlas:', err.message);
      this.isAtlas = false;
      this.statusMessage = `Atlas Connection Failed (${err.message}). Using Local Hybrid Store.`;
      return { success: false, mode: 'local', error: err.message };
    }
  }

  getCollection(name) {
    if (this.isAtlas && this.db) {
      return this.db.collection(name);
    }
    if (!this.localCollections[name]) {
      this.localCollections[name] = new LocalCollection(name);
    }
    return this.localCollections[name];
  }

  async getStatus() {
    const counts = {};
    const collectionNames = ['episodes', 'task_profiles', 'live_events', 'sensor_history', 'session_metrics'];

    for (const name of collectionNames) {
      try {
        const col = this.getCollection(name);
        counts[name] = await col.countDocuments();
      } catch {
        counts[name] = 0;
      }
    }

    return {
      connected: true,
      isAtlas: this.isAtlas,
      mode: this.isAtlas ? 'MongoDB Atlas' : 'Local Hybrid Store',
      statusMessage: this.statusMessage,
      atlasUriConfigured: Boolean(this.atlasUri),
      databaseName: 'anchor_guardian',
      counts,
    };
  }
}

export const dbManager = new DatabaseManager();

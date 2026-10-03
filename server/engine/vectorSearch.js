import { dbManager, cosineSimilarity } from '../db.js';

/**
 * Generates a normalized semantic feature vector for Sarah's activity episode context
 * @param {Object} context
 * @returns {Array<number>} 32-element normalized embedding
 */
export function generateEpisodeEmbedding(context) {
  const {
    task = 'pack_bag',
    completed = [],
    remaining = [],
    idleSeconds = 0,
    reopenedBag = false,
    currentStep = ''
  } = context;

  const vector = new Array(32).fill(0.04);

  // Dimension 0-2: Task representation
  if (task === 'pack_bag') vector[0] = 0.95;

  // Dimension 3-7: Packed items indicators
  if (completed.includes('wallet')) vector[3] = 0.9;
  if (completed.includes('keys')) vector[4] = 0.9;
  if (completed.includes('phone')) vector[5] = 0.9;
  if (completed.includes('notebook')) vector[6] = 0.9;
  if (completed.includes('water_bottle')) vector[7] = 0.9;

  // Dimension 8-12: Remaining items
  if (remaining.includes('notebook') || currentStep === 'notebook') vector[8] = 0.92;
  if (remaining.includes('water_bottle') || currentStep === 'water_bottle') vector[9] = 0.88;

  // Dimension 13-17: Inactivity / idle duration magnitude
  if (idleSeconds > 0) {
    const idleNorm = Math.min(1.0, idleSeconds / 45);
    vector[13] = idleNorm;
    if (idleSeconds >= 25) vector[14] = 0.85;
    if (idleSeconds >= 40) vector[15] = 0.95;
  }

  // Dimension 18-20: Behavioral anomaly pattern
  if (reopenedBag) vector[18] = 0.94; // Bag closed then reopened
  if (completed.length === 3 && remaining.includes('notebook')) {
    vector[19] = 0.96; // Signature pause point after phone/wallet/keys
  }

  // Normalize vector to unit length
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(v => (norm > 0 ? Number((v / norm).toFixed(5)) : 0));
}

/**
 * Searches MongoDB Atlas Vector Search or local vector index for matching past episodes
 * @param {Object} queryContext
 * @param {number} limit
 * @returns {Promise<Array>} Ranked matching historical episodes with similarity scores
 */
export async function searchSimilarEpisodes(queryContext, limit = 3) {
  const queryVector = generateEpisodeEmbedding(queryContext);
  const collection = dbManager.getCollection('episodes');

  // If connected to MongoDB Atlas with active db
  if (dbManager.isAtlas && dbManager.db) {
    try {
      const pipeline = [
        {
          $vectorSearch: {
            index: 'episode_vector_index',
            path: 'embedding',
            queryVector: queryVector,
            numCandidates: 20,
            limit: limit
          }
        },
        {
          $project: {
            _id: 1,
            episodeId: 1,
            title: 1,
            episodeSummary: 1,
            task: 1,
            context: 1,
            intervention: 1,
            promptLevel: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const cursor = collection.aggregate(pipeline);
      const results = await cursor.toArray();
      if (results && results.length > 0) {
        return results;
      }
    } catch (atlasErr) {
      console.warn('Atlas $vectorSearch fallback to manual cosine scan:', atlasErr.message);
      const docs = await collection.find({}).toArray();
      return rankByCosine(docs, queryVector, limit);
    }
  }

  // Local collection mode (with cosine similarity search)
  if (typeof collection.vectorSearch === 'function') {
    const localResults = await collection.vectorSearch({
      queryVector,
      path: 'embedding',
      limit,
      minScore: 0.4
    });
    return localResults;
  }

  const allDocs = await collection.find({});
  return rankByCosine(allDocs, queryVector, limit);
}

function rankByCosine(docs, queryVector, limit) {
  const scored = docs.map(doc => {
    const docVec = doc.embedding || doc.vector || [];
    const score = cosineSimilarity(queryVector, docVec);
    return {
      ...doc,
      score: Number(score.toFixed(4))
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

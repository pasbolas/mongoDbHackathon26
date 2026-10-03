import { dbManager, cosineSimilarity } from '../db.js';

// Feature dictionary to generate deterministic, normalized embeddings
// representing cognitive states and contextual situations
const VOCABULARY = [
  // Actions
  'fill_kettle', 'boil_water', 'kettle_boiling', 'open_cupboard', 'close_cupboard',
  'get_mug', 'look_in_cupboard', 'open_drawer', 'open_fridge', 'get_teabag',
  'pour_water', 'add_milk', 'standing_still', 'idle_short', 'idle_long',
  'wandering', 'check_counter', 'touch_kettle', 'repeat_action', 'searching',
  // Locations & Objects
  'kitchen', 'sink', 'kettle', 'cupboard', 'fridge', 'drawer', 'counter',
  'mug_blue', 'teabag_box', 'milk_carton', 'teaspoon',
  // Cognitive states
  'focused', 'hesitant', 'looping', 'stuck', 'confused_location', 'forgot_step',
  'sequence_inversion', 'object_misplacement'
];

/**
 * Generates a normalized semantic feature vector for a situation context
 * @param {Object} context
 * @returns {Array<number>} 32-element normalized embedding
 */
export function generateSituationEmbedding(context) {
  const {
    task = 'make_tea',
    currentStep = '',
    recentActions = [],
    idleSeconds = 0,
    repeatedAction = false,
    location = 'kitchen',
    problemHint = ''
  } = context;

  const vector = new Array(32).fill(0.05);

  // Dimension 0-3: Task context
  if (task === 'make_tea') vector[0] = 0.9;
  if (location === 'kitchen') vector[1] = 0.85;

  // Dimension 4-9: Target step
  const stepIndexMap = {
    fill_kettle: 4,
    boil_water: 5,
    get_mug: 6,
    get_teabag: 7,
    pour_water: 8,
    add_milk: 9
  };
  if (currentStep && stepIndexMap[currentStep] !== undefined) {
    vector[stepIndexMap[currentStep]] = 0.95;
  }

  // Dimension 10-15: Recent action pattern & repetition
  const actionCounts = {};
  for (const act of recentActions) {
    actionCounts[act] = (actionCounts[act] || 0) + 1;
  }

  if (actionCounts['open_cupboard']) vector[10] = Math.min(1.0, actionCounts['open_cupboard'] * 0.4);
  if (actionCounts['close_cupboard']) vector[11] = Math.min(1.0, actionCounts['close_cupboard'] * 0.4);
  if (actionCounts['open_fridge']) vector[12] = Math.min(1.0, actionCounts['open_fridge'] * 0.5);
  if (actionCounts['open_drawer']) vector[13] = Math.min(1.0, actionCounts['open_drawer'] * 0.5);
  if (repeatedAction || (actionCounts['open_cupboard'] && actionCounts['open_cupboard'] >= 2)) {
    vector[14] = 0.92; // loop detection flag
  }

  // Dimension 16-20: Idle duration magnitude
  if (idleSeconds > 0) {
    const idleNorm = Math.min(1.0, idleSeconds / 30);
    vector[16] = idleNorm;
    if (idleSeconds > 15) vector[17] = 0.88;
    if (idleSeconds > 30) vector[18] = 0.95;
  }

  // Dimension 21-25: Semantic Problem Type
  if (problemHint === 'cant_find_mug' || currentStep === 'get_mug') {
    vector[21] = 0.92;
    vector[22] = 0.84;
  } else if (problemHint === 'forgot_teabag' || currentStep === 'get_teabag') {
    vector[23] = 0.91;
  } else if (problemHint === 'boil_hesitation' || currentStep === 'boil_water') {
    vector[24] = 0.87;
  }

  // Dimension 26-31: Anomaly indicators
  if (recentActions.length >= 3 && recentActions[recentActions.length - 1] === recentActions[recentActions.length - 3]) {
    vector[26] = 0.94; // ping-pong oscillation
  }

  // Normalize to unit length
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(v => (norm > 0 ? Number((v / norm).toFixed(5)) : 0));
}

/**
 * Searches MongoDB Atlas Vector Search or local vector index for matching past situations
 * @param {Object} queryContext
 * @param {number} limit
 * @returns {Promise<Array>} Ranked matching historical situations with similarity scores
 */
export async function searchSimilarSituations(queryContext, limit = 3) {
  const queryVector = generateSituationEmbedding(queryContext);
  const collection = dbManager.getCollection('situations_vector');

  // If connected to Atlas with active db and vector index
  if (dbManager.isAtlas && dbManager.db) {
    try {
      const pipeline = [
        {
          $vectorSearch: {
            index: 'situation_vector_index',
            path: 'vector',
            queryVector: queryVector,
            numCandidates: 20,
            limit: limit
          }
        },
        {
          $project: {
            _id: 1,
            situationId: 1,
            title: 1,
            description: 1,
            problemType: 1,
            successfulPromptLevel: 1,
            promptText: 1,
            resolutionAction: 1,
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
      console.warn('Atlas $vectorSearch pipeline fallback to collection scan:', atlasErr.message);
      // Fallback to manual cosine similarity over Atlas documents
      const docs = await collection.find({}).toArray();
      return rankByCosine(docs, queryVector, limit);
    }
  }

  // Local collection mode (with cosine similarity)
  if (typeof collection.vectorSearch === 'function') {
    const localResults = await collection.vectorSearch({
      queryVector,
      path: 'vector',
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
    const docVec = doc.vector || [];
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

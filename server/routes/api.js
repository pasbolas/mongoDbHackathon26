import express from 'express';
import { anchorEngine, STEPS_DEFINITION } from '../engine/anchor.js';
import { dbManager } from '../db.js';
import { seedDatabase } from '../seed.js';

const router = express.Router();

// SSE Real-time streaming
router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ event: 'CONNECTED', data: anchorEngine.getState() })}\n\n`);

  const unsubscribe = anchorEngine.subscribe(payload => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Current Anchor state
router.get('/state', (req, res) => {
  res.json(anchorEngine.getState());
});

// Submit a perceived physical action
router.post('/action', async (req, res) => {
  try {
    const { action, metadata = {} } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });
    const newState = await anchorEngine.handleAction(action, metadata);
    res.json(newState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate idle hesitation
router.post('/idle', async (req, res) => {
  try {
    const { seconds = 5 } = req.body;
    const newState = await anchorEngine.handleIdle(seconds);
    res.json(newState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset session
router.post('/reset', (req, res) => {
  anchorEngine.resetSession();
  res.json({ message: 'Session reset', state: anchorEngine.getState() });
});

// Observable measurements & task profiles dashboard (Section 20)
router.get('/dashboard', async (req, res) => {
  try {
    const sessionCol = dbManager.getCollection('session_metrics');
    const profilesCol = dbManager.getCollection('task_profiles');
    const episodesCol = dbManager.getCollection('episodes');

    const sessions = await sessionCol.find({});
    const profiles = await profilesCol.find({ task: 'pack_bag' });
    const totalEpisodes = await episodesCol.countDocuments({});

    res.json({
      user: 'sarah',
      task: 'pack_bag',
      observableSessions: sessions.sort((a, b) => a.sessionIndex - b.sessionIndex),
      taskProfiles: profiles,
      totalEpisodes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database connection & collections inspection
router.get('/db/status', async (req, res) => {
  try {
    const status = await dbManager.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inspect collection documents
router.get('/db/collection/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const allowed = ['episodes', 'task_profiles', 'live_events', 'sensor_history', 'session_metrics'];
    if (!allowed.includes(name)) {
      return res.status(400).json({ error: 'Invalid collection name' });
    }
    const col = dbManager.getCollection(name);
    let docs = [];
    if (dbManager.isAtlas && dbManager.db) {
      docs = await col.find({}).sort({ _id: -1 }).limit(50).toArray();
    } else {
      docs = (await col.find({})).slice(-50).reverse();
    }
    res.json({ collection: name, count: docs.length, documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Connect to MongoDB Atlas
router.post('/db/connect', async (req, res) => {
  try {
    const { uri } = req.body;
    const result = await dbManager.connect(uri);
    if (result.success && result.mode === 'atlas') {
      await seedDatabase(false);
    }
    const status = await dbManager.getStatus();
    res.json({ result, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Re-seed database
router.post('/db/seed', async (req, res) => {
  try {
    await seedDatabase(true);
    anchorEngine.resetSession();
    res.json({ success: true, message: 'Database re-seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Automated scenario runners (Section 19: Demo Scenario)
router.post('/scenarios/run', async (req, res) => {
  const { scenarioId } = req.body;
  anchorEngine.resetSession();

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Run scenario steps in background
  (async () => {
    if (scenarioId === 'execution_1') {
      // First execution: Sarah packs wallet, keys, phone, stops.
      // System waits -> Task uncertainty -> Subtle cue: "Anything else you normally take with you?"
      await sleep(500);
      await anchorEngine.handleAction('bag_open');
      await sleep(1000);
      await anchorEngine.handleAction('wallet_added');
      await sleep(1000);
      await anchorEngine.handleAction('keys_added');
      await sleep(1000);
      await anchorEngine.handleAction('phone_added');
      await sleep(1000);
      // Sarah pauses. System enters deliberate WAIT.
      await anchorEngine.handleIdle(10); // Observing & waiting
      await sleep(1200);
      await anchorEngine.handleIdle(12); // Exceeds uncertainty threshold -> Level 1 cue delivered
      await sleep(3000);
      // Sarah remembers notebook after subtle cue
      await anchorEngine.handleAction('notebook_added');
      await sleep(1200);
      await anchorEngine.handleAction('water_added');
      await sleep(1000);
      await anchorEngine.handleAction('bag_close');
    } else if (scenarioId === 'execution_2') {
      // Second execution: Sarah pauses at same point.
      // Vector search retrieves previous episode. Even shorter prompt: "Anything else?"
      await sleep(500);
      await anchorEngine.handleAction('bag_open');
      await sleep(1000);
      await anchorEngine.handleAction('wallet_added');
      await sleep(1000);
      await anchorEngine.handleAction('keys_added');
      await sleep(1000);
      await anchorEngine.handleAction('phone_added');
      await sleep(1000);
      await anchorEngine.handleIdle(22); // Triggers prompt
      if (anchorEngine.activePrompt) {
        anchorEngine.activePrompt.text = 'Anything else?';
        anchorEngine.notify('INTERVENTION_TRIGGERED', { prompt: anchorEngine.activePrompt, state: anchorEngine.getState() });
      }
      await sleep(3000);
      await anchorEngine.handleAction('notebook_added');
      await sleep(1200);
      await anchorEngine.handleAction('water_added');
      await sleep(1000);
      await anchorEngine.handleAction('bag_close');
    } else if (scenarioId === 'execution_3') {
      // Third execution: Sarah pauses briefly.
      // System waits. Sarah remembers notebook herself. Anchor says NOTHING!
      await sleep(500);
      await anchorEngine.handleAction('bag_open');
      await sleep(1000);
      await anchorEngine.handleAction('wallet_added');
      await sleep(1000);
      await anchorEngine.handleAction('keys_added');
      await sleep(1000);
      await anchorEngine.handleAction('phone_added');
      await sleep(1000);
      // Sarah pauses briefly for 8 seconds. Anchor deliberately stays quiet!
      await anchorEngine.handleIdle(8);
      await sleep(1500);
      // Sarah remembers on her own! No prompt ever given.
      await anchorEngine.handleAction('notebook_added');
      await sleep(1200);
      await anchorEngine.handleAction('water_added');
      await sleep(1000);
      await anchorEngine.handleAction('bag_close');
    }
  })();

  res.json({ message: `Execution '${scenarioId}' initiated.` });
});

export default router;

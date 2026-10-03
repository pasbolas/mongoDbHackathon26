import express from 'express';
import { guardianEngine, STEPS_DEFINITION } from '../engine/guardian.js';
import { VanishingCuesEngine } from '../engine/vanishingCues.js';
import { dbManager } from '../db.js';
import { seedDatabase } from '../seed.js';

const router = express.Router();

// SSE Real-time streaming
router.get('/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial state
  res.write(`data: ${JSON.stringify({ event: 'CONNECTED', data: guardianEngine.getState() })}\n\n`);

  const unsubscribe = guardianEngine.subscribe(payload => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Current guardian & simulation state
router.get('/state', (req, res) => {
  res.json(guardianEngine.getState());
});

// Submit a perceived physical action
router.post('/action', async (req, res) => {
  try {
    const { action, metadata = {} } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });
    const newState = await guardianEngine.handleAction(action, metadata);
    res.json(newState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Simulate idle hesitation
router.post('/idle', async (req, res) => {
  try {
    const { seconds = 5 } = req.body;
    const newState = await guardianEngine.handleIdle(seconds);
    res.json(newState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset current session
router.post('/reset', (req, res) => {
  guardianEngine.resetSession();
  res.json({ message: 'Session reset', state: guardianEngine.getState() });
});

// Longitudinal dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const summary = await VanishingCuesEngine.getLongitudinalSummary('John', 'make_tea');
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routines baseline
router.get('/routines', async (req, res) => {
  try {
    const routinesCol = dbManager.getCollection('routines');
    const routine = await routinesCol.findOne({ user: 'John', task: 'make_tea' });
    res.json(routine || {});
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

// Inspect documents in a specific collection
router.get('/db/collection/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const allowed = ['routines', 'events', 'situations_vector', 'prompt_history', 'longitudinal_metrics'];
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

// Test and switch to a MongoDB Atlas URI
router.post('/db/connect', async (req, res) => {
  try {
    const { uri } = req.body;
    const result = await dbManager.connect(uri);
    if (result.success && result.mode === 'atlas') {
      await seedDatabase(false); // seed Atlas if needed
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
    guardianEngine.resetSession();
    const dashboard = await VanishingCuesEngine.getLongitudinalSummary('John', 'make_tea');
    res.json({ success: true, message: 'Database re-seeded successfully', dashboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Automated scenario runner
router.post('/scenarios/run', async (req, res) => {
  const { scenarioId } = req.body;
  guardianEngine.resetSession();

  // Run in background and respond immediately with plan
  const scriptPromise = (async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    if (scenarioId === 'independent') {
      // Flawless independent execution - Silence is a Feature!
      await sleep(600);
      await guardianEngine.handleAction('kettle_fill');
      await sleep(1000);
      await guardianEngine.handleAction('kettle_boil');
      await sleep(1000);
      await guardianEngine.handleAction('take_mug');
      await sleep(1000);
      await guardianEngine.handleAction('take_teabag');
      await sleep(1000);
      await guardianEngine.handleAction('pour_water');
      await sleep(1000);
      await guardianEngine.handleAction('add_milk');
    } else if (scenarioId === 'confusion_mug') {
      // Loop confusion: Cupboard opened repeatedly -> Vector Search -> Level 1 prompt -> Success
      await sleep(600);
      await guardianEngine.handleAction('kettle_fill');
      await sleep(1000);
      await guardianEngine.handleAction('kettle_boil');
      await sleep(1000);
      await guardianEngine.handleAction('cupboard_open');
      await sleep(1000);
      await guardianEngine.handleAction('cupboard_close');
      await sleep(1000);
      await guardianEngine.handleAction('cupboard_open'); // Trigger loop detection
      await sleep(2500); // Allow prompt to be seen
      await guardianEngine.handleAction('take_mug'); // Responded to prompt!
      await sleep(1000);
      await guardianEngine.handleAction('take_teabag');
      await sleep(1000);
      await guardianEngine.handleAction('pour_water');
      await sleep(1000);
      await guardianEngine.handleAction('add_milk');
    } else if (scenarioId === 'escalation') {
      // Severe hesitation: Water boils, John stands idle -> Level 1 prompt -> still stuck -> Level 2 escalation
      await sleep(600);
      await guardianEngine.handleAction('kettle_fill');
      await sleep(1000);
      await guardianEngine.handleAction('kettle_boil');
      await sleep(1000);
      await guardianEngine.handleIdle(16); // Exceeds threshold -> Level 1 prompt
      await sleep(2500);
      await guardianEngine.handleIdle(12); // Exceeds grace -> Escalates to Level 2
      await sleep(3000);
      await guardianEngine.handleAction('take_mug'); // User follows Level 2 prompt
      await sleep(1000);
      await guardianEngine.handleAction('take_teabag');
      await sleep(1000);
      await guardianEngine.handleAction('pour_water');
      await sleep(1000);
      await guardianEngine.handleAction('add_milk');
    }
  })();

  res.json({ message: `Scenario '${scenarioId}' initiated. Follow live via stream or state.` });
});

export default router;

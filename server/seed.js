import { dbManager } from './db.js';
import { generateEpisodeEmbedding } from './engine/vectorSearch.js';

export async function seedDatabase(force = false) {
  const episodesCol = dbManager.getCollection('episodes');
  const existingEpisode = await episodesCol.findOne({ userId: 'sarah', task: 'pack_bag' });

  if (existingEpisode && !force) {
    console.log('🌱 Database already contains seed data for Sarah (Anchor).');
    return;
  }

  console.log('🌱 Seeding MongoDB collections for Anchor (Privacy-First Adaptive Assistance)...');

  // 1. Episodes Collection (Historical episodic memory for Atlas Vector Search)
  await episodesCol.deleteMany({ userId: 'sarah' });

  const pastEpisodes = [
    {
      episodeId: 'ep_017',
      userId: 'sarah',
      task: 'pack_bag',
      title: 'Episode #17: Inactivity after phone/wallet/keys',
      context: {
        completed: ['wallet', 'keys', 'phone'],
        remaining: ['notebook', 'water_bottle'],
        idleSeconds: 42,
        currentStep: 'notebook'
      },
      intervention: {
        type: 'subtle_verbal',
        text: 'Anything else you normally take with you?',
        successful: true,
        level: 1
      },
      episodeSummary: 'Sarah paused after packing phone, wallet and keys. A subtle reminder successfully resumed the activity.',
      timestamp: new Date(Date.now() - 86400000 * 3)
    },
    {
      episodeId: 'ep_012',
      userId: 'sarah',
      task: 'pack_bag',
      title: 'Episode #12: Notebook forgotten on desk',
      context: {
        completed: ['wallet', 'keys', 'phone'],
        remaining: ['notebook'],
        idleSeconds: 50,
        currentStep: 'notebook'
      },
      intervention: {
        type: 'spatial_cue',
        text: 'Your notebook is on the desk.',
        successful: true,
        level: 2
      },
      episodeSummary: 'Sarah forgot notebook before university. Spatial cue on desk worked.',
      timestamp: new Date(Date.now() - 86400000 * 7)
    },
    {
      episodeId: 'ep_008',
      userId: 'sarah',
      task: 'pack_bag',
      title: 'Episode #08: Unpacking bag in evening',
      context: {
        completed: [],
        remaining: [],
        idleSeconds: 20,
        currentStep: ''
      },
      intervention: {
        type: 'none',
        text: '',
        successful: true,
        level: 0
      },
      episodeSummary: 'Sarah was unpacking bag. No intervention required.',
      timestamp: new Date(Date.now() - 86400000 * 14)
    }
  ];

  for (const ep of pastEpisodes) {
    ep.embedding = generateEpisodeEmbedding(ep.context);
  }

  await episodesCol.insertMany(pastEpisodes);

  // 2. Task Profiles Collection (Sarah's assistance profiles per step)
  const profilesCol = dbManager.getCollection('task_profiles');
  await profilesCol.deleteMany({ task: 'pack_bag' });

  await profilesCol.insertMany([
    {
      task: 'pack_bag',
      step: 'notebook',
      history: {
        attempts: 18,
        independent: 12
      },
      promptHistory: {
        subtleCue: { attempts: 4, successful: 3 },
        explicitCue: { attempts: 2, successful: 2 }
      },
      effectivePreferences: {
        subtleVerbal: 0.85,
        spatialCue: 0.65,
        explicitInstruction: 0.25
      }
    },
    {
      task: 'pack_bag',
      step: 'water_bottle',
      history: {
        attempts: 18,
        independent: 15
      },
      promptHistory: {
        subtleCue: { attempts: 2, successful: 2 },
        explicitCue: { attempts: 1, successful: 1 }
      },
      effectivePreferences: {
        subtleVerbal: 0.9,
        spatialCue: 0.4
      }
    },
    {
      task: 'pack_bag',
      step: 'wallet',
      history: {
        attempts: 18,
        independent: 18
      },
      promptHistory: {
        subtleCue: { attempts: 0, successful: 0 }
      }
    },
    {
      task: 'pack_bag',
      step: 'keys',
      history: {
        attempts: 18,
        independent: 17
      },
      promptHistory: {
        subtleCue: { attempts: 1, successful: 1 }
      }
    },
    {
      task: 'pack_bag',
      step: 'phone',
      history: {
        attempts: 18,
        independent: 16
      },
      promptHistory: {
        subtleCue: { attempts: 2, successful: 2 }
      }
    }
  ]);

  // 3. Session Metrics Collection (Observable Measurements from Section 20)
  const sessionCol = dbManager.getCollection('session_metrics');
  await sessionCol.deleteMany({});

  await sessionCol.insertMany([
    {
      sessionIndex: 1,
      label: 'Session 1',
      independentSteps: '3 / 5',
      independentCount: 3,
      totalSteps: 5,
      promptsRequired: 2,
      averagePromptLevel: 2.0,
      notes: 'Required subtle verbal cue for notebook and spatial cue for water bottle.'
    },
    {
      sessionIndex: 2,
      label: 'Session 2',
      independentSteps: '4 / 5',
      independentCount: 4,
      totalSteps: 5,
      promptsRequired: 1,
      averagePromptLevel: 1.0,
      notes: 'Water bottle packed independently. Subtle reminder ("Anything else?") used for notebook.'
    },
    {
      sessionIndex: 3,
      label: 'Session 3',
      independentSteps: '5 / 5',
      independentCount: 5,
      totalSteps: 5,
      promptsRequired: 0,
      averagePromptLevel: 0.0,
      notes: 'Sarah paused briefly. Anchor observed and waited. Sarah remembered notebook herself. Anchor did nothing.'
    }
  ]);

  // 4. Live Events Collection (Actionable live collection for Atlas Triggers)
  const liveEventsCol = dbManager.getCollection('live_events');
  await liveEventsCol.deleteMany({});
  await liveEventsCol.insertMany([
    {
      timestamp: new Date(Date.now() - 120000),
      user: 'sarah',
      task: 'pack_bag',
      event: 'bag_open',
      confidence: 0.96,
      privacy: 'frame_discarded_locally'
    },
    {
      timestamp: new Date(Date.now() - 90000),
      user: 'sarah',
      task: 'pack_bag',
      event: 'wallet_added',
      confidence: 0.95,
      privacy: 'frame_discarded_locally'
    },
    {
      timestamp: new Date(Date.now() - 60000),
      user: 'sarah',
      task: 'pack_bag',
      event: 'keys_added',
      confidence: 0.94,
      privacy: 'frame_discarded_locally'
    }
  ]);

  // 5. Sensor History (Time-Series with TTL expireAfterSeconds)
  if (dbManager.isAtlas && dbManager.db) {
    try {
      const collections = await dbManager.db.listCollections({ name: 'sensor_history' }).toArray();
      if (collections.length === 0) {
        await dbManager.db.createCollection('sensor_history', {
          timeseries: {
            timeField: 'timestamp',
            metaField: 'metadata',
            granularity: 'seconds'
          },
          expireAfterSeconds: 604800 // 7 days automatic privacy TTL retention!
        });
        console.log('✅ Created native MongoDB Atlas time-series collection: sensor_history (7-day TTL).');
      }
    } catch (e) {
      console.warn('Note on Atlas time-series creation:', e.message);
    }
  }

  const sensorCol = dbManager.getCollection('sensor_history');
  await sensorCol.deleteMany({});
  await sensorCol.insertOne({
    timestamp: new Date(),
    metadata: { user: 'sarah', task: 'pack_bag' },
    event: 'bag_open'
  });

  console.log('✅ Anchor seed data initialized successfully!');
}

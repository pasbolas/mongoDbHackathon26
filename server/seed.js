import { dbManager } from './db.js';
import { generateSituationEmbedding } from './engine/vectorSearch.js';

export async function seedDatabase(force = false) {
  const routinesCol = dbManager.getCollection('routines');
  const existingRoutine = await routinesCol.findOne({ user: 'John', task: 'make_tea' });

  if (existingRoutine && !force) {
    console.log('🌱 Database already contains seed data for John.');
    return;
  }

  console.log('🌱 Seeding MongoDB collections for Adaptive Memory Guardian...');

  // 1. Routine Collection (John's personal baseline)
  await routinesCol.deleteMany({ user: 'John' });
  await routinesCol.insertOne({
    user: 'John',
    task: 'make_tea',
    title: "John's Morning Tea Routine",
    normalSequence: [
      'fill_kettle',
      'boil_water',
      'get_mug',
      'get_teabag',
      'pour_water',
      'add_milk'
    ],
    assistance: {
      fill_kettle: {
        title: 'Fill Kettle',
        attempts: 32,
        independentCompletions: 31,
        currentPromptLevel: 0, // Fully autonomous!
        idleThresholdSeconds: 22,
        consecutiveIndependent: 12,
        consecutiveStuck: 0,
        cues: {
          level_1: 'The tap is by the sink.',
          level_2: 'Fill the kettle with cold water at the sink.',
          level_3: 'Take the kettle, walk to the sink, and fill it halfway.'
        }
      },
      boil_water: {
        title: 'Boil Water',
        attempts: 32,
        independentCompletions: 30,
        currentPromptLevel: 0, // Fully autonomous!
        idleThresholdSeconds: 20,
        consecutiveIndependent: 9,
        consecutiveStuck: 0,
        cues: {
          level_1: 'The kettle switch is ready.',
          level_2: 'Place kettle on its base and press down the switch.',
          level_3: 'Press down the power switch on the base of the kettle to boil water.'
        }
      },
      get_mug: {
        title: 'Get Mug',
        attempts: 32,
        independentCompletions: 23,
        currentPromptLevel: 1, // Vanished from Level 3 -> Level 1!
        idleThresholdSeconds: 15,
        consecutiveIndependent: 3,
        consecutiveStuck: 0,
        cues: {
          level_1: 'Your mug is nearby.',
          level_2: 'Your mug is in the cupboard beside the kettle.',
          level_3: 'Open the cupboard on your left and take the blue mug.'
        }
      },
      get_teabag: {
        title: 'Get Tea Bag',
        attempts: 32,
        independentCompletions: 28,
        currentPromptLevel: 0,
        idleThresholdSeconds: 18,
        consecutiveIndependent: 6,
        consecutiveStuck: 0,
        cues: {
          level_1: 'The tea box is on the counter.',
          level_2: 'Take an Earl Grey tea bag from the counter box.',
          level_3: 'Pick up one tea bag from the tea box and place it inside your blue mug.'
        }
      },
      pour_water: {
        title: 'Pour Water',
        attempts: 32,
        independentCompletions: 29,
        currentPromptLevel: 0,
        idleThresholdSeconds: 18,
        consecutiveIndependent: 8,
        consecutiveStuck: 0,
        cues: {
          level_1: 'The water has boiled.',
          level_2: 'The boiled kettle is ready to pour into your mug.',
          level_3: 'Carefully lift the kettle and pour hot water into your mug.'
        }
      },
      add_milk: {
        title: 'Add Milk',
        attempts: 32,
        independentCompletions: 26,
        currentPromptLevel: 1,
        idleThresholdSeconds: 16,
        consecutiveIndependent: 4,
        consecutiveStuck: 0,
        cues: {
          level_1: 'Milk is in the fridge door.',
          level_2: 'Take the milk from the fridge door and add a splash.',
          level_3: 'Open the fridge, take the milk, and pour a small splash into your mug.'
        }
      }
    },
    updatedAt: new Date()
  });

  // 2. Situations Vector Collection (Semantic history for Atlas Vector Search)
  const situationsCol = dbManager.getCollection('situations_vector');
  await situationsCol.deleteMany({});

  const situationExamples = [
    {
      situationId: 'sit_mug_search_loop',
      title: 'Cupboard Opened Repeatedly (Looking for Mug)',
      description: 'John is in kitchen. Kettle has boiled. Cupboard opened twice. No mug retrieved. Idle for 25 seconds.',
      problemType: 'cant_find_mug',
      currentStep: 'get_mug',
      recentActions: ['open_cupboard', 'close_cupboard', 'open_cupboard'],
      idleSeconds: 25,
      repeatedAction: true,
      successfulPromptLevel: 1,
      promptText: 'Your mug is nearby in the cupboard.',
      resolutionAction: 'take_mug',
      historicalSuccessRate: 0.94
    },
    {
      situationId: 'sit_idle_post_boil',
      title: 'Idle Hesitation Post-Boiling',
      description: 'Kettle has clicked off. Standing still for 20 seconds without initiating next step.',
      problemType: 'cant_find_mug',
      currentStep: 'get_mug',
      recentActions: ['kettle_boil', 'standing_still'],
      idleSeconds: 20,
      repeatedAction: false,
      successfulPromptLevel: 1,
      promptText: 'Your mug is in the cupboard.',
      resolutionAction: 'take_mug',
      historicalSuccessRate: 0.89
    },
    {
      situationId: 'sit_fridge_distraction',
      title: 'Opened Fridge Instead of Tea Box',
      description: 'Mug on counter. John went to fridge instead of taking teabag from pantry box.',
      problemType: 'forgot_teabag',
      currentStep: 'get_teabag',
      recentActions: ['open_fridge', 'close_fridge'],
      idleSeconds: 15,
      repeatedAction: false,
      successfulPromptLevel: 1,
      promptText: 'The tea box is on the counter.',
      resolutionAction: 'take_teabag',
      historicalSuccessRate: 0.88
    },
    {
      situationId: 'sit_pour_unboiled',
      title: 'Premature Pour Attempt (Unboiled Water)',
      description: 'Kettle filled but boil switch not pressed. Lifted kettle towards mug.',
      problemType: 'boil_hesitation',
      currentStep: 'boil_water',
      recentActions: ['kettle_fill', 'touch_kettle'],
      idleSeconds: 10,
      repeatedAction: false,
      successfulPromptLevel: 2,
      promptText: 'Switch on the kettle to boil water first.',
      resolutionAction: 'kettle_boil',
      historicalSuccessRate: 0.91
    }
  ];

  for (const sit of situationExamples) {
    sit.vector = generateSituationEmbedding({
      task: 'make_tea',
      currentStep: sit.currentStep,
      recentActions: sit.recentActions,
      idleSeconds: sit.idleSeconds,
      repeatedAction: sit.repeatedAction,
      problemHint: sit.problemType
    });
  }

  await situationsCol.insertMany(situationExamples);

  // 3. Longitudinal Metrics Collection (Weekly Progress)
  const metricsCol = dbManager.getCollection('longitudinal_metrics');
  await metricsCol.deleteMany({ user: 'John' });

  await metricsCol.insertMany([
    {
      user: 'John',
      task: 'make_tea',
      weekIndex: 1,
      weekLabel: 'Week 1',
      independenceRate: 72,
      promptsNeeded: 7,
      independentSteps: 18,
      totalSteps: 25,
      avgHesitationSec: 28,
      notes: 'Initial baseline: Required Level 3 explicit step-by-step guidance for mug retrieval and tea bag.'
    },
    {
      user: 'John',
      task: 'make_tea',
      weekIndex: 2,
      weekLabel: 'Week 2',
      independenceRate: 81,
      promptsNeeded: 4,
      independentSteps: 22,
      totalSteps: 27,
      avgHesitationSec: 21,
      notes: 'Vanishing assistance begins: Reduced prompts to Level 2 contextual cues. Hesitation decreased.'
    },
    {
      user: 'John',
      task: 'make_tea',
      weekIndex: 3,
      weekLabel: 'Week 3',
      independenceRate: 89,
      promptsNeeded: 2,
      independentSteps: 25,
      totalSteps: 28,
      avgHesitationSec: 15,
      notes: 'Significant improvement: Mug retrieval prompt successfully vanished down to Level 1 subtle nudge.'
    },
    {
      user: 'John',
      task: 'make_tea',
      weekIndex: 4,
      weekLabel: 'Week 4 (Current)',
      independenceRate: 95,
      promptsNeeded: 1,
      independentSteps: 29,
      totalSteps: 30,
      avgHesitationSec: 12,
      notes: 'Autonomous mastery: Kettle boiling and tea bag handling are completely independent with 0 prompts.'
    }
  ]);

  // 4. Prompt History Collection
  const promptHistoryCol = dbManager.getCollection('prompt_history');
  await promptHistoryCol.deleteMany({ user: 'John' });

  await promptHistoryCol.insertMany([
    {
      user: 'John',
      task: 'make_tea',
      stepKey: 'get_mug',
      promptLevel: 1,
      promptText: 'Your mug is in the cupboard beside the fridge.',
      vectorMatch: { title: 'Cupboard Opened Repeatedly (Looking for Mug)', score: 0.94 },
      outcome: 'RESOLVED_BY_PROMPT',
      timeToResolveSec: 4,
      resolvedAt: new Date(Date.now() - 86400000 * 2)
    },
    {
      user: 'John',
      task: 'make_tea',
      stepKey: 'add_milk',
      promptLevel: 1,
      promptText: 'Milk is in the fridge door.',
      vectorMatch: { title: 'Opened Fridge Instead of Tea Box', score: 0.88 },
      outcome: 'RESOLVED_BY_PROMPT',
      timeToResolveSec: 3,
      resolvedAt: new Date(Date.now() - 86400000)
    }
  ]);

  console.log('✅ Seed data successfully initialized!');
}

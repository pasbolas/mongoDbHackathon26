import { dbManager } from '../db.js';
import { searchSimilarSituations } from './vectorSearch.js';
import { VanishingCuesEngine } from './vanishingCues.js';

export const STEPS_DEFINITION = [
  { key: 'fill_kettle', title: 'Fill Kettle', targetAction: 'kettle_fill', location: 'sink', description: 'Fill the kettle with fresh tap water' },
  { key: 'boil_water', title: 'Boil Water', targetAction: 'kettle_boil', location: 'kettle', description: 'Switch on the kettle to boil water' },
  { key: 'get_mug', title: 'Get Mug', targetAction: 'take_mug', location: 'cupboard', description: 'Retrieve the blue mug from the cupboard' },
  { key: 'get_teabag', title: 'Get Tea Bag', targetAction: 'take_teabag', location: 'tea_box', description: 'Take a tea bag from the tea box' },
  { key: 'pour_water', title: 'Pour Water', targetAction: 'pour_water', location: 'counter', description: 'Pour boiled water into the mug' },
  { key: 'add_milk', title: 'Add Milk', targetAction: 'add_milk', location: 'fridge', description: 'Add a splash of fresh milk' }
];

export class GuardianEngine {
  constructor() {
    this.user = 'John';
    this.task = 'make_tea';
    this.currentStepIndex = 0;
    this.state = 'OBSERVING_SILENT'; // 'OBSERVING_SILENT' | 'EVALUATING' | 'INTERVENING' | 'ROUTINE_COMPLETED'
    this.actionHistory = [];
    this.idleSeconds = 0;
    this.activePrompt = null;
    this.stepOutcomes = [];
    this.subscribers = new Set();
    this.simulationState = {
      kettle: { filled: false, boiling: false, boiled: false },
      cupboard: { open: false },
      fridge: { open: false },
      mug: { inCupboard: true, onCounter: false, hasTeabag: false, hasWater: false, hasMilk: false }
    };
  }

  // Subscribe to real-time Guardian events (SSE)
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event, data) {
    for (const sub of this.subscribers) {
      try {
        sub({ event, data, timestamp: new Date().toISOString() });
      } catch (err) {
        console.error('Subscriber notify error:', err.message);
      }
    }
  }

  getState() {
    const currentStep = STEPS_DEFINITION[this.currentStepIndex] || null;
    return {
      user: this.user,
      task: this.task,
      state: this.state,
      currentStepIndex: this.currentStepIndex,
      currentStep,
      totalSteps: STEPS_DEFINITION.length,
      idleSeconds: this.idleSeconds,
      activePrompt: this.activePrompt,
      actionHistory: this.actionHistory.slice(-10),
      stepOutcomes: this.stepOutcomes,
      simulation: this.simulationState
    };
  }

  resetSession() {
    this.currentStepIndex = 0;
    this.state = 'OBSERVING_SILENT';
    this.actionHistory = [];
    this.idleSeconds = 0;
    this.activePrompt = null;
    this.stepOutcomes = [];
    this.simulationState = {
      kettle: { filled: false, boiling: false, boiled: false },
      cupboard: { open: false },
      fridge: { open: false },
      mug: { inCupboard: true, onCounter: false, hasTeabag: false, hasWater: false, hasMilk: false }
    };
    this.notify('STATE_RESET', this.getState());
  }

  /**
   * Main perception ingestion entrypoint
   */
  async handleAction(actionKey, metadata = {}) {
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];
    const timestamp = new Date();

    const eventRecord = {
      timestamp,
      user: this.user,
      task: this.task,
      action: actionKey,
      currentExpectedStep: currentStep ? currentStep.key : 'completed',
      metadata
    };

    // Store in MongoDB Time-Series collection
    const eventsCol = dbManager.getCollection('events');
    await eventsCol.insertOne(eventRecord);

    this.actionHistory.push({ action: actionKey, timestamp, metadata });
    this.idleSeconds = 0; // reset idle on action

    // Update physical world simulation
    this._updateSimulation(actionKey);

    // If all steps already finished
    if (this.currentStepIndex >= STEPS_DEFINITION.length) {
      this.state = 'ROUTINE_COMPLETED';
      this.notify('ACTION_PERCEIVED', { action: actionKey, state: this.getState() });
      return this.getState();
    }

    // Check if the perceived action matches the target action for the current step
    if (actionKey === currentStep.targetAction) {
      // SUCCESSFUL STEP COMPLETION!
      const wasPromptActive = Boolean(this.activePrompt);
      const promptLevelUsed = wasPromptActive ? this.activePrompt.level : 0;

      // Vanishing cues outcome update
      const outcome = await VanishingCuesEngine.recordStepOutcome({
        userId: this.user,
        taskName: this.task,
        stepKey: currentStep.key,
        wasIndependent: !wasPromptActive,
        promptLevelUsed
      });

      this.stepOutcomes.push({
        stepKey: currentStep.key,
        stepTitle: currentStep.title,
        wasIndependent: !wasPromptActive,
        promptLevelUsed,
        adaptationNotice: outcome ? outcome.adaptationNotice : null
      });

      // If a prompt helped John, log successful intervention in MongoDB
      if (wasPromptActive) {
        const historyCol = dbManager.getCollection('prompt_history');
        await historyCol.insertOne({
          user: this.user,
          task: this.task,
          stepKey: currentStep.key,
          promptLevel: this.activePrompt.level,
          promptText: this.activePrompt.text,
          vectorMatch: this.activePrompt.vectorMatch,
          outcome: 'RESOLVED_BY_PROMPT',
          timeToResolveSec: Math.round((Date.now() - new Date(this.activePrompt.timestamp).getTime()) / 1000),
          resolvedAt: new Date()
        });
      }

      this.activePrompt = null;
      this.currentStepIndex += 1;

      if (this.currentStepIndex >= STEPS_DEFINITION.length) {
        this.state = 'ROUTINE_COMPLETED';
        this.notify('ROUTINE_COMPLETE', {
          user: this.user,
          task: this.task,
          stepOutcomes: this.stepOutcomes,
          independentSteps: this.stepOutcomes.filter(s => s.wasIndependent).length,
          totalSteps: STEPS_DEFINITION.length
        });
      } else {
        this.state = 'OBSERVING_SILENT';
      }

      this.notify('ACTION_PERCEIVED', { action: actionKey, state: this.getState() });
      return this.getState();
    }

    // Perceived action did NOT advance step. Check for confusion / loops!
    await this._detectConfusionAndIntervene(actionKey);

    this.notify('ACTION_PERCEIVED', { action: actionKey, state: this.getState() });
    return this.getState();
  }

  /**
   * Handle simulated idle time passing (hesitation detection)
   */
  async handleIdle(seconds = 5) {
    if (this.currentStepIndex >= STEPS_DEFINITION.length) return this.getState();

    this.idleSeconds += seconds;
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];

    // Look up personal threshold for this step from MongoDB routine
    const routinesCol = dbManager.getCollection('routines');
    const routine = await routinesCol.findOne({ user: this.user, task: this.task });
    const stepConfig = routine?.assistance?.[currentStep.key];
    const threshold = stepConfig?.idleThresholdSeconds || 15;

    if (this.idleSeconds >= threshold) {
      if (!this.activePrompt) {
        await this._intervene('EXCESSIVE_IDLE', {
          idleSeconds: this.idleSeconds,
          threshold
        });
      } else if (this.idleSeconds >= threshold + 10 && this.activePrompt.level < 3) {
        // Escalate prompt if user still stuck after initial prompt
        await this._escalatePrompt('STILL_STUCK_AFTER_PROMPT');
      }
    }

    this.notify('IDLE_UPDATED', { idleSeconds: this.idleSeconds, state: this.getState() });
    return this.getState();
  }

  /**
   * Analyzes recent actions for repetitive loops, erratic navigation, or hesitation
   */
  async _detectConfusionAndIntervene(latestAction) {
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];
    const recent = this.actionHistory.map(a => a.action);

    let isConfused = false;
    let confusionReason = '';

    // Loop detection: e.g. open_cupboard -> close_cupboard -> open_cupboard
    const last4 = recent.slice(-4);
    if (
      (last4.filter(a => a === 'cupboard_open').length >= 2 && currentStep.key === 'get_mug') ||
      (last4.filter(a => a === 'fridge_open').length >= 2 && currentStep.key !== 'add_milk')
    ) {
      isConfused = true;
      confusionReason = 'REPETITIVE_LOOP_LOOKING_FOR_ITEM';
    } else if (latestAction === 'fridge_open' && currentStep.key === 'get_mug') {
      isConfused = true;
      confusionReason = 'LOOKING_IN_WRONG_LOCATION';
    } else if (latestAction === 'pour_water' && !this.simulationState.kettle.boiled) {
      isConfused = true;
      confusionReason = 'SEQUENCE_INVERSION_UNBOILED_WATER';
    }

    if (isConfused) {
      await this._intervene(confusionReason, {
        latestAction,
        recentActions: last4,
        repeatedAction: true
      });
    }
  }

  /**
   * Triggers minimum necessary intervention using Atlas Vector Search
   */
  async _intervene(reason, context = {}) {
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];
    this.state = 'INTERVENING';

    // 1. Run Vector Search to retrieve similar situations from MongoDB Atlas
    const searchContext = {
      task: this.task,
      currentStep: currentStep.key,
      recentActions: this.actionHistory.slice(-5).map(a => a.action),
      idleSeconds: this.idleSeconds,
      repeatedAction: context.repeatedAction || false,
      problemHint: currentStep.key === 'get_mug' ? 'cant_find_mug' : ''
    };

    const vectorMatches = await searchSimilarSituations(searchContext, 3);
    const topMatch = vectorMatches[0] || null;

    // 2. Fetch John's stored routine preferences from MongoDB
    const routinesCol = dbManager.getCollection('routines');
    const routine = await routinesCol.findOne({ user: this.user, task: this.task });
    const stepConfig = routine?.assistance?.[currentStep.key];

    // Determine target prompt level:
    // Respect John's current vanishing cue baseline (starts minimal, e.g. Level 1)
    const baseLevel = stepConfig?.currentPromptLevel ?? 1;
    const targetLevel = Math.max(1, baseLevel);

    // Prompt content based on level
    const promptText = this._getPromptText(currentStep.key, targetLevel, stepConfig);

    this.activePrompt = {
      stepKey: currentStep.key,
      level: targetLevel,
      text: promptText,
      reason,
      vectorMatch: topMatch ? {
        title: topMatch.title,
        problemType: topMatch.problemType,
        score: topMatch.score,
        matchPercentage: Math.round((topMatch.score || 0.88) * 100),
        historicalResolution: topMatch.historicalResolution || topMatch.resolutionAction
      } : null,
      timestamp: new Date()
    };

    this.notify('INTERVENTION_TRIGGERED', {
      prompt: this.activePrompt,
      state: this.getState()
    });
  }

  /**
   * Escalates prompt level if user did not progress
   */
  async _escalatePrompt(reason) {
    if (!this.activePrompt) return;

    const currentStep = STEPS_DEFINITION[this.currentStepIndex];
    const newLevel = Math.min(3, this.activePrompt.level + 1);

    const routinesCol = dbManager.getCollection('routines');
    const routine = await routinesCol.findOne({ user: this.user, task: this.task });
    const stepConfig = routine?.assistance?.[currentStep.key];

    const promptText = this._getPromptText(currentStep.key, newLevel, stepConfig);

    this.activePrompt = {
      ...this.activePrompt,
      level: newLevel,
      text: promptText,
      reason: `ESCALATED: ${reason}`,
      escalatedAt: new Date()
    };

    this.notify('INTERVENTION_ESCALATED', {
      prompt: this.activePrompt,
      state: this.getState()
    });
  }

  _getPromptText(stepKey, level, stepConfig) {
    if (stepConfig && stepConfig.cues && stepConfig.cues[`level_${level}`]) {
      return stepConfig.cues[`level_${level}`];
    }

    const defaultCues = {
      fill_kettle: {
        1: 'The tap is by the sink.',
        2: 'Fill the kettle with cold water at the sink.',
        3: 'Take the kettle, walk to the sink, and fill it halfway.'
      },
      boil_water: {
        1: 'The kettle switch is ready.',
        2: 'Place the kettle on its base and flick the switch down.',
        3: 'Press down the power switch on the base of the kettle to boil water.'
      },
      get_mug: {
        1: 'Your mug is nearby.',
        2: 'Your mug is in the cupboard beside the kettle.',
        3: 'Open the cupboard on your left and take the blue mug.'
      },
      get_teabag: {
        1: 'The tea box is on the counter.',
        2: 'Open the tea box and take one tea bag.',
        3: 'Pick up one tea bag from the tea box and place it inside your blue mug.'
      },
      pour_water: {
        1: 'The water has boiled.',
        2: 'The boiled kettle is ready to pour into your mug.',
        3: 'Carefully lift the kettle and pour hot water into your mug.'
      },
      add_milk: {
        1: 'Milk is in the fridge door.',
        2: 'Take the milk from the fridge door and add a splash.',
        3: 'Open the fridge, take the milk, and pour a small splash into your mug.'
      }
    };

    return defaultCues[stepKey]?.[level] || 'Here is the next step for your tea.';
  }

  _updateSimulation(actionKey) {
    switch (actionKey) {
      case 'kettle_fill':
        this.simulationState.kettle.filled = true;
        break;
      case 'kettle_boil':
        this.simulationState.kettle.boiling = true;
        this.simulationState.kettle.boiled = true;
        break;
      case 'cupboard_open':
        this.simulationState.cupboard.open = true;
        break;
      case 'cupboard_close':
        this.simulationState.cupboard.open = false;
        break;
      case 'fridge_open':
        this.simulationState.fridge.open = true;
        break;
      case 'fridge_close':
        this.simulationState.fridge.open = false;
        break;
      case 'take_mug':
        this.simulationState.mug.inCupboard = false;
        this.simulationState.mug.onCounter = true;
        break;
      case 'take_teabag':
        this.simulationState.mug.hasTeabag = true;
        break;
      case 'pour_water':
        this.simulationState.mug.hasWater = true;
        break;
      case 'add_milk':
        this.simulationState.mug.hasMilk = true;
        break;
    }
  }
}

export const guardianEngine = new GuardianEngine();

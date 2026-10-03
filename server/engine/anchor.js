import { dbManager } from '../db.js';
import { searchSimilarEpisodes } from './vectorSearch.js';

export const STEPS_DEFINITION = [
  { key: 'open_bag', title: 'Open Bag', targetAction: 'bag_open', object: 'bag', description: 'Unzip or open the personal bag' },
  { key: 'pack_wallet', title: 'Pack Wallet', targetAction: 'wallet_added', object: 'wallet', description: 'Place wallet inside bag' },
  { key: 'pack_keys', title: 'Pack Keys', targetAction: 'keys_added', object: 'keys', description: 'Place house and car keys inside bag' },
  { key: 'pack_phone', title: 'Pack Phone', targetAction: 'phone_added', object: 'phone', description: 'Place smartphone inside bag' },
  { key: 'pack_notebook', title: 'Pack Notebook', targetAction: 'notebook_added', object: 'notebook', description: 'Place daily notebook inside bag' },
  { key: 'pack_water', title: 'Pack Water Bottle', targetAction: 'water_added', object: 'water_bottle', description: 'Place water bottle inside bag' },
  { key: 'close_bag', title: 'Close Bag', targetAction: 'bag_close', object: 'bag', description: 'Zip or close the bag ready to leave' }
];

export class AnchorEngine {
  constructor() {
    this.user = 'sarah';
    this.task = 'pack_bag';
    this.currentStepIndex = 0;
    this.state = 'OBSERVING_SILENT'; // 'OBSERVING_SILENT' | 'WAITING' | 'TASK_UNCERTAINTY' | 'INTERVENING' | 'TASK_COMPLETED'
    this.actionHistory = [];
    this.idleSeconds = 0;
    this.activePrompt = null;
    this.stepOutcomes = [];
    this.subscribers = new Set();
    this.reopenedBag = false;
    this.simulationState = {
      bag: { open: false, closed: true },
      items: {
        wallet: { packed: false },
        keys: { packed: false },
        phone: { packed: false },
        notebook: { packed: false },
        water_bottle: { packed: false }
      }
    };
  }

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
    this.reopenedBag = false;
    this.simulationState = {
      bag: { open: false, closed: true },
      items: {
        wallet: { packed: false },
        keys: { packed: false },
        phone: { packed: false },
        notebook: { packed: false },
        water_bottle: { packed: false }
      }
    };
    this.notify('STATE_RESET', this.getState());
  }

  /**
   * Main privacy-first perception ingestion entrypoint
   * Receives semantic event extracted on local device; raw camera frames were discarded immediately
   */
  async handleAction(actionKey, metadata = {}) {
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];
    const timestamp = new Date();

    const eventRecord = {
      timestamp,
      user: this.user,
      task: this.task,
      event: actionKey,
      currentExpectedStep: currentStep ? currentStep.key : 'completed',
      confidence: metadata.confidence || 0.95,
      privacy: 'frame_discarded_locally'
    };

    // 1. Store in normal Atlas collection for live actionable triggers
    const liveEventsCol = dbManager.getCollection('live_events');
    await liveEventsCol.insertOne(eventRecord);

    // 2. Store in time-series collection with TTL for automatic data retention expiration
    const sensorCol = dbManager.getCollection('sensor_history');
    await sensorCol.insertOne({
      timestamp,
      metadata: { user: this.user, task: this.task },
      event: actionKey
    });

    this.actionHistory.push({ action: actionKey, timestamp });
    this.idleSeconds = 0; // reset idle on action

    this._updateSimulation(actionKey);

    if (this.currentStepIndex >= STEPS_DEFINITION.length) {
      this.state = 'TASK_COMPLETED';
      this.notify('ACTION_PERCEIVED', { action: actionKey, state: this.getState() });
      return this.getState();
    }

    // Check if perceived action matches current expected step
    if (actionKey === currentStep.targetAction) {
      const wasPromptActive = Boolean(this.activePrompt);
      const promptLevelUsed = wasPromptActive ? this.activePrompt.level : 0;

      // Update step outcome in Sarah's task profile
      await this._updateTaskProfile(currentStep.key, !wasPromptActive, promptLevelUsed);

      this.stepOutcomes.push({
        stepKey: currentStep.key,
        stepTitle: currentStep.title,
        wasIndependent: !wasPromptActive,
        promptLevelUsed
      });

      // If a prompt helped Sarah, record episode in MongoDB
      if (wasPromptActive) {
        const episodesCol = dbManager.getCollection('episodes');
        await episodesCol.insertOne({
          episodeId: `ep_${Date.now()}`,
          userId: this.user,
          task: this.task,
          context: {
            completed: this._getCompletedItems(),
            remaining: this._getRemainingItems(),
            idleSeconds: this.idleSeconds
          },
          intervention: {
            type: this.activePrompt.type || 'subtle_verbal',
            text: this.activePrompt.text,
            successful: true,
            level: this.activePrompt.level
          },
          episodeSummary: `Sarah completed ${currentStep.title} after receiving cue "${this.activePrompt.text}".`,
          timestamp: new Date()
        });
      }

      this.activePrompt = null;
      this.currentStepIndex += 1;

      if (this.currentStepIndex >= STEPS_DEFINITION.length) {
        this.state = 'TASK_COMPLETED';
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

    // Action did not advance step - check for task uncertainty (e.g. reopened bag)
    if (actionKey === 'bag_close' && this.currentStepIndex < 4) {
      this.reopenedBag = true;
    } else if (actionKey === 'bag_open' && this.reopenedBag) {
      // Reopened bag after closing early
      await this._triggerUncertainty('REOPENED_BAG_EARLY');
    }

    this.notify('ACTION_PERCEIVED', { action: actionKey, state: this.getState() });
    return this.getState();
  }

  /**
   * Simulated inactivity / pause
   * Anchor principle: First WAIT. Do not rush to prompt.
   */
  async handleIdle(seconds = 5) {
    if (this.currentStepIndex >= STEPS_DEFINITION.length) return this.getState();

    this.idleSeconds += seconds;
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];

    // Personal wait threshold for Sarah before suspecting task uncertainty
    const waitThreshold = currentStep.key === 'pack_notebook' ? 20 : 15;

    if (this.idleSeconds < waitThreshold) {
      // System enters deliberate WAIT state: observe and do nothing
      this.state = 'WAITING';
    } else if (this.idleSeconds >= waitThreshold && !this.activePrompt) {
      // Uncertainty detected after waiting
      await this._triggerUncertainty('INACTIVITY_THRESHOLD_EXCEEDED');
    } else if (this.idleSeconds >= waitThreshold + 15 && this.activePrompt && this.activePrompt.level < 3) {
      // Clearer cue if still unresolved
      await this._escalatePrompt('UNRESOLVED_AFTER_INITIAL_CUE');
    }

    this.notify('IDLE_UPDATED', { idleSeconds: this.idleSeconds, state: this.getState() });
    return this.getState();
  }

  async _triggerUncertainty(reason) {
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];
    this.state = 'TASK_UNCERTAINTY';

    // 1. Search Atlas Vector Search for semantically similar previous episodes
    const searchContext = {
      task: this.task,
      completed: this._getCompletedItems(),
      remaining: this._getRemainingItems(),
      idleSeconds: this.idleSeconds,
      reopenedBag: this.reopenedBag,
      currentStep: currentStep.key
    };

    const similarEpisodes = await searchSimilarEpisodes(searchContext, 3);
    const topMatch = similarEpisodes[0] || null;

    // 2. Fetch Sarah's assistance profile for this step
    const profilesCol = dbManager.getCollection('task_profiles');
    const profile = await profilesCol.findOne({ task: this.task, step: currentStep.object || currentStep.key });

    // Determine minimal cue: subtle verbal cue first
    let level = 1;
    let cueText = 'Anything else you normally take with you?';

    if (currentStep.key === 'pack_notebook') {
      cueText = 'Anything else you normally take with you?';
    } else if (currentStep.key === 'pack_water') {
      cueText = 'Anything to drink today?';
    }

    this.activePrompt = {
      stepKey: currentStep.key,
      level,
      type: 'subtle_verbal',
      text: cueText,
      reason: 'Task uncertainty detected after observing wait window',
      vectorMatch: topMatch ? {
        title: topMatch.title || 'Previous episode',
        similarity: Math.round((topMatch.score || 0.93) * 100),
        summary: topMatch.episodeSummary || 'Subtle verbal cue previously resolved activity'
      } : null,
      timestamp: new Date()
    };

    this.state = 'INTERVENING';
    this.notify('INTERVENTION_TRIGGERED', {
      prompt: this.activePrompt,
      state: this.getState()
    });
  }

  async _escalatePrompt(reason) {
    if (!this.activePrompt) return;
    const currentStep = STEPS_DEFINITION[this.currentStepIndex];
    const newLevel = Math.min(3, this.activePrompt.level + 1);

    let cueText = this.activePrompt.text;
    if (newLevel === 2) {
      cueText = 'Your notebook is on the desk.';
    } else if (newLevel === 3) {
      cueText = 'Place your notebook in your bag.';
    }

    this.activePrompt = {
      ...this.activePrompt,
      level: newLevel,
      type: newLevel === 2 ? 'spatial_cue' : 'explicit_instruction',
      text: cueText,
      reason: `Clearer cue: ${reason}`
    };

    this.notify('INTERVENTION_ESCALATED', {
      prompt: this.activePrompt,
      state: this.getState()
    });
  }

  async _updateTaskProfile(stepKey, wasIndependent, promptLevelUsed) {
    const profilesCol = dbManager.getCollection('task_profiles');
    const profile = await profilesCol.findOne({ task: this.task, step: stepKey });

    if (profile) {
      const attempts = (profile.history?.attempts || 0) + 1;
      const independent = (profile.history?.independent || 0) + (wasIndependent ? 1 : 0);

      await profilesCol.updateOne(
        { task: this.task, step: stepKey },
        { 
          $set: { 
            'history.attempts': attempts,
            'history.independent': independent,
            lastUpdated: new Date()
          } 
        }
      );
    }
  }

  _getCompletedItems() {
    const items = [];
    if (this.simulationState.items.wallet.packed) items.push('wallet');
    if (this.simulationState.items.keys.packed) items.push('keys');
    if (this.simulationState.items.phone.packed) items.push('phone');
    if (this.simulationState.items.notebook.packed) items.push('notebook');
    if (this.simulationState.items.water_bottle.packed) items.push('water_bottle');
    return items;
  }

  _getRemainingItems() {
    const all = ['wallet', 'keys', 'phone', 'notebook', 'water_bottle'];
    const done = this._getCompletedItems();
    return all.filter(item => !done.includes(item));
  }

  _updateSimulation(actionKey) {
    switch (actionKey) {
      case 'bag_open':
        this.simulationState.bag.open = true;
        this.simulationState.bag.closed = false;
        break;
      case 'bag_close':
        this.simulationState.bag.open = false;
        this.simulationState.bag.closed = true;
        break;
      case 'wallet_added':
        this.simulationState.items.wallet.packed = true;
        break;
      case 'keys_added':
        this.simulationState.items.keys.packed = true;
        break;
      case 'phone_added':
        this.simulationState.items.phone.packed = true;
        break;
      case 'notebook_added':
        this.simulationState.items.notebook.packed = true;
        break;
      case 'water_added':
        this.simulationState.items.water_bottle.packed = true;
        break;
    }
  }
}

export const anchorEngine = new AnchorEngine();
export const guardianEngine = anchorEngine; // alias for backwards compatibility

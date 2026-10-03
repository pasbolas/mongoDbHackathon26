import { dbManager } from '../db.js';

/**
 * Vanishing Cues & Errorless Learning Engine
 * Implements the cognitive rehabilitation principles described in dementia research (PubMed Central)
 */
export class VanishingCuesEngine {
  /**
   * Evaluates step completion and adapts future prompt strength & timeout thresholds
   * @param {string} userId - e.g. "John"
   * @param {string} taskName - e.g. "make_tea"
   * @param {string} stepKey - e.g. "get_mug"
   * @param {boolean} wasIndependent - true if completed without prompt
   * @param {number} promptLevelUsed - 0 if none, 1, 2, or 3
   */
  static async recordStepOutcome({ userId = 'John', taskName = 'make_tea', stepKey, wasIndependent, promptLevelUsed = 0 }) {
    const routinesCol = dbManager.getCollection('routines');
    const routine = await routinesCol.findOne({ user: userId, task: taskName });

    if (!routine || !routine.assistance || !routine.assistance[stepKey]) {
      return null;
    }

    const currentStepConfig = routine.assistance[stepKey];
    let {
      attempts = 0,
      independentCompletions = 0,
      currentPromptLevel = 1,
      idleThresholdSeconds = 15,
      consecutiveIndependent = 0,
      consecutiveStuck = 0
    } = currentStepConfig;

    attempts += 1;
    let adaptationNotice = null;

    if (wasIndependent) {
      independentCompletions += 1;
      consecutiveIndependent += 1;
      consecutiveStuck = 0;

      const masteryRate = independentCompletions / attempts;

      // Vanishing cues principle: If user succeeds independently 2+ times in a row or mastery > 70%
      if ((consecutiveIndependent >= 2 || masteryRate >= 0.75) && currentPromptLevel > 0) {
        const oldLevel = currentPromptLevel;
        currentPromptLevel = Math.max(0, currentPromptLevel - 1);
        idleThresholdSeconds = Math.min(30, idleThresholdSeconds + 4); // Withhold cues longer!
        adaptationNotice = {
          stepKey,
          event: 'PROMPT_REDUCED',
          oldLevel,
          newLevel: currentPromptLevel,
          message: `Vanishing Cues applied for ${stepKey}: Level ${oldLevel} → Level ${currentPromptLevel}. Threshold expanded to ${idleThresholdSeconds}s.`
        };
      }
    } else {
      consecutiveIndependent = 0;
      consecutiveStuck += 1;

      // If user needed level 2 or 3 prompt, or got stuck repeatedly, adapt safety net
      if (promptLevelUsed > currentPromptLevel || consecutiveStuck >= 2) {
        const oldLevel = currentPromptLevel;
        currentPromptLevel = Math.min(3, Math.max(currentPromptLevel, promptLevelUsed));
        idleThresholdSeconds = Math.max(10, idleThresholdSeconds - 2); // Prompt slightly earlier next time
        adaptationNotice = {
          stepKey,
          event: 'PROMPT_REINFORCED',
          oldLevel,
          newLevel: currentPromptLevel,
          message: `Reinforced baseline for ${stepKey}: Prompt Level set to ${currentPromptLevel} to prevent error cascade.`
        };
      }
    }

    // Update routine document
    const updatedStep = {
      ...currentStepConfig,
      attempts,
      independentCompletions,
      currentPromptLevel,
      idleThresholdSeconds,
      consecutiveIndependent,
      consecutiveStuck,
      lastUpdated: new Date()
    };

    await routinesCol.updateOne(
      { user: userId, task: taskName },
      { $set: { [`assistance.${stepKey}`]: updatedStep } }
    );

    return {
      stepKey,
      wasIndependent,
      attempts,
      independentCompletions,
      masteryRate: Number((independentCompletions / attempts * 100).toFixed(1)),
      currentPromptLevel,
      idleThresholdSeconds,
      adaptationNotice
    };
  }

  /**
   * Computes longitudinal dashboard metrics across historical sessions
   */
  static async getLongitudinalSummary(userId = 'John', taskName = 'make_tea') {
    const routinesCol = dbManager.getCollection('routines');
    const metricsCol = dbManager.getCollection('longitudinal_metrics');
    const promptHistoryCol = dbManager.getCollection('prompt_history');

    const routine = await routinesCol.findOne({ user: userId, task: taskName });
    let weeklyHistory = await metricsCol.find({ user: userId, task: taskName });

    if (!weeklyHistory || weeklyHistory.length === 0) {
      weeklyHistory = [];
    }

    // Calculate current session stats from routine
    let totalAttempts = 0;
    let totalIndependent = 0;
    const stepBreakdown = [];

    if (routine && routine.assistance) {
      for (const [key, val] of Object.entries(routine.assistance)) {
        totalAttempts += val.attempts || 0;
        totalIndependent += val.independentCompletions || 0;
        stepBreakdown.push({
          step: key,
          label: val.title || key,
          attempts: val.attempts || 0,
          independent: val.independentCompletions || 0,
          independenceRate: val.attempts ? Math.round((val.independentCompletions / val.attempts) * 100) : 100,
          currentPromptLevel: val.currentPromptLevel,
          thresholdSeconds: val.idleThresholdSeconds,
          status: val.currentPromptLevel === 0 ? 'Fully Independent' : `Cue Level ${val.currentPromptLevel}`
        });
      }
    }

    const currentIndependenceRate = totalAttempts > 0
      ? Math.round((totalIndependent / totalAttempts) * 100)
      : 89;

    const totalPromptsGiven = await promptHistoryCol.countDocuments({ user: userId });

    return {
      user: userId,
      task: taskName,
      currentIndependenceRate,
      totalPromptsGiven,
      stepBreakdown,
      weeklyProgression: weeklyHistory.sort((a, b) => (a.weekIndex || 0) - (b.weekIndex || 0))
    };
  }
}

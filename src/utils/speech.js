// Web Speech API wrapper for gentle voice prompts
class SpeechService {
  constructor() {
    this.enabled = true;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voice = null;
    this._initVoice();
  }

  _initVoice() {
    if (!this.synth) return;
    const updateVoice = () => {
      const voices = this.synth.getVoices();
      // Look for a gentle English voice (e.g., Natural, Google UK English Female, Samantha, or Serena)
      this.voice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.lang.startsWith('en'))) || voices[0];
    };
    updateVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoice;
    }
  }

  speak(text) {
    if (!this.enabled || !this.synth || !text) return;
    try {
      this.synth.cancel(); // stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = 0.9; // gentle, calm cadence
      utterance.pitch = 1.0;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  stop() {
    if (this.synth) this.synth.cancel();
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (!enabled) this.stop();
    return this.enabled;
  }
}

export const speechService = new SpeechService();

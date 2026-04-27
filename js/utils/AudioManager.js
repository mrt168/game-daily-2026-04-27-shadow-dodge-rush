// Web Audio APIでSEを生成（外部ファイル不要）
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmGain = null;
    this.bgmOsc = null;
    this.bgmTempo = 1.0;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext unavailable:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  beep(freq, duration = 0.1, type = 'sine', volume = 0.15) {
    if (!this.ctx || this.muted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  swipe() { this.beep(440, 0.06, 'triangle', 0.08); }
  coin() { this.beep(880, 0.08, 'sine', 0.18); setTimeout(() => this.beep(1320, 0.08, 'sine', 0.12), 50); }
  death() {
    this.beep(220, 0.3, 'sawtooth', 0.25);
    setTimeout(() => this.beep(110, 0.4, 'square', 0.2), 100);
  }
  tick() { this.beep(660, 0.05, 'sine', 0.06); }
  combo() { this.beep(1200, 0.1, 'triangle', 0.12); }

  startBGM() {
    if (!this.ctx || this.muted || this.bgmOsc) return;
    try {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.04;
      this.bgmGain.connect(this.ctx.destination);
      this.bgmOsc = this.ctx.createOscillator();
      this.bgmOsc.type = 'sine';
      this.bgmOsc.frequency.value = 110;
      this.bgmOsc.connect(this.bgmGain);
      this.bgmOsc.start();
      this._bgmInterval = setInterval(() => {
        if (!this.bgmOsc) return;
        try {
          const notes = [110, 138, 165, 138];
          const n = notes[Math.floor(Date.now() / 400) % notes.length];
          this.bgmOsc.frequency.setTargetAtTime(n * this.bgmTempo, this.ctx.currentTime, 0.05);
        } catch (e) {}
      }, 400);
    } catch (e) {}
  }

  setBGMTempo(t) { this.bgmTempo = Math.max(0.5, Math.min(2.5, t)); }

  stopBGM() {
    try {
      if (this._bgmInterval) clearInterval(this._bgmInterval);
      this._bgmInterval = null;
      if (this.bgmOsc) { this.bgmOsc.stop(); this.bgmOsc.disconnect(); }
      if (this.bgmGain) { this.bgmGain.disconnect(); }
      this.bgmOsc = null;
      this.bgmGain = null;
    } catch (e) {}
  }
}
window.AUDIO = new AudioManager();

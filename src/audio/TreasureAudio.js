// Recorded theme + original procedural effects. Mix levels live outside UI logic.
const MUSIC_LEVELS = { quiz: 0.46, reward: 0.6, closing: 0, done: 0 };

export class TreasureAudio {
  constructor({ contextFactory, isHidden = () => document.hidden, musicLoader } = {}) {
    this.contextFactory = contextFactory || (() => {
      const Context = window.AudioContext || window.webkitAudioContext;
      return Context ? new Context() : null;
    });
    this.isHidden = isHidden;
    this.enabled = false;
    this.scene = 'idle';
    this.sources = new Set();
    this.musicSources = new Set();
    this.musicLoader = musicLoader || (async () => {
      if (typeof window === 'undefined') return null;
      this.abortController = new AbortController();
      const response = await fetch('/audio/treasure-theme.mp3', { signal: this.abortController.signal });
      if (!response.ok) throw new Error('Music unavailable');
      return this.context.decodeAudioData(await response.arrayBuffer());
    });
    this.bar = 0;
  }

  async enable() {
    this.enabled = true;
    try {
      if (!this.context || this.context.state === 'closed') this.setup();
      if (!this.context) { this.enabled = false; return false; }
      await this.context.resume();
      // A mute or tab switch can happen while resume is pending.
      if (this.enabled && !this.isHidden()) {
        this.fade(this.master.gain, 0.8, 0.15);
        this.startMusic();
        this.loadTheme();
      }
      return this.enabled;
    } catch {
      this.enabled = false;
      return false;
    }
  }

  setup() {
    this.context = this.contextFactory();
    if (!this.context) return;
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const compressor = ctx.createDynamicsCompressor();
    this.master.connect(compressor);
    compressor.connect(ctx.destination);
    this.music = ctx.createGain();
    this.effects = ctx.createGain();
    this.music.gain.value = MUSIC_LEVELS[this.scene] ?? 0.64;
    this.effects.gain.value = 1;
    this.music.connect(this.master);
    this.effects.connect(this.master);
    this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const samples = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }

  fade(param, value, duration) {
    const now = this.context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + duration);
  }

  track(source, music = false) {
    this.sources.add(source);
    if (music) this.musicSources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      this.musicSources.delete(source);
    };
    return source;
  }

  tone(frequency, delay, duration, volume, { type = 'sine', music = false, bend = 1 } = {}) {
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const oscillator = this.track(ctx.createOscillator(), music);
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * bend, start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + Math.min(0.018, duration / 5));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(music ? this.music : this.effects);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise(delay, duration, volume, frequency, endFrequency = frequency) {
    const ctx = this.context;
    const start = ctx.currentTime + delay;
    const source = this.track(ctx.createBufferSource());
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(frequency, start);
    filter.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(volume, start + duration * 0.22);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.effects);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  play(name) {
    if (!this.enabled || this.isHidden() || this.context?.state !== 'running') return;
    switch (name) {
      case 'shake':
        [0, 0.17, 0.34].forEach((at, i) => {
          this.tone(130 + i * 12, at, 0.12, 0.13, { bend: 0.6 });
          this.noise(at, 0.1, 0.12, 700);
        });
        break;
      case 'open':
        this.noise(0, 0.38, 0.13, 280, 1000);
        this.tone(185, 0, 0.25, 0.09, { bend: 1.3, type: 'triangle' });
        [523.25, 659.25, 783.99].forEach((note, i) => this.tone(note, 0.16 + i * 0.08, 0.65, 0.08));
        break;
      case 'coins':
        [0, 0.08, 0.18, 0.31, 0.47, 0.64].forEach((at, i) => {
          this.tone(1450 + i % 3 * 380, at, 0.12, 0.043);
          this.tone(2600 + i % 2 * 310, at, 0.075, 0.018);
        });
        break;
      case 'tap':
        this.noise(0, 0.065, 0.16, 2400, 1500);
        this.tone(320, 0, 0.045, 0.025);
        break;
      case 'page':
        this.noise(0, 0.22, 0.24, 1100, 3800);
        this.noise(0.11, 0.22, 0.13, 3200, 800);
        break;
      case 'correct':
        this.duckMusic(1.15);
        // Bright ascending phrase and a warm final chord.
        [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => {
          this.tone(note, i * 0.12, 0.5, 0.17, { type: 'triangle' });
          this.tone(note * 2, i * 0.12, 0.35, 0.035);
        });
        [523.25, 659.25, 783.99].forEach(note => this.tone(note, 0.42, 0.7, 0.065));
        break;
      case 'review':
        this.duckMusic(0.9);
        // Descending phrase: distinct feedback without a harsh buzzer.
        [440, 349.23, 293.66].forEach((note, i) => this.tone(note, i * 0.16, 0.35, 0.16, { type: 'triangle' }));
        this.tone(146.83, 0.32, 0.45, 0.07);
        break;
      case 'reward':
        [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => this.tone(note, i * 0.15, 1.2, 0.075));
        break;
      case 'close':
        this.noise(0, 0.18, 0.17, 700, 200);
        this.tone(105, 0, 0.24, 0.2, { bend: 0.55 });
        this.noise(0.12, 0.055, 0.2, 1800);
        this.tone(850, 0.12, 0.08, 0.04);
        break;
      default: break;
    }
  }

  setScene(scene) {
    this.scene = scene;
    if (!this.context) return;
    const level = MUSIC_LEVELS[scene] ?? 0.64;
    this.fade(this.music.gain, level, scene === 'closing' ? 0.7 : 0.45);
    if (scene === 'done' || scene === 'closing') this.stopMusic(scene === 'closing' ? 0.75 : 0);
    else this.startMusic();
  }

  startMusic() {
    if (this.musicTimer || this.themeSource || !this.enabled || this.isHidden() || !this.context
      || ['closing', 'done'].includes(this.scene)) return;
    if (this.musicBuffer) {
      const source = this.track(this.context.createBufferSource(), true);
      source.buffer = this.musicBuffer;
      source.loop = true;
      source.connect(this.music);
      source.start();
      this.themeSource = source;
      return;
    }
    const phrase = () => {
      if (!this.enabled || this.isHidden() || this.context.state !== 'running') return;
      const chords = [[261.63, 329.63, 392, 493.88], [220, 329.63, 392, 440], [174.61, 261.63, 349.23, 440], [196, 293.66, 392, 493.88]];
      const notes = chords[this.bar++ % chords.length];
      notes.forEach((note, i) => {
        this.tone(note, i * 1.2, 2.5, 0.075, { music: true, type: 'sine' });
        this.tone(note * 2, i * 1.2 + 0.015, 1.3, 0.022, { music: true });
      });
    };
    phrase();
    this.musicTimer = setInterval(phrase, 6000);
  }

  loadTheme() {
    if (this.musicPromise) return;
    this.musicPromise = Promise.resolve().then(() => this.musicLoader()).then(buffer => {
      if (!buffer || this.disposed) return;
      this.musicBuffer = buffer;
      this.stopMusic();
      this.startMusic();
    }).catch(() => {
      // Keep procedural fallback if the download or decode fails.
      this.musicPromise = null;
    });
  }

  duckMusic(duration) {
    const now = this.context.currentTime;
    const level = MUSIC_LEVELS[this.scene] ?? 0.64;
    const gain = this.music.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(level * 0.35, now + 0.06);
    gain.setValueAtTime(level * 0.35, now + duration - 0.2);
    gain.linearRampToValueAtTime(level, now + duration);
  }

  stopMusic(fadeDuration = 0) {
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    for (const source of this.musicSources) {
      try { source.stop(this.context.currentTime + fadeDuration); } catch { /* Already stopped. */ }
    }
    this.musicSources.clear();
    this.themeSource = null;
  }

  stopSources() {
    for (const source of this.sources) {
      try { source.stop(); } catch { /* Source may have already ended. */ }
    }
    this.sources.clear();
  }

  async silence() {
    this.stopMusic();
    this.stopSources();
    if (this.context && this.context.state !== 'closed') {
      this.master.gain.value = 0;
      try { await this.context.suspend(); } catch { /* Audio is optional. */ }
    }
  }

  disable() {
    this.enabled = false;
    return this.silence();
  }

  visibilityChanged() {
    if (this.isHidden()) void this.silence();
    else if (this.enabled) void this.enable();
  }

  dispose() {
    this.disposed = true;
    this.abortController?.abort();
    this.enabled = false;
    this.stopMusic();
    this.stopSources();
    if (this.context && this.context.state !== 'closed') void this.context.close().catch(() => {});
  }
}

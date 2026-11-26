/**
 * Autonomous Cyberpunk Web Audio API Synthesizer
 * 100% self-contained procedural sound effects with zero external audio assets.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicEnabled: boolean = true;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private isAmbiencePlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private syncAmbientVolume() {
    if (this.ambientGain && this.ctx) {
      const active = !this.muted && this.musicEnabled;
      this.ambientGain.gain.setValueAtTime(active ? 0.04 : 0, this.ctx.currentTime);
    }
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
    this.syncAmbientVolume();
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.syncAmbientVolume();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  /**
   * Generates low-frequency ambient sci-fi drone
   */
  public startAmbience() {
    if (!this.musicEnabled || this.muted) return;
    this.initContext();
    if (!this.ctx || this.isAmbiencePlaying) return;

    try {
      const now = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(!this.muted && this.musicEnabled ? 0.04 : 0, now);
      this.ambientGain.connect(this.ctx.destination);

      // Low drone oscillator 1 (55Hz - A1)
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc1.frequency.setValueAtTime(55, now);

      // Filter to make it warm and moody
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, now);

      // Low drone oscillator 2 detuned slightly (54.3Hz)
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(54.3, now);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.isAmbiencePlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopAmbience() {
    if (this.ambientOsc1 && this.ambientOsc2) {
      try {
        this.ambientOsc1.stop();
        this.ambientOsc2.stop();
      } catch {}
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.isAmbiencePlaying = false;
    }
  }

  /**
   * Subtle high-tech movement tick
   */
  public playStep() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * Neon cyber key pickup chord
   */
  public playKeyPickup() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const noteStart = now + idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.12, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.25);
      });
    } catch {}
  }

  /**
   * Deep mechanical wall rearrangement sound
   */
  public playWallShift() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low sub rumble
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.linearRampToValueAtTime(90, now + 0.6);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);

      // Metallic servo accent
      const servo = this.ctx.createOscillator();
      const servoGain = this.ctx.createGain();
      servo.type = 'square';
      servo.frequency.setValueAtTime(440, now);
      servo.frequency.linearRampToValueAtTime(880, now + 0.15);
      servoGain.gain.setValueAtTime(0.04, now);
      servoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      servo.connect(servoGain);
      servoGain.connect(this.ctx.destination);
      servo.start(now);
      servo.stop(now + 0.2);
    } catch {}
  }

  /**
   * Suspicion rise warning stinger
   */
  public playSuspicionAlert() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.setValueAtTime(820, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  /**
   * Triumphant victory fanfare
   */
  public playVictory() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [
        { freqs: [440, 554.37, 659.25], delay: 0 },
        { freqs: [493.88, 622.25, 739.99], delay: 0.18 },
        { freqs: [587.33, 739.99, 880.0], delay: 0.36 },
        { freqs: [659.25, 830.61, 987.77], delay: 0.58 },
      ];

      chords.forEach(({ freqs, delay }) => {
        const chordTime = now + delay;
        freqs.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, chordTime);

          gain.gain.setValueAtTime(0.09, chordTime);
          gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.5);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(chordTime);
          osc.stop(chordTime + 0.5);
        });
      });
    } catch {}
  }

  /**
   * Glitch failure sound
   */
  public playGameOver() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.5);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {}
  }

  /**
   * Bright cheese nibble chime
   */
  public playCheesePickup() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [587.33, 880]; // D5 -> A5
      freqs.forEach((f, idx) => {
        const start = now + idx * 0.055;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch {}
  }

  /**
   * Cartoon Cat Meow
   */
  public playCatMeow() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  /**
   * Cartoon Double Dog Bark ("Woof! Woof!")
   */
  public playDogBark() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [0, 0.13].forEach((offset) => {
        const start = now + offset;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240 + offset * 200, start);
        osc.frequency.exponentialRampToValueAtTime(110, start + 0.09);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, start);

        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch {}
  }

  /**
   * Spooky Ghost Theremin / Wobble ("OoooOOoo!")
   */
  public playGhostSpook() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(760, now + 0.25);
      osc.frequency.linearRampToValueAtTime(420, now + 0.65);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(9, now);
      lfoGain.gain.setValueAtTime(28, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 0.7);
      osc.stop(now + 0.7);
    } catch {}
  }

  /**
   * Dramatic Cat Catching Rat stinger
   */
  public playCatCatch() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [392, 349.23, 293.66, 196].forEach((freq, idx) => {
        const start = now + idx * 0.1;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {}
  }
}

export const sound = new SoundEngine();

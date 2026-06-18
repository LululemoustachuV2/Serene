import { Injectable } from '@angular/core';

export type AmbientSound = 'silence' | 'brown-noise' | 'white-noise' | 'rain' | 'ocean' | 'wind';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private ambientGain: GainNode;
  private source?: AudioBufferSourceNode;
  private windFilter?: BiquadFilterNode;
  private oceanLfo?: OscillatorNode;
  private oceanLfoGain?: GainNode;
  currentSound: AmbientSound = 'silence';
  volume = 0.5;

  constructor() {
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.ambientGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.ambientGain.gain.value = this.volume;
    this.ambientGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.ambientGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
  }

  async ensureContext(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /** Gong doux au début de la méditation (après l'installation). */
  playGong(): void {
    const now = this.ctx.currentTime;
    const partials = [
      { freq: 136.1, gain: 0.22, decay: 5 },
      { freq: 272.2, gain: 0.08, decay: 4 },
      { freq: 408.3, gain: 0.04, decay: 3 },
    ];

    for (const { freq, gain, decay } of partials) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(gain, now + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + decay + 0.1);
    }
  }

  /** Gong d'intervalle — plus léger, toutes les minutes. */
  playIntervalGong(): void {
    const now = this.ctx.currentTime;
    const partials = [
      { freq: 136.1, gain: 0.12, decay: 2.5 },
      { freq: 272.2, gain: 0.04, decay: 2 },
    ];

    for (const { freq, gain, decay } of partials) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(gain, now + 0.03);
      env.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + decay + 0.1);
    }
  }

  /** Cloche de fin de session. */
  playBell(): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.frequency.value = 523.25;
    osc.type = 'sine';
    env.gain.setValueAtTime(0.25, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 2.6);
  }

  play(sound: AmbientSound): void {
    this.stopPlayback();
    this.currentSound = sound;
    if (sound === 'silence') return;

    switch (sound) {
      case 'white-noise':
        this.source = this.createLoopingSource((data) => this.fillWhiteNoise(data), this.ambientGain);
        break;
      case 'brown-noise':
        this.source = this.createLoopingSource((data) => this.fillBrownNoise(data), this.ambientGain);
        break;
      case 'rain':
        this.source = this.createLoopingSource((data) => this.fillRain(data), this.ambientGain);
        break;
      case 'ocean': {
        const oceanGain = this.ctx.createGain();
        oceanGain.gain.value = 0.35;
        oceanGain.connect(this.ambientGain);
        this.source = this.createLoopingSource((data) => this.fillBrownNoise(data), oceanGain);
        this.oceanLfo = this.ctx.createOscillator();
        this.oceanLfoGain = this.ctx.createGain();
        this.oceanLfo.frequency.value = 0.08;
        this.oceanLfoGain.gain.value = 0.2;
        this.oceanLfo.connect(this.oceanLfoGain);
        this.oceanLfoGain.connect(oceanGain.gain);
        this.oceanLfo.start();
        break;
      }
      case 'wind':
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'highpass';
        this.windFilter.frequency.value = 600;
        this.windFilter.Q.value = 0.7;
        this.windFilter.connect(this.ambientGain);
        this.source = this.createLoopingSource((data) => this.fillWhiteNoise(data), this.windFilter);
        break;
    }
  }

  stop(): void {
    this.stopPlayback();
    this.currentSound = 'silence';
  }

  /** Arrête la lecture sans modifier l'ambiance sélectionnée. */
  halt(): void {
    this.stopPlayback();
  }

  private stopPlayback(): void {
    try {
      this.source?.stop();
    } catch {
      // ignore
    }
    if (this.source) {
      this.source.disconnect();
      this.source = undefined;
    }
    if (this.windFilter) {
      this.windFilter.disconnect();
      this.windFilter = undefined;
    }
    if (this.oceanLfo) {
      try {
        this.oceanLfo.stop();
      } catch {
        // ignore
      }
      this.oceanLfo.disconnect();
      this.oceanLfo = undefined;
    }
    if (this.oceanLfoGain) {
      this.oceanLfoGain.disconnect();
      this.oceanLfoGain = undefined;
    }
  }

  private createLoopingSource(
    fill: (data: Float32Array) => void,
    destination: AudioNode,
  ): AudioBufferSourceNode {
    const bufSize = this.ctx.sampleRate * 2;
    const source = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    fill(buffer.getChannelData(0));
    source.buffer = buffer;
    source.loop = true;
    source.connect(destination);
    source.start();
    return source;
  }

  private fillWhiteNoise(data: Float32Array): void {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  private fillBrownNoise(data: Float32Array): void {
    let val = 0;
    for (let i = 0; i < data.length; i++) {
      val += (Math.random() * 2 - 1) * 0.02;
      val = Math.max(-1, Math.min(1, val));
      data[i] = val * 0.3;
    }
  }

  private fillRain(data: Float32Array): void {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    for (let i = 1; i < data.length; i++) data[i] = (data[i] + data[i - 1]) * 0.5;
  }
}

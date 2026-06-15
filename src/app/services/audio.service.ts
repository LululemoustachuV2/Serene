import { Injectable } from '@angular/core';

export type AmbientSound = 'silence' | 'brown-noise' | 'white-noise' | 'rain' | 'ocean' | 'wind';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private source?: AudioBufferSourceNode;
  private windFilter?: BiquadFilterNode;
  private lfo?: OscillatorNode;
  private lfoGain?: GainNode;
  currentSound: AmbientSound = 'silence';
  volume = 0.5;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(this.ctx.destination);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.01);
  }

  async ensureContext(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  playBell(): void {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.frequency.value = 880;
    osc.type = 'sine';
    env.gain.setValueAtTime(0.3, this.ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
    osc.connect(env);
    env.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 2);
  }

  play(sound: AmbientSound): void {
    this.stopPlayback();
    this.currentSound = sound;
    if (sound === 'silence') return;

    switch (sound) {
      case 'white-noise':
        this.source = this.createLoopingSource((data) => this.fillWhiteNoise(data), this.gainNode);
        break;
      case 'brown-noise':
        this.source = this.createLoopingSource((data) => this.fillBrownNoise(data), this.gainNode);
        break;
      case 'rain':
        this.source = this.createLoopingSource((data) => this.fillRain(data), this.gainNode);
        break;
      case 'ocean':
        this.source = this.createLoopingSource((data) => this.fillBrownNoise(data), this.gainNode);
        this.createLFO(0.1, 0.3);
        break;
      case 'wind':
        // white noise through a high-pass filter
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'highpass';
        this.windFilter.frequency.value = 800;
        this.windFilter.connect(this.gainNode);
        this.source = this.createLoopingSource((data) => this.fillWhiteNoise(data), this.windFilter);
        break;
    }
  }

  stop(): void {
    this.stopPlayback();
    this.currentSound = 'silence';
  }

  stopPreview(): void {
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
    if (this.lfo) {
      try {
        this.lfo.stop();
      } catch {}
      this.lfo.disconnect();
      this.lfo = undefined;
    }
    if (this.lfoGain) {
      this.lfoGain.disconnect();
      this.lfoGain = undefined;
    }
  }

  private createLoopingSource(
    fill: (data: Float32Array) => void,
    destination: AudioNode
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

  private createLFO(freq: number, depth: number): void {
    this.lfo = this.ctx.createOscillator();
    this.lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = freq;
    this.lfoGain.gain.value = depth;
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.gainNode.gain);
    this.lfo.start();
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

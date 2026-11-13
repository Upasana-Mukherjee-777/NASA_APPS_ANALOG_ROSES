// Web Audio API Procedural Synthesizer for Space Exploration UI
// Completely self-contained, zero external audio asset dependencies.

class SoundEngine {
  private ctx: AudioContext | null = null
  private ambientOsc: OscillatorNode | null = null
  private ambientGain: GainNode | null = null
  private enabled: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mars_sound_enabled')
      this.enabled = stored === 'true'
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public setEnabled(enable: boolean) {
    this.enabled = enable
    if (typeof window !== 'undefined') {
      localStorage.setItem('mars_sound_enabled', enable ? 'true' : 'false')
    }
    if (enable) {
      this.initContext()
      this.startAmbient()
      this.playChime()
    } else {
      this.stopAmbient()
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled)
    return this.enabled
  }

  public playClick() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04)

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.04)
    } catch (e) {}
  }

  public playChime() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const freqs = [523.25, 659.25, 783.99, 1046.50] // C-E-G-C ascending chord
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.06)

        gain.gain.setValueAtTime(0.05, now + idx * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now + idx * 0.06)
        osc.stop(now + idx * 0.06 + 0.25)
      })
    } catch (e) {}
  }

  public playWarning() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.setValueAtTime(880, now + 0.1)
      osc.frequency.setValueAtTime(440, now + 0.2)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.35)
    } catch (e) {}
  }

  public playScan() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.linearRampToValueAtTime(1200, now + 0.18)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.18)
    } catch (e) {}
  }

  private startAmbient() {
    if (!this.enabled || this.ambientOsc) return
    try {
      this.initContext()
      if (!this.ctx) return
      this.ambientOsc = this.ctx.createOscillator()
      this.ambientGain = this.ctx.createGain()
      this.ambientOsc.type = 'sine'
      this.ambientOsc.frequency.setValueAtTime(65, this.ctx.currentTime) // Low Mars resonance hum

      this.ambientGain.gain.setValueAtTime(0.02, this.ctx.currentTime)
      this.ambientOsc.connect(this.ambientGain)
      this.ambientGain.connect(this.ctx.destination)

      this.ambientOsc.start()
    } catch (e) {}
  }

  private stopAmbient() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop()
        this.ambientOsc.disconnect()
      } catch (e) {}
      this.ambientOsc = null
      this.ambientGain = null
    }
  }
}

export const soundEngine = new SoundEngine()


// Web Audio API Procedural Synthesizer for Space Exploration Game UI
// Completely original & self-contained: zero external audio asset dependencies, zero NASA audio media.

class SoundEngine {
  private ctx: AudioContext | null = null
  private ambientOsc: OscillatorNode | null = null
  private ambientGain: GainNode | null = null
  private enabled: boolean = false
  private driveOsc: OscillatorNode | null = null
  private driveGain: GainNode | null = null

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
      this.stopRoverDrive()
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
      osc.frequency.linearRampToValueAtTime(1200, now + 0.22)

      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.22)
    } catch (e) {}
  }

  public playDiscovery() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const chord = [587.33, 739.99, 880.00, 1174.66] // D-F#-A-D sparkle
      chord.forEach((f, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now + idx * 0.05)
        gain.gain.setValueAtTime(0.07, now + idx * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35)

        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + idx * 0.05)
        osc.stop(now + idx * 0.05 + 0.35)
      })
    } catch (e) {}
  }

  public playCompanionChirp(mood: 'happy' | 'curious' | 'thinking' | 'alert' | 'celebrate' = 'happy') {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      if (mood === 'happy') {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(880, now)
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08)
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.16)
        gain.gain.setValueAtTime(0.06, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
      } else if (mood === 'thinking') {
        [600, 750, 900].forEach((freq, idx) => {
          if (!this.ctx) return
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now + idx * 0.07)
          gain.gain.setValueAtTime(0.04, now + idx * 0.07)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.06)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now + idx * 0.07)
          osc.stop(now + idx * 0.07 + 0.06)
        })
      } else if (mood === 'alert') {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(980, now)
        osc.frequency.setValueAtTime(700, now + 0.08)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.18)
      } else if (mood === 'celebrate') {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
        notes.forEach((freq, idx) => {
          if (!this.ctx) return
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, now + idx * 0.05)
          gain.gain.setValueAtTime(0.07, now + idx * 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28)
          osc.connect(gain)
          gain.connect(this.ctx.destination)
          osc.start(now + idx * 0.05)
          osc.stop(now + idx * 0.05 + 0.28)
        })
      } else {
        // Curious
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(650, now)
        osc.frequency.linearRampToValueAtTime(1100, now + 0.12)
        gain.gain.setValueAtTime(0.05, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now)
        osc.stop(now + 0.15)
      }
    } catch (e) {}
  }

  public playSampleCollect() {
    if (!this.enabled) return
    try {
      this.initContext()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      // Click/Latch
      const latch = this.ctx.createOscillator()
      const lGain = this.ctx.createGain()
      latch.type = 'square'
      latch.frequency.setValueAtTime(220, now)
      lGain.gain.setValueAtTime(0.08, now)
      lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
      latch.connect(lGain)
      lGain.connect(this.ctx.destination)
      latch.start(now)
      latch.stop(now + 0.05)

      // Chime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1320, now + 0.05)
      gain.gain.setValueAtTime(0.07, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now + 0.05)
      osc.stop(now + 0.25)
    } catch (e) {}
  }

  public startRoverDrive() {
    if (!this.enabled || this.driveOsc) return
    try {
      this.initContext()
      if (!this.ctx) return
      this.driveOsc = this.ctx.createOscillator()
      this.driveGain = this.ctx.createGain()
      this.driveOsc.type = 'triangle'
      this.driveOsc.frequency.setValueAtTime(110, this.ctx.currentTime)
      this.driveGain.gain.setValueAtTime(0.03, this.ctx.currentTime)
      this.driveOsc.connect(this.driveGain)
      this.driveGain.connect(this.ctx.destination)
      this.driveOsc.start()
    } catch (e) {}
  }

  public stopRoverDrive() {
    if (this.driveOsc) {
      try {
        this.driveOsc.stop()
        this.driveOsc.disconnect()
      } catch (e) {}
      this.driveOsc = null
      this.driveGain = null
    }
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

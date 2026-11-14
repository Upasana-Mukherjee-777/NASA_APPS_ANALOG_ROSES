'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  X,
  Volume2,
  VolumeX,
  HelpCircle,
  Compass,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Zap,
  Bot
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import { CompanionMood } from '@/types/game'

// Knowledge base for beginner-friendly answers
const MARS_QA_KNOWLEDGE: { keywords: string[]; answer: string; mood: CompanionMood }[] = [
  {
    keywords: ['why is mars red', 'red color', 'rust'],
    answer: "Mars is coated in iron oxide—essentially plain old rust! Billions of years ago, iron in Martian rocks reacted with ancient trace oxygen and water, turning the whole surface into a rusty dust bowl.",
    mood: 'happy'
  },
  {
    keywords: ['smectite', 'clay', 'phyllosilicate'],
    answer: "Smectite is a type of clay mineral that only forms when liquid water sits peacefully for a very long time! Finding smectite in Jezero Crater proves this was once an ancient lake full of calm water.",
    mood: 'celebrate'
  },
  {
    keywords: ['mola', 'elevation', 'sea level', 'datum'],
    answer: "Mars has no oceans, so how do we measure 'sea level'? Scientists use the MOLA Datum: an arbitrary elevation line based on Mars's average gravity and radius. Negative elevations mean you're deep inside a giant basin or crater!",
    mood: 'thinking'
  },
  {
    keywords: ['water ice', 'ice', 'drinking water'],
    answer: "There is tons of water on Mars, but it's frozen solid beneath the red dirt or locked at the polar caps. At Mars's low air pressure, liquid water would instantly boil away or freeze!",
    mood: 'curious' as any
  },
  {
    keywords: ['dust tau', 'optical depth', 'dust storm'],
    answer: "Dust Tau measures how murky the Martian sky is. A tau of 0.3 means crystal clear blue skies; a tau above 1.0 means a choking dust storm where sunlight dims and solar panels struggle!",
    mood: 'alert'
  },
  {
    keywords: ['temperature', 'cold', 'freezing'],
    answer: "Brrr! Mars averages -60°C (-80°F). During Jezero summer noon it might warm up to 0°C (32°F), but at night it plummets to -90°C! Always keep your rover's heaters running.",
    mood: 'alert'
  },
  {
    keywords: ['volcano', 'olympus mons', 'mountain'],
    answer: "Mars hosts Olympus Mons, a shield volcano that towers 21.2 kilometers (69,600 feet) high—nearly three times taller than Mount Everest! Because Mars has no plate tectonics, magma kept piling in one spot.",
    mood: 'celebrate'
  },
  {
    keywords: ['breathe', 'air', 'atmosphere', 'oxygen'],
    answer: "Mars air is 95% carbon dioxide, and less than 1% as thick as Earth's! Trying to breathe without your suit would give you hypoxia in seconds. Never forget to monitor your EVA oxygen gauge!",
    mood: 'alert'
  },
  {
    keywords: ['rollover', 'slope', 'tilt', 'stuck'],
    answer: "Our rover has a safety threshold of 18° tilt! Slopes steeper than 18° have loose Martian regolith scree where wheels slip and the rover could tip. Stick to the gentler valley floors!",
    mood: 'alert'
  },
  {
    keywords: ['curiosity', 'mount sharp', 'perseverance'],
    answer: "Curiosity landed in Gale Crater and has climbed Mount Sharp's ancient sulfate layers. Meanwhile, Perseverance is exploring Jezero Crater's river delta caching samples for future return!",
    mood: 'happy'
  }
]

const FUN_MARS_FACTS = [
  "Mars has two potato-shaped moons named Phobos (Fear) and Deimos (Panic)!",
  "A day on Mars is called a 'Sol' and lasts 24 hours, 39 minutes, and 35 seconds.",
  "Martian sunsets glow blue instead of orange because fine dust scatters red light forward!",
  "Gravity on Mars is only 38% of Earth's—you could jump almost three times as high in your spacesuit!",
  "Mars has the deepest canyon in the Solar System: Valles Marineris stretches across 4,000 km!",
  "There are ancient dried-up river deltas on Mars with clay mudstones that look just like Earth's Mississippi Delta!"
]

export default function AeroCompanion() {
  const {
    buddyMessage,
    buddyDismissed,
    setBuddyDismissed,
    soundEnabled,
    playClick,
    playChime,
    playWarning,
    beginnerMode,
    telemetry,
    missionXP,
    badges,
  } = useMission()

  const [expanded, setExpanded] = useState(false)
  const [mood, setMood] = useState<CompanionMood>('idle')
  const [userQuery, setUserQuery] = useState('')
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ sender: 'aero' | 'user'; text: string; time: string }>>([
    {
      sender: 'aero',
      text: "Beep-boop! I'm PIP, your AI planetary exploration companion. Click on me anytime for mission hints, terrain analysis, or plain-English Mars facts!",
      time: '00:01'
    }
  ])
  const [blink, setBlink] = useState(false)
  const [factIndex, setFactIndex] = useState(0)

  // Idle blinking cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 180)
    }, 3800)
    return () => clearInterval(blinkInterval)
  }, [])

  // Sync mood with telemetry anomalies
  useEffect(() => {
    if (telemetry.isAnomaly || telemetry.riskScore > 0.6) {
      setMood('alert')
    } else if (mood === 'alert' && !telemetry.isAnomaly) {
      setMood('idle')
    }
  }, [telemetry.isAnomaly, telemetry.riskScore])

  // React to buddyMessage updates
  useEffect(() => {
    if (buddyMessage) {
      setDialogueHistory(prev => [
        ...prev.slice(-8),
        { sender: 'aero', text: buddyMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ])
      // Trigger temporary happy or thinking mood
      setMood('happy')
      const t = setTimeout(() => setMood('idle'), 4000)
      return () => clearTimeout(t)
    }
  }, [buddyMessage])

  const handleAskQuestion = (q?: string) => {
    const query = (q || userQuery).trim()
    if (!query) return

    playClick()
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { sender: 'user' as const, text: query, time: nowStr }

    // Search knowledge
    const lower = query.toLowerCase()
    const match = MARS_QA_KNOWLEDGE.find(item =>
      item.keywords.some(k => lower.includes(k))
    )

    let reply = ""
    let replyMood: CompanionMood = 'happy'

    if (match) {
      reply = match.answer
      replyMood = match.mood
    } else if (lower.includes('hint') || lower.includes('what should i do')) {
      reply = "Next objective: Drive toward the Western Delta Front or Kodiak Butte! Click on any landmark marker to run a geological scan and retrieve scientific samples."
      replyMood = 'thinking'
    } else if (lower.includes('hazard') || lower.includes('safe') || lower.includes('battery')) {
      reply = `Telemetry check: Rover Battery is at ${telemetry.batteryPct}%, Dust Tau is ${telemetry.dustTau}, and Slope is ${telemetry.slopeDeg}°. Keep away from crater rims steeper than 18°!`
      replyMood = telemetry.riskScore > 0.5 ? 'alert' : 'happy'
    } else if (lower.includes('fact')) {
      reply = FUN_MARS_FACTS[factIndex % FUN_MARS_FACTS.length]
      setFactIndex(i => i + 1)
      replyMood = 'celebrate'
    } else {
      reply = `Fascinating observation! Martian exploration data confirms that ${query} is actively monitored by our multi-layer orbital spectrometers. Try running a terrain scan on the map for high-res telemetry!`
      replyMood = 'thinking'
    }

    setMood(replyMood)
    setDialogueHistory(prev => [...prev.slice(-8), userMsg, { sender: 'aero', text: reply, time: nowStr }])
    setUserQuery('')
  }

  if (buddyDismissed) {
    return (
      <div className="fixed bottom-20 right-4 z-40 pointer-events-auto">
        <button
          onClick={() => {
            playClick()
            setBuddyDismissed(false)
          }}
          className="group relative flex items-center gap-2 rounded-full border border-cyan-400/50 bg-zinc-950/90 px-3.5 py-2 shadow-xl shadow-cyan-950/40 backdrop-blur-md transition hover:scale-105 hover:border-cyan-400"
          title="Summon PIP AI Companion"
        >
          {/* Mini Robot Head Icon */}
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 text-white shadow-inner">
            <Bot className="h-4 w-4 animate-bounce" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="font-mono text-xs font-bold text-cyan-300">PIP Companion</span>
          <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 font-mono text-[9px] text-cyan-400 border border-cyan-800">
            ONLINE
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 pointer-events-auto max-w-[360px] w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={`relative rounded-3xl border p-4 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
          mood === 'alert'
            ? 'border-red-500/70 bg-zinc-950/95 shadow-red-950/50'
            : mood === 'celebrate'
            ? 'border-yellow-400/70 bg-zinc-950/95 shadow-yellow-950/50'
            : 'border-cyan-500/40 bg-zinc-950/90 shadow-cyan-950/40'
        }`}
      >
        {/* Companion Header with Expressive Animated Character */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            {/* Expressive Robot Avatar */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-cyan-500/40 shadow-inner group">
              {/* Antenna with orbital ring */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    mood === 'alert' ? 'bg-red-400 animate-ping' : mood === 'celebrate' ? 'bg-yellow-300 animate-spin' : 'bg-cyan-400 animate-pulse'
                  }`}
                />
                <div className="h-1.5 w-0.5 bg-zinc-500" />
              </div>

              {/* Expressive LED Eyes SVG Visor */}
              <svg className="w-10 h-7" viewBox="0 0 100 70">
                {/* Visor screen background */}
                <rect x="5" y="10" width="90" height="50" rx="15" fill="#090d16" stroke={mood === 'alert' ? '#ef4444' : '#06b6d4'} strokeWidth="2" />

                {/* Left Eye */}
                {blink ? (
                  <line x1="22" y1="35" x2="42" y2="35" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
                ) : mood === 'happy' ? (
                  <path d="M 22 40 Q 32 24 42 40" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
                ) : mood === 'alert' ? (
                  <g>
                    <circle cx="32" cy="35" r="10" fill="#ef4444" />
                    <circle cx="32" cy="35" r="4" fill="#ffffff" />
                  </g>
                ) : mood === 'celebrate' ? (
                  <polygon points="32,25 35,32 42,32 37,37 39,44 32,40 25,44 27,37 22,32 29,32" fill="#fbbf24" />
                ) : mood === 'scanning' ? (
                  <line x1="12" y1="35" x2="48" y2="35" stroke="#00f5ff" strokeWidth="4" className="animate-pulse" />
                ) : (
                  <ellipse cx="32" cy="35" rx="7" ry="9" fill="#00f5ff" />
                )}

                {/* Right Eye */}
                {blink ? (
                  <line x1="58" y1="35" x2="78" y2="35" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
                ) : mood === 'happy' ? (
                  <path d="M 58 40 Q 68 24 78 40" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
                ) : mood === 'alert' ? (
                  <g>
                    <circle cx="68" cy="35" r="10" fill="#ef4444" />
                    <circle cx="68" cy="35" r="4" fill="#ffffff" />
                  </g>
                ) : mood === 'celebrate' ? (
                  <polygon points="68,25 71,32 78,32 73,37 75,44 68,40 61,44 63,37 58,32 65,32" fill="#fbbf24" />
                ) : mood === 'scanning' ? (
                  <line x1="52" y1="35" x2="88" y2="35" stroke="#00f5ff" strokeWidth="4" className="animate-pulse" />
                ) : (
                  <ellipse cx="68" cy="35" rx="7" ry="9" fill="#00f5ff" />
                )}
              </svg>

              {/* Hover exhaust glow */}
              <div className="absolute -bottom-1.5 h-1 w-8 rounded-full bg-cyan-400/60 blur-xs" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold tracking-wider text-white">PIP COMPANION</span>
                <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-800">
                  AI ROVER PAL
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {mood === 'alert'
                  ? '⚠️ Hazard warning active!'
                  : mood === 'celebrate'
                  ? '🎉 Great discovery, explorer!'
                  : mood === 'thinking'
                  ? 'Analyzing telemetry...'
                  : 'Ready to assist your journey.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                playClick()
                setExpanded(!expanded)
              }}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
              title={expanded ? "Compact View" : "Expand Comms Hub"}
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                playClick()
                setBuddyDismissed(true)
              }}
              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
              title="Minimize Companion"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Active Speech Bubble */}
        <div className="mt-3">
          <div className="relative rounded-2xl bg-zinc-900/90 border border-white/10 p-3 shadow-inner">
            <p className="text-xs text-zinc-100 font-sans leading-relaxed">
              {dialogueHistory[dialogueHistory.length - 1]?.text}
            </p>
            <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>EXPLORER XP: {missionXP}</span>
              <span>{dialogueHistory[dialogueHistory.length - 1]?.time}</span>
            </div>
          </div>
        </div>

        {/* Beginner Explainer Pills */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button
            onClick={() => handleAskQuestion('explain this terrain to me like im 5')}
            className="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-[10px] font-mono text-cyan-300 hover:bg-cyan-900/60 transition"
          >
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span>Explain Terrain (ELI5)</span>
          </button>
          <button
            onClick={() => handleAskQuestion('what is smectite clay')}
            className="flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-[10px] font-mono text-purple-300 hover:bg-purple-900/60 transition"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Clay Minerals</span>
          </button>
          <button
            onClick={() => handleAskQuestion('tell me a fun mars fact')}
            className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-1 text-[10px] font-mono text-amber-300 hover:bg-amber-900/60 transition"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Fun Fact</span>
          </button>
          <button
            onClick={() => handleAskQuestion('check rover safety and battery')}
            className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[10px] font-mono text-emerald-300 hover:bg-emerald-900/60 transition"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Rover Health</span>
          </button>
        </div>

        {/* Expanded Dialogue Drawer */}
        {expanded && (
          <div className="mt-3 border-t border-zinc-800 pt-3 animate-in fade-in duration-200">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
              <span>Comms Log</span>
              <span>{dialogueHistory.length} messages</span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 font-sans text-xs scrollbar-thin">
              {dialogueHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`rounded-2xl px-3 py-1.5 max-w-[88%] text-[11px] leading-tight ${
                      item.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none'
                        : 'bg-zinc-800/90 text-zinc-200 rounded-bl-none border border-white/5'
                    }`}
                  >
                    {item.text}
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono mt-0.5">{item.time}</span>
                </div>
              ))}
            </div>

            {/* User Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAskQuestion()
              }}
              className="mt-2.5 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask PIP anything about Mars or this mission..."
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

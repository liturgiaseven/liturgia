import { useState, useEffect, useRef } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

const CHANNEL_NAME = 'liturgia-projection'
const LS_KEY = 'liturgia.proj-state'

function loadInitial() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { type: 'clear' } }
  catch { return { type: 'clear' } }
}

function fmtTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function ProjectionView() {
  const [state, setState] = useState(loadInitial)
  const [showUI, setShowUI] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hideRef = useRef(null)

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.onmessage = (e) => {
      if (e.data && e.data.type !== 'ready') setState(e.data)
    }
    ch.postMessage({ type: 'ready' })
    return () => ch.close()
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  function onMouseMove() {
    setShowUI(true)
    clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => setShowUI(false), 3000)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  const { type } = state

  return (
    <div
      className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative"
      style={{ cursor: showUI ? 'default' : 'none' }}
      onMouseMove={onMouseMove}
    >
      {type === 'clear' && (
        <p className="text-gray-800 text-sm select-none">aguardando conteúdo…</p>
      )}
      {type === 'timer' && <TimerSlide state={state} />}
      {type === 'bible' && <BibleSlide state={state} />}
      {type === 'hymn'  && <HymnSlide  state={state} />}

      <div
        className={`absolute top-4 right-4 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  )
}

function TimerSlide({ state }) {
  const { segmentName, remaining, totalSecs, expired } = state
  const progress = totalSecs > 0 ? remaining / totalSecs : 0
  const timeColor = expired ? 'text-red-400'
    : progress <= 0.25 ? 'text-red-400'
    : progress <= 0.5  ? 'text-yellow-400'
    : 'text-emerald-400'
  const barColor = expired ? 'bg-red-500'
    : progress <= 0.25 ? 'bg-red-500'
    : progress <= 0.5  ? 'bg-yellow-500'
    : 'bg-emerald-500'

  return (
    <div className="flex flex-col items-center gap-6 w-full px-[10%]">
      {segmentName && (
        <p className="text-gray-400 font-semibold uppercase tracking-widest text-center"
           style={{ fontSize: 'clamp(0.9rem, 2vw, 1.5rem)' }}>
          {segmentName}
        </p>
      )}
      <p
        className={`font-mono font-bold tabular-nums ${timeColor} ${expired ? 'animate-pulse' : ''}`}
        style={{ fontSize: 'clamp(5rem, 22vw, 18rem)', lineHeight: 1 }}
      >
        {fmtTime(remaining)}
      </p>
      {expired && (
        <p className="text-red-400 font-bold animate-pulse" style={{ fontSize: 'clamp(1rem, 3vw, 2.5rem)' }}>
          Tempo esgotado!
        </p>
      )}
      <div className="w-full max-w-2xl h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}

function BibleSlide({ state }) {
  const { text, reference } = state
  return (
    <div className="flex flex-col items-center gap-8 px-[10%] w-full">
      <p className="text-white text-center leading-relaxed"
         style={{ fontSize: 'clamp(1.5rem, 4.5vw, 4rem)', fontFamily: 'Georgia, serif' }}>
        "{text}"
      </p>
      <p className="text-amber-400 font-semibold" style={{ fontSize: 'clamp(1rem, 2.2vw, 2rem)' }}>
        {reference}
      </p>
    </div>
  )
}

function HymnSlide({ state }) {
  const { title, number, stanza, stanzaIndex, totalStanzas } = state
  return (
    <div className="flex flex-col items-center gap-8 px-[10%] w-full">
      <p className="text-gray-500 font-semibold uppercase tracking-widest text-center"
         style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.2rem)' }}>
        {number ? `Nº ${number} · ` : ''}{title}
        {totalStanzas > 1 && ` · ${stanzaIndex + 1}/${totalStanzas}`}
      </p>
      <p className="text-white text-center leading-relaxed whitespace-pre-line"
         style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)', fontFamily: 'Georgia, serif' }}>
        {stanza}
      </p>
    </div>
  )
}

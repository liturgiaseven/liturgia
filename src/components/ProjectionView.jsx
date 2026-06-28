import { useState, useEffect, useRef } from 'react'
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useChurchLogo } from '../hooks/useChurchLogo'

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
  const [started, setStarted] = useState(false)
  const channelRef = useRef(null)
  const { logoUrl } = useChurchLogo()
  const hideRef = useRef(null)

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = ch
    ch.onmessage = (e) => {
      if (e.data && e.data.type !== 'ready') setState(e.data)
    }
    ch.postMessage({ type: 'ready' })
    return () => { ch.close(); channelRef.current = null }
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  function handleStart() {
    document.documentElement.requestFullscreen?.().catch(() => {})
    setStarted(true)
  }

  function onMouseMove() {
    setShowUI(true)
    clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => setShowUI(false), 3000)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  function sendNav(dir) {
    channelRef.current?.postMessage({ type: 'nav', direction: dir })
  }

  // Fullscreen entry screen
  if (!started) {
    return (
      <div
        className="w-screen h-screen bg-black flex flex-col items-center justify-center gap-6 cursor-pointer select-none"
        onClick={handleStart}
      >
        <Maximize2 className="w-16 h-16 text-white/20" />
        <p className="text-white/40 text-lg font-semibold">Clique para abrir em tela cheia</p>
        <p className="text-white/20 text-sm">Arraste esta janela para o monitor do telão primeiro</p>
      </div>
    )
  }

  const { type } = state

  return (
    <div
      className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative"
      style={{ cursor: showUI ? 'default' : 'none' }}
      onMouseMove={onMouseMove}
    >
      {type === 'clear' && (
        <div className="flex flex-col items-center justify-center gap-6 select-none">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo da Igreja"
              className="max-w-[40vw] max-h-[40vh] object-contain drop-shadow-2xl"
            />
          ) : (
            <p className="text-gray-800 text-sm">aguardando conteúdo…</p>
          )}
        </div>
      )}
      {type === 'timer' && <TimerSlide state={state} />}
      {type === 'bible' && <BibleSlide state={state} onNav={sendNav} showUI={showUI} />}
      {type === 'hymn'  && <HymnSlide  state={state} onNav={sendNav} showUI={showUI} />}
      {type === 'slides' && <SlidesSlide state={state} onNav={sendNav} showUI={showUI} />}

      {/* Logo watermark em apresentações ativas */}
      {type !== 'clear' && type !== 'slides' && logoUrl && (
        <div className="absolute bottom-4 right-6 pointer-events-none select-none">
          <img
            src={logoUrl}
            alt=""
            className="h-10 object-contain opacity-20"
          />
        </div>
      )}

      {/* Fullscreen toggle */}
      <div className={`absolute top-4 right-4 transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
        <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
             style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}

function SlidesSlide({ state, onNav, showUI }) {
  const { url, page } = state
  const src = `${url}#page=${page || 1}&toolbar=0&navpanes=0&view=Fit`
  return (
    <div className="absolute inset-0 bg-black">
      <iframe
        key={page}
        src={src}
        title="Slides"
        className="w-full h-full border-0"
      />
      {/* Nav arrows */}
      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => onNav(-1)}
          className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
          title="Slide anterior"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <button
          onClick={() => onNav(1)}
          className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
          title="Próximo slide"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}

function BibleSlide({ state, onNav, showUI }) {
  const { text, reference } = state
  return (
    <div className="flex flex-col items-center gap-8 px-[12%] w-full">
      <p className="text-white text-center leading-relaxed"
         style={{ fontSize: 'clamp(1.5rem, 4.5vw, 4rem)', fontFamily: 'Georgia, serif' }}>
        "{text}"
      </p>
      <p className="text-amber-400 font-semibold" style={{ fontSize: 'clamp(1rem, 2.2vw, 2rem)' }}>
        {reference}
      </p>

      {/* Nav arrows */}
      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => onNav(-1)}
          className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
          title="Versículo anterior"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
        <button
          onClick={() => onNav(1)}
          className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
          title="Próximo versículo"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}

function HymnSlide({ state, onNav, showUI }) {
  const { title, number, stanza, stanzaIndex, totalStanzas } = state
  return (
    <div className="flex flex-col items-center gap-8 px-[12%] w-full">
      <p className="text-gray-500 font-semibold uppercase tracking-widest text-center"
         style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.2rem)' }}>
        {number ? `Nº ${number} · ` : ''}{title}
        {totalStanzas > 1 && ` · ${stanzaIndex + 1}/${totalStanzas}`}
      </p>
      <p className="text-white text-center leading-relaxed whitespace-pre-line"
         style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)', fontFamily: 'Georgia, serif' }}>
        {stanza}
      </p>

      {/* Nav arrows (shown on hover) */}
      {totalStanzas > 1 && (
        <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none transition-opacity duration-500 ${showUI ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onNav(-1)}
            disabled={stanzaIndex === 0}
            className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            title="Estrofe anterior"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={() => onNav(1)}
            disabled={stanzaIndex === totalStanzas - 1}
            className="pointer-events-auto p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            title="Próxima estrofe"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Youtube, ExternalLink, Trash2, Clock, Play, X } from 'lucide-react'

const LS_KEY = 'liturgia.youtube.v1'
const MAX_HISTORY = 20

function loadHistory(segmentId) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY)) || {}
    return all[segmentId] || []
  } catch { return [] }
}

function saveHistory(segmentId, list) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY)) || {}
    all[segmentId] = list.slice(0, MAX_HISTORY)
    localStorage.setItem(LS_KEY, JSON.stringify(all))
  } catch { /* ignora */ }
}

function extractVideoId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pat of patterns) {
    const m = url.match(pat)
    if (m) return m[1]
  }
  return null
}

function thumbUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function YoutubeField({ segmentId }) {
  const [history, setHistory] = useState(() => loadHistory(segmentId))
  const [input, setInput] = useState('')
  const [label, setLabel] = useState('')
  const [activeId, setActiveId] = useState(null) // videoId atualmente carregado
  const [showHistory, setShowHistory] = useState(false)
  const [labelMode, setLabelMode] = useState(false)

  // Reseta ao trocar de segmento
  useEffect(() => {
    const h = loadHistory(segmentId)
    setHistory(h)
    setInput('')
    setLabel('')
    setActiveId(null)
    setShowHistory(false)
    setLabelMode(false)
  }, [segmentId])

  function handleLoad(url, lbl) {
    const vid = extractVideoId(url)
    if (!vid) return
    setActiveId(vid)

    // Salva no histórico (remove duplicata, coloca no topo)
    const entry = { url, label: lbl || '', videoId: vid, usedAt: new Date().toISOString() }
    const next = [entry, ...history.filter(h => h.videoId !== vid)]
    setHistory(next)
    saveHistory(segmentId, next)

    setInput('')
    setLabel('')
    setLabelMode(false)
    setShowHistory(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    if (!extractVideoId(input)) {
      alert('URL do YouTube inválida. Formatos aceitos:\nyoutube.com/watch?v=…  |  youtu.be/…  |  youtube.com/shorts/…')
      return
    }
    handleLoad(input.trim(), label.trim())
  }

  function removeFromHistory(videoId) {
    const next = history.filter(h => h.videoId !== videoId)
    setHistory(next)
    saveHistory(segmentId, next)
    if (activeId === videoId) setActiveId(null)
  }

  function openExternal() {
    if (activeId) window.open(`https://www.youtube.com/watch?v=${activeId}`, '_blank', 'noopener')
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" />
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Vídeo YouTube</span>
        </div>
        <div className="flex items-center gap-2">
          {activeId && (
            <button
              onClick={openExternal}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir
            </button>
          )}
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(h => !h)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                showHistory ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Histórico ({history.length})
            </button>
          )}
        </div>
      </div>

      {/* Player */}
      {activeId ? (
        <div className="relative">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              key={activeId}
              src={`https://www.youtube.com/embed/${activeId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              title="YouTube player"
            />
          </div>
          <button
            onClick={() => setActiveId(null)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10"
            title="Fechar vídeo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Input form */
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setLabelMode(false) }}
              placeholder="Cole o link do YouTube…"
              className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" /> Carregar
            </button>
          </div>
          {input && extractVideoId(input) && (
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Título / descrição (opcional)"
              className="bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
            />
          )}
        </form>
      )}

      {/* Histórico — modal centralizado (não corta, independe da posição do card) */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-base font-bold text-white">Histórico de links</h3>
                <span className="text-xs text-gray-500">({history.length})</span>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-2">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Nenhum link usado ainda.</p>
              ) : (
                history.map(entry => (
                  <div
                    key={entry.videoId + entry.usedAt}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition-all ${
                      activeId === entry.videoId
                        ? 'border-red-600 bg-red-950/30'
                        : 'border-gray-700 hover:border-gray-500 bg-gray-950/50 hover:bg-gray-800'
                    }`}
                    onClick={() => { setActiveId(entry.videoId); setShowHistory(false) }}
                  >
                    <img
                      src={thumbUrl(entry.videoId)}
                      alt=""
                      onError={e => { e.currentTarget.style.visibility = 'hidden' }}
                      className="w-20 h-12 rounded-lg object-cover shrink-0 bg-gray-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate">{entry.label || entry.url}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {entry.label ? entry.url : formatDate(entry.usedAt)}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeFromHistory(entry.videoId) }}
                      className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-colors"
                      title="Remover do histórico"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Music2, X, Pencil, Check, Plus, Trash2, Maximize2 } from 'lucide-react'
import { HYMNS, HYMN_CATEGORIES } from '../data/hymns'

const LS_KEY = 'liturgia.hymns.v1'

// Carrega overrides/letras customizadas do localStorage
function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {}
  } catch {
    return {}
  }
}
function saveStore(store) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store))
  } catch {
    /* ignora quota/privado */
  }
}

export default function HymnPanel({ category, accent }) {
  const [store, setStore] = useState(loadStore)
  const [openId, setOpenId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    // Fecha modal ao trocar de categoria/segmento
    setOpenId(null)
    setEditing(false)
    setFullscreen(false)
  }, [category])

  if (!category) return null

  const base = HYMNS[category] || []
  const custom = store.__custom?.[category] || []
  const hymns = [...base, ...custom]

  // letra efetiva = override salvo ?? letra original
  const lyricsOf = (h) => store[h.id] ?? h.lyrics ?? ''

  const openHymn = hymns.find((h) => h.id === openId)

  function openModal(h) {
    setOpenId(h.id)
    setEditing(false)
    setDraft(lyricsOf(h))
  }

  function startEdit() {
    setDraft(lyricsOf(openHymn))
    setEditing(true)
  }

  function saveEdit() {
    const next = { ...store, [openId]: draft }
    setStore(next)
    saveStore(next)
    setEditing(false)
  }

  function addCustomHymn() {
    const title = window.prompt('Título do hino:')
    if (!title) return
    const id = 'custom-' + Date.now()
    const next = {
      ...store,
      __custom: {
        ...(store.__custom || {}),
        [category]: [...(store.__custom?.[category] || []), { id, title, number: null, lyrics: '' }],
      },
    }
    setStore(next)
    saveStore(next)
    setOpenId(id)
    setDraft('')
    setEditing(true)
  }

  function removeCustom(id) {
    const list = (store.__custom?.[category] || []).filter((h) => h.id !== id)
    const next = {
      ...store,
      __custom: { ...(store.__custom || {}), [category]: list },
    }
    delete next[id]
    setStore(next)
    saveStore(next)
    if (openId === id) setOpenId(null)
  }

  const isCustom = (id) => id?.startsWith('custom-')

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music2 className={`w-4 h-4 ${accent}`} />
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Hinos Sugeridos — {HYMN_CATEGORIES[category]}
          </span>
        </div>
        <button
          onClick={addCustomHymn}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors"
          title="Adicionar hino"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {hymns.map((h) => {
          const hasLyrics = (store[h.id] ?? h.lyrics)?.trim()
          return (
            <button
              key={h.id}
              onClick={() => openModal(h)}
              className="group flex items-center gap-2 text-left rounded-xl border border-gray-700 bg-gray-950/50 px-3 py-2.5 hover:border-gray-600 hover:bg-gray-800 transition-colors"
            >
              {h.number && (
                <span className="shrink-0 w-9 text-center text-xs font-mono font-bold text-gray-500 bg-gray-800 rounded px-1 py-0.5">
                  {h.number}
                </span>
              )}
              <span className="flex-1 text-sm text-gray-200 truncate">{h.title}</span>
              <span
                className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${
                  hasLyrics
                    ? 'bg-emerald-900/50 text-emerald-300'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {hasLyrics ? 'letra' : 'sem letra'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Modal de letra */}
      {openHymn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => { setOpenId(null); setEditing(false); setFullscreen(false) }}
        >
          <div
            className={`bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col ${
              fullscreen ? 'w-full h-full' : 'w-full max-w-2xl max-h-[85vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2 min-w-0">
                {openHymn.number && (
                  <span className="text-sm font-mono font-bold text-gray-500 bg-gray-800 rounded px-2 py-0.5">
                    {openHymn.number}
                  </span>
                )}
                <h3 className="text-lg font-bold text-white truncate">{openHymn.title}</h3>
              </div>
              <div className="flex items-center gap-1">
                {!editing && (
                  <>
                    <button
                      onClick={() => setFullscreen((f) => !f)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      title="Tela cheia (projeção)"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={startEdit}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                      title="Editar letra"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {isCustom(openHymn.id) && (
                      <button
                        onClick={() => removeCustom(openHymn.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
                        title="Remover hino"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                {editing && (
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                  >
                    <Check className="w-4 h-4" /> Salvar
                  </button>
                )}
                <button
                  onClick={() => { setOpenId(null); setEditing(false); setFullscreen(false) }}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corpo: letra ou editor */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
              {editing ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  placeholder="Cole ou digite a letra do hino aqui (uma estrofe por bloco, linhas em branco separam estrofes)…"
                  className="w-full h-80 bg-gray-950 border border-gray-700 rounded-xl p-4 text-gray-100 text-sm leading-relaxed focus:outline-none focus:border-blue-500 resize-none scrollbar-thin"
                />
              ) : lyricsOf(openHymn)?.trim() ? (
                <pre
                  className={`whitespace-pre-wrap font-sans text-gray-100 leading-relaxed text-center ${
                    fullscreen ? 'text-3xl leading-loose' : 'text-lg'
                  }`}
                >
                  {lyricsOf(openHymn)}
                </pre>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <Music2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Este hino ainda não tem letra cadastrada.</p>
                  <button
                    onClick={startEdit}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Adicionar letra
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

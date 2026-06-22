import { useState, useEffect, useRef } from 'react'
import { Music2, X, Pencil, Check, Plus, Trash2, Tv, ChevronLeft, ChevronRight } from 'lucide-react'
import { HYMNS, HYMN_CATEGORIES } from '../data/hymns'
import { openProjectionWindow, sendToProjection, clearProjection, registerNavHandler, unregisterNavHandler } from '../utils/projection'

const LS_KEY = 'liturgia.hymns.v1'

function loadStore() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {} }
  catch { return {} }
}
function saveStore(store) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)) } catch {}
}

// Split lyrics into stanzas.
// If double newlines exist, use them. Otherwise group every 4 non-empty lines.
function parseStanzas(lyrics) {
  if (!lyrics?.trim()) return []
  if (/\n[ \t]*\n/.test(lyrics)) {
    return lyrics.split(/\n[ \t]*\n/).map((s) => s.trim()).filter(Boolean)
  }
  const lines = lyrics.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return []
  const stanzas = []
  for (let i = 0; i < lines.length; i += 4) {
    stanzas.push(lines.slice(i, i + 4).join('\n'))
  }
  return stanzas
}

export default function HymnPanel({ category, accent }) {
  const [store, setStore] = useState(loadStore)
  const [openId, setOpenId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [stanzaIdx, setStanzaIdx] = useState(0)
  const [projActive, setProjActive] = useState(false)

  // Keep a ref to stanzas length for nav handler closure
  const stanzasRef = useRef([])

  useEffect(() => {
    setOpenId(null)
    setEditing(false)
    setProjActive(false)
  }, [category])

  // Stop projecting when modal closes
  useEffect(() => {
    if (!openId && projActive) {
      setProjActive(false)
      clearProjection()
      unregisterNavHandler()
    }
  }, [openId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Register/unregister nav handler when projActive changes
  useEffect(() => {
    if (!projActive) { unregisterNavHandler(); return }
    registerNavHandler((dir) => {
      setStanzaIdx((i) => Math.max(0, Math.min(stanzasRef.current.length - 1, i + dir)))
    })
    return () => unregisterNavHandler()
  }, [projActive])

  // Keyboard nav when projActive
  useEffect(() => {
    if (!projActive) return
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setStanzaIdx((i) => Math.min(stanzasRef.current.length - 1, i + 1))
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setStanzaIdx((i) => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [projActive])

  if (!category) return null

  const base = HYMNS[category] || []
  const custom = store.__custom?.[category] || []
  const hymns = [...base, ...custom]

  const lyricsOf = (h) => store[h.id] ?? h.lyrics ?? ''

  const openHymn = hymns.find((h) => h.id === openId)
  const stanzas = openHymn ? parseStanzas(lyricsOf(openHymn)) : []
  stanzasRef.current = stanzas
  const currentStanza = stanzas[stanzaIdx] ?? ''

  // Broadcast when stanza or projActive changes
  useEffect(() => {
    if (!projActive || !openHymn || !currentStanza) return
    sendToProjection({
      type: 'hymn',
      title: openHymn.title,
      number: openHymn.number ?? null,
      stanza: currentStanza,
      stanzaIndex: stanzaIdx,
      totalStanzas: stanzas.length,
    })
  }, [projActive, stanzaIdx, openId]) // eslint-disable-line react-hooks/exhaustive-deps

  function openModal(h) {
    setOpenId(h.id)
    setEditing(false)
    setDraft(lyricsOf(h))
    setStanzaIdx(0)
    setProjActive(false)
  }

  function closeModal() {
    setOpenId(null)
    setEditing(false)
    if (projActive) { clearProjection(); setProjActive(false); unregisterNavHandler() }
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
    setStanzaIdx(0)
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
    setStanzaIdx(0)
  }

  function removeCustom(id) {
    const list = (store.__custom?.[category] || []).filter((h) => h.id !== id)
    const next = { ...store, __custom: { ...(store.__custom || {}), [category]: list } }
    delete next[id]
    setStore(next)
    saveStore(next)
    if (openId === id) closeModal()
  }

  function handleProject() {
    if (projActive) {
      setProjActive(false)
      clearProjection()
      unregisterNavHandler()
    } else {
      openProjectionWindow()
      setProjActive(true)
    }
  }

  function goStanza(dir) {
    setStanzaIdx((i) => Math.max(0, Math.min(stanzas.length - 1, i + dir)))
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
              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${hasLyrics ? 'bg-emerald-900/50 text-emerald-300' : 'bg-gray-800 text-gray-500'}`}>
                {hasLyrics ? 'letra' : 'sem letra'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Modal de letra */}
      {openHymn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeModal}>
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2 min-w-0">
                {openHymn.number && (
                  <span className="text-sm font-mono font-bold text-gray-500 bg-gray-800 rounded px-2 py-0.5">
                    {openHymn.number}
                  </span>
                )}
                <h3 className="text-lg font-bold text-white truncate">{openHymn.title}</h3>
                {projActive && (
                  <span className="text-xs text-amber-400 font-semibold animate-pulse shrink-0">● Projetando</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!editing && (
                  <>
                    <button onClick={startEdit} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Editar letra">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {isCustom(openHymn.id) && (
                      <button onClick={() => removeCustom(openHymn.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors" title="Remover hino">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
                {editing && (
                  <button onClick={saveEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
                    <Check className="w-4 h-4" /> Salvar
                  </button>
                )}
                <button onClick={closeModal} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Fechar">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corpo */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
              {editing ? (
                <>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                    placeholder="Cole ou digite a letra. Separe estrofes com uma linha em branco (Enter duplo). Se não houver, as linhas serão agrupadas de 4 em 4 automaticamente."
                    className="w-full h-72 bg-gray-950 border border-gray-700 rounded-xl p-4 text-gray-100 text-sm leading-relaxed focus:outline-none focus:border-blue-500 resize-none scrollbar-thin"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Dica: deixe uma linha em branco entre as estrofes para controlar a divisão.
                  </p>
                </>
              ) : stanzas.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  {/* Slide da estrofe atual */}
                  <div className="w-full min-h-[10rem] flex items-center justify-center bg-gray-950 rounded-xl border border-gray-800 p-6">
                    <pre className="whitespace-pre-wrap font-sans text-gray-100 text-xl leading-loose text-center">
                      {currentStanza}
                    </pre>
                  </div>
                  {/* Navegação entre estrofes */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => goStanza(-1)}
                      disabled={stanzaIdx === 0}
                      className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Estrofe anterior (←)"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-400 min-w-[5rem] text-center">
                      {stanzaIdx + 1} / {stanzas.length}
                    </span>
                    <button
                      onClick={() => goStanza(1)}
                      disabled={stanzaIdx === stanzas.length - 1}
                      className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Próxima estrofe (→)"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
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

            {/* Rodapé */}
            {!editing && stanzas.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-800 flex justify-end">
                <button
                  onClick={handleProject}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                    projActive
                      ? 'bg-amber-700 hover:bg-amber-600 text-white'
                      : 'bg-purple-700 hover:bg-purple-600 text-white'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  {projActive ? 'Parar projeção' : 'Projetar no telão'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

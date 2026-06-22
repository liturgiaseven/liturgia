import { useState, useEffect, useRef, useCallback } from 'react'
import { BookMarked, X, Search, Loader2, Tv, ChevronLeft, ChevronRight } from 'lucide-react'
import { loadBible, parseReference, BIBLE_VERSION } from '../data/bible'
import { openProjectionWindow, sendToProjection, clearProjection, registerNavHandler, unregisterNavHandler } from '../utils/projection'

export default function BiblePanel({ open, onClose }) {
  const [books, setBooks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [bookIndex, setBookIndex] = useState(42)
  const [chapter, setChapter] = useState(0)
  const [selStart, setSelStart] = useState(null)
  const [selEnd, setSelEnd] = useState(null)
  const [refInput, setRefInput] = useState('')
  const [projActive, setProjActive] = useState(false)

  const versesRef = useRef(null)

  useEffect(() => {
    if (!open || books) return
    setLoading(true)
    setError(null)
    loadBible()
      .then((data) => setBooks(data))
      .catch(() => setError('Não foi possível carregar a Bíblia. Verifique a conexão e recarregue.'))
      .finally(() => setLoading(false))
  }, [open, books])

  // Stop projecting when panel closes
  useEffect(() => {
    if (!open && projActive) {
      setProjActive(false)
      clearProjection()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const book = books?.[bookIndex]
  const chapterVerses = book?.chapters?.[chapter] || []

  const reference = book
    ? `${book.name} ${chapter + 1}:${(selStart ?? 0) + 1}${selEnd != null && selEnd !== selStart ? '-' + (selEnd + 1) : ''}`
    : ''

  const projText = (() => {
    if (selStart == null) return ''
    const a = Math.min(selStart, selEnd ?? selStart)
    const b = Math.max(selStart, selEnd ?? selStart)
    return chapterVerses.slice(a, b + 1).join(' ')
  })()

  // Broadcast when verse or projActive changes
  useEffect(() => {
    if (!projActive || selStart == null || !projText) return
    sendToProjection({ type: 'bible', text: projText, reference })
  }, [projActive, projText, reference]) // eslint-disable-line react-hooks/exhaustive-deps

  const moveVerse = useCallback((dir) => {
    if (!book || selStart == null) return
    let bi = bookIndex, ch = chapter, v = (selStart ?? 0) + dir
    const getChap = (b, c) => books[b].chapters[c]
    if (v < 0) {
      ch -= 1
      if (ch < 0) { bi = (bi - 1 + books.length) % books.length; ch = books[bi].chapters.length - 1 }
      v = getChap(bi, ch).length - 1
    } else if (v >= getChap(bi, ch).length) {
      ch += 1
      if (ch >= books[bi].chapters.length) { bi = (bi + 1) % books.length; ch = 0 }
      v = 0
    }
    setBookIndex(bi); setChapter(ch); setSelStart(v); setSelEnd(v)
  }, [book, bookIndex, chapter, selStart, books])

  // Register nav handler so projection window buttons also advance verses
  useEffect(() => {
    if (!projActive) { unregisterNavHandler(); return }
    registerNavHandler((dir) => moveVerse(dir))
    return () => unregisterNavHandler()
  }, [projActive, moveVerse])

  // Keyboard nav when projecting
  useEffect(() => {
    if (!projActive) return
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); moveVerse(1) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveVerse(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [projActive, moveVerse])

  function applyReference(text) {
    if (!books) return
    const parsed = parseReference(books, text)
    if (!parsed) {
      setError('Referência não encontrada. Ex.: João 3:16  ·  Sl 23  ·  1 Co 13:4-7')
      return
    }
    setError(null)
    setBookIndex(parsed.book.index)
    setChapter(parsed.chapter)
    setSelStart(parsed.verseStart)
    setSelEnd(parsed.verseEnd ?? parsed.verseStart)
    setTimeout(() => {
      const el = versesRef.current?.querySelector(`[data-v="${parsed.verseStart}"]`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 50)
  }

  function selectVerse(i) {
    setSelStart(i)
    setSelEnd(i)
  }

  function handleProject() {
    if (projActive) {
      setProjActive(false)
      clearProjection()
    } else {
      openProjectionWindow()
      setProjActive(true)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Bíblia</h3>
              <p className="text-[11px] text-gray-500">{BIBLE_VERSION}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {projActive && (
              <span className="text-xs text-amber-400 font-semibold animate-pulse">● Projetando</span>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Carregando a Bíblia…</span>
          </div>
        ) : error && !books ? (
          <div className="flex-1 flex items-center justify-center py-20 text-center text-gray-400 px-6">
            <p className="text-sm">{error}</p>
          </div>
        ) : books ? (
          <>
            {/* Busca por referência */}
            <div className="px-5 py-3 border-b border-gray-800 flex flex-col gap-2">
              <form
                onSubmit={(e) => { e.preventDefault(); applyReference(refInput) }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                    placeholder="Digite a referência: João 3:16  ·  Sl 23  ·  1 Co 13:4-7"
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors">
                  Buscar
                </button>
              </form>

              <div className="flex gap-2">
                <select
                  value={bookIndex}
                  onChange={(e) => { setBookIndex(Number(e.target.value)); setChapter(0); setSelStart(null); setSelEnd(null) }}
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {books.map((b) => (
                    <option key={b.abbrev} value={b.index}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={chapter}
                  onChange={(e) => { setChapter(Number(e.target.value)); setSelStart(null); setSelEnd(null) }}
                  className="w-32 bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {book.chapters.map((_, i) => (
                    <option key={i} value={i}>Cap. {i + 1}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            {/* Versículos */}
            <div ref={versesRef} className="flex-1 overflow-y-auto scrollbar-thin px-5 py-3">
              {chapterVerses.map((v, i) => {
                const a = Math.min(selStart ?? -1, selEnd ?? selStart ?? -1)
                const b = Math.max(selStart ?? -1, selEnd ?? selStart ?? -1)
                const selected = selStart != null && i >= a && i <= b
                return (
                  <button
                    key={i}
                    data-v={i}
                    onClick={() => selectVerse(i)}
                    className={`block w-full text-left rounded-lg px-3 py-2 mb-1 transition-colors ${
                      selected ? 'bg-amber-600/20 border border-amber-600/50' : 'border border-transparent hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-amber-500 font-bold text-xs mr-2 align-top">{i + 1}</span>
                    <span className="text-gray-200 text-sm leading-relaxed">{v}</span>
                  </button>
                )
              })}
            </div>

            {/* Rodapé */}
            <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveVerse(-1)}
                  disabled={selStart == null}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Versículo anterior (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 truncate min-w-0">
                  {selStart != null
                    ? <><span className="text-amber-400 font-semibold">{reference}</span></>
                    : 'Selecione um versículo'}
                </span>
                <button
                  onClick={() => moveVerse(1)}
                  disabled={selStart == null}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Próximo versículo (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleProject}
                disabled={selStart == null}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${
                  projActive
                    ? 'bg-amber-700 hover:bg-amber-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                {projActive ? 'Parar projeção' : 'Projetar no telão'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

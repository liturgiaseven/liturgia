import { useState, useEffect, useRef, useCallback } from 'react'
import { BookMarked, X, Search, Maximize2, ChevronLeft, ChevronRight, Loader2, Tv } from 'lucide-react'
import { loadBible, parseReference, BIBLE_VERSION } from '../data/bible'

export default function BiblePanel({ open, onClose }) {
  const [books, setBooks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [bookIndex, setBookIndex] = useState(42) // João por padrão
  const [chapter, setChapter] = useState(0)
  const [selStart, setSelStart] = useState(null)
  const [selEnd, setSelEnd] = useState(null)
  const [refInput, setRefInput] = useState('')

  const [projecting, setProjecting] = useState(false)
  const projRef = useRef(null)
  const versesRef = useRef(null)

  // Carrega a Bíblia ao abrir
  useEffect(() => {
    if (!open || books) return
    setLoading(true)
    setError(null)
    loadBible()
      .then((data) => setBooks(data))
      .catch(() => setError('Não foi possível carregar a Bíblia. Verifique a conexão e recarregue.'))
      .finally(() => setLoading(false))
  }, [open, books])

  const book = books?.[bookIndex]
  const chapterVerses = book?.chapters?.[chapter] || []

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
    // rola até o versículo
    setTimeout(() => {
      const el = versesRef.current?.querySelector(`[data-v="${parsed.verseStart}"]`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 50)
  }

  function selectVerse(i) {
    setSelStart(i)
    setSelEnd(i)
  }

  // ----- Projeção -----
  const reference = book ? `${book.name} ${chapter + 1}:${(selStart ?? 0) + 1}${selEnd != null && selEnd !== selStart ? '-' + (selEnd + 1) : ''}` : ''

  const projText = (() => {
    if (selStart == null) return ''
    const a = Math.min(selStart, selEnd ?? selStart)
    const b = Math.max(selStart, selEnd ?? selStart)
    return chapterVerses.slice(a, b + 1).join(' ')
  })()

  // Navegação versículo a versículo (atravessa capítulos/livros)
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

  useEffect(() => {
    if (!projecting) return
    function onKey(e) {
      if (e.key === 'Escape') { if (document.fullscreenElement) document.exitFullscreen?.(); setProjecting(false) }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); moveVerse(1) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveVerse(-1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [projecting, moveVerse])

  function toggleFullscreen() {
    const el = projRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.()
    else document.exitFullscreen?.()
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
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
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

              {/* Seletores livro/capítulo */}
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

            {/* Versículos do capítulo */}
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

            {/* Rodapé: projetar */}
            <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-400 truncate">
                {selStart != null ? <><span className="text-amber-400 font-semibold">{reference}</span> selecionado</> : 'Selecione um versículo'}
              </span>
              <button
                onClick={() => selStart != null && setProjecting(true)}
                disabled={selStart == null}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Tv className="w-4 h-4" /> Projetar no telão
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Projeção / telão */}
      {projecting && (
        <div
          ref={projRef}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-[8%] py-12"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white text-center font-serif leading-relaxed"
             style={{ fontSize: 'clamp(1.5rem, 4.5vw, 4rem)' }}>
            "{projText}"
          </p>
          <p className="mt-10 text-amber-400 font-semibold" style={{ fontSize: 'clamp(1rem, 2.2vw, 2rem)' }}>
            {reference}
          </p>
          <p className="mt-2 text-gray-500 text-sm">{BIBLE_VERSION}</p>

          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={toggleFullscreen} className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors" title="Tela cheia">
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => { if (document.fullscreenElement) document.exitFullscreen?.(); setProjecting(false) }}
              className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button onClick={() => moveVerse(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors" title="Anterior (←)">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => moveVerse(1)} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors" title="Próximo (→)">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}

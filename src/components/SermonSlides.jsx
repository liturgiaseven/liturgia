import { useState, useEffect } from 'react'
import { Presentation, Upload, Tv, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useRef } from 'react'
import {
  loadAllSermonSlides,
  uploadSermonSlides,
  removeSermonSlides,
} from '../lib/sermonSlides'
import {
  openProjectionWindow,
  sendToProjection,
  clearProjection,
  registerNavHandler,
  unregisterNavHandler,
} from '../utils/projection'

export default function SermonSlides({ slideKey, accent }) {
  const [slides, setSlides] = useState(null) // { url, filename } | null
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [projActive, setProjActive] = useState(false)
  const fileRef = useRef(null)

  // On mount / key change: load this segment's slides from cloud
  useEffect(() => {
    let active = true
    setSlides(null)
    setPage(1)
    loadAllSermonSlides().then((all) => {
      if (active) setSlides(all[slideKey] || null)
    })
    return () => { active = false }
  }, [slideKey])

  // Stop projecting when unmounting or switching segment
  useEffect(() => {
    return () => {
      if (projActive) { clearProjection(); unregisterNavHandler() }
    }
  }, [projActive])

  // Broadcast page changes while projecting
  useEffect(() => {
    if (projActive && slides) {
      sendToProjection({ type: 'slides', url: slides.url, page })
    }
  }, [page, projActive, slides])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadSermonSlides(slideKey, file)
      setSlides(result)
      setPage(1)
    } catch (err) {
      alert('Erro ao enviar PDF: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRemove() {
    if (!window.confirm('Remover os slides deste segmento?')) return
    if (projActive) { clearProjection(); setProjActive(false); unregisterNavHandler() }
    await removeSermonSlides(slideKey)
    setSlides(null)
  }

  function toggleProject() {
    if (projActive) {
      setProjActive(false)
      clearProjection()
      unregisterNavHandler()
    } else {
      openProjectionWindow()
      setProjActive(true)
      registerNavHandler((dir) => setPage((p) => Math.max(1, p + dir)))
      sendToProjection({ type: 'slides', url: slides.url, page })
    }
  }

  const viewerSrc = slides ? `${slides.url}#page=${page}&toolbar=0&navpanes=0&view=FitH` : null

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Presentation className={`w-4 h-4 ${accent}`} />
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            Slides do Pregador (PDF)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {slides && (
            <>
              <button
                onClick={toggleProject}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                  projActive
                    ? 'bg-amber-700 hover:bg-amber-600 text-white'
                    : 'bg-purple-700 hover:bg-purple-600 text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                {projActive ? 'Parar projeção' : 'Projetar no telão'}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                title="Trocar PDF"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                onClick={handleRemove}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                title="Remover slides"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleUpload}
      />

      {!slides ? (
        <div className="text-center text-gray-500 py-10">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            Nenhum slide carregado. Exporte a apresentação (PowerPoint ou Canva)
            como <span className="text-gray-300 font-semibold">PDF</span> e carregue aqui.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Enviando…' : 'Carregar PDF'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projActive && (
            <span className="text-xs text-amber-400 font-semibold animate-pulse">● Projetando no telão</span>
          )}
          {/* Pré-visualização */}
          <div className="w-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden" style={{ height: '420px' }}>
            <iframe
              key={page}
              src={viewerSrc}
              title="Slides do pregador"
              className="w-full h-full"
            />
          </div>
          {/* Navegação de páginas */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Slide anterior (←)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400 min-w-[6rem] text-center">
              Slide {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Próximo slide (→)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-600 text-center truncate">{slides.filename}</p>
        </div>
      )}
    </div>
  )
}

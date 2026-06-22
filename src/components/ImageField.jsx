import { useState, useEffect, useCallback, useRef } from 'react'
import { Image as ImageIcon, Upload, Trash2, Maximize2, X, ChevronLeft, ChevronRight, QrCode } from 'lucide-react'

const LS_KEY = 'liturgia.images.v1'
const MAX_DIM = 1600 // redimensiona para no máx. 1600px no maior lado

function loadImages(segmentId) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY)) || {}
    return all[segmentId] || []
  } catch { return [] }
}

function saveImages(segmentId, list) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
  all[segmentId] = list
  localStorage.setItem(LS_KEY, JSON.stringify(all))
}

// Redimensiona/comprime a imagem antes de salvar (evita estourar o localStorage).
// PNG é preservado (importante para QR Code permanecer nítido); fotos viram JPEG.
function processFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        const scale = Math.min(1, MAX_DIM / Math.max(width, height))
        width = Math.round(width * scale)
        height = Math.round(height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const isPng = file.type === 'image/png'
        const dataUrl = isPng
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.9)
        resolve(dataUrl)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ImageField({ segmentId, title, accent }) {
  const [images, setImages] = useState(() => loadImages(segmentId))
  const [viewerIdx, setViewerIdx] = useState(null) // índice em projeção
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    setImages(loadImages(segmentId))
    setViewerIdx(null)
  }, [segmentId])

  const persist = useCallback((list) => {
    setImages(list)
    try {
      saveImages(segmentId, list)
    } catch {
      alert('Não foi possível salvar a imagem: o armazenamento do navegador está cheio. Remova imagens antigas e tente novamente.')
    }
  }, [segmentId])

  async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return
    setBusy(true)
    try {
      const processed = []
      for (const file of files) {
        const dataUrl = await processFile(file)
        processed.push({
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
          dataUrl,
          label: file.name.replace(/\.[^.]+$/, ''),
          addedAt: new Date().toISOString(),
        })
      }
      persist([...images, ...processed])
    } catch {
      alert('Erro ao processar a imagem. Tente outro arquivo.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeImage(id) {
    persist(images.filter(im => im.id !== id))
  }

  function renameImage(id, label) {
    persist(images.map(im => im.id === id ? { ...im, label } : im))
  }

  // Navegação no modo projeção
  const showNext = useCallback(() => setViewerIdx(i => (i + 1) % images.length), [images.length])
  const showPrev = useCallback(() => setViewerIdx(i => (i - 1 + images.length) % images.length), [images.length])

  useEffect(() => {
    if (viewerIdx === null) return
    function onKey(e) {
      if (e.key === 'Escape') setViewerIdx(null)
      if (e.key === 'ArrowRight') showNext()
      if (e.key === 'ArrowLeft') showPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerIdx, showNext, showPrev])

  function toggleFullscreen() {
    const el = viewerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <QrCode className={`w-4 h-4 ${accent}`} />
          <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
            {title || 'Imagens para o Telão'}
          </span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" /> {busy ? 'Processando…' : 'Enviar imagem'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {images.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          <ImageIcon className="w-8 h-8 opacity-50" />
          <span className="text-sm">Clique para enviar QR Code ou imagens</span>
          <span className="text-xs text-gray-600">PNG, JPG · exibição em tela cheia no telão</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((im, idx) => (
            <div key={im.id} className="group relative rounded-xl overflow-hidden border border-gray-700 bg-gray-950">
              <button
                onClick={() => setViewerIdx(idx)}
                className="block w-full aspect-square bg-white/5"
                title="Exibir no telão"
              >
                <img src={im.dataUrl} alt={im.label} className="w-full h-full object-contain" />
              </button>
              {/* Overlay ações */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 flex items-center gap-1">
                <input
                  value={im.label}
                  onChange={e => renameImage(im.id, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-xs text-gray-200 placeholder-gray-500 focus:outline-none truncate"
                  placeholder="Nome"
                />
              </div>
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setViewerIdx(idx)}
                  className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black"
                  title="Exibir no telão"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeImage(im.id)}
                  className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-600"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modo projeção / telão */}
      {viewerIdx !== null && images[viewerIdx] && (
        <div
          ref={viewerRef}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        >
          <img
            src={images[viewerIdx].dataUrl}
            alt={images[viewerIdx].label}
            className="max-w-full max-h-full object-contain"
          />

          {/* Controles (somem ao projetar; aparecem ao passar o mouse) */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
              title="Tela cheia (telão)"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => { if (document.fullscreenElement) document.exitFullscreen?.(); setViewerIdx(null) }}
              className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={showPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
                title="Anterior (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={showNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition-colors"
                title="Próxima (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur">
                {viewerIdx + 1} / {images.length}
                {images[viewerIdx].label ? ` · ${images[viewerIdx].label}` : ''}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

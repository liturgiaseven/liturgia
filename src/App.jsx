import { useState, useMemo, useEffect } from 'react'
import {
  loadOverrides,
  saveOverrides,
  buildServices,
  renameSegment,
  setSegmentDuration,
  renameService,
  setOrder,
  resetService,
  addSegment,
  removeSegment,
  setSegmentFeature,
} from './data/store'
import Clock from './components/Clock'
import ServicePanel from './components/ServicePanel'
import ActiveSegment from './components/ActiveSegment'
import BiblePanel from './components/BiblePanel'
import { BookOpen, Church, Pencil, Check, RotateCcw, BookMarked, RefreshCw } from 'lucide-react'
import { useVersionCheck } from './hooks/useVersionCheck'

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

export default function App() {
  const updateAvailable = useVersionCheck(APP_VERSION)
  const [overrides, setOverrides] = useState(loadOverrides)
  const [serviceIdx, setServiceIdx] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [bibleOpen, setBibleOpen] = useState(false)

  const services = useMemo(() => buildServices(overrides), [overrides])
  const service = services[serviceIdx]

  // Garante um segmento selecionado válido
  const segmentIndex = useMemo(() => {
    const i = service.segments.findIndex((s) => s.id === selectedId)
    return i >= 0 ? i : 0
  }, [service, selectedId])
  const segment = service.segments[segmentIndex]

  // Persiste overrides
  useEffect(() => { saveOverrides(overrides) }, [overrides])

  function switchService(idx) {
    setServiceIdx(idx)
    setSelectedId(services[idx].segments[0]?.id ?? null)
  }

  function selectSegment(idx) {
    setSelectedId(service.segments[idx]?.id ?? null)
  }

  function handleNext() {
    if (segmentIndex < service.segments.length - 1) selectSegment(segmentIndex + 1)
  }
  function handlePrev() {
    if (segmentIndex > 0) selectSegment(segmentIndex - 1)
  }

  // ---- Edição ----
  function handleRename(segId, name) {
    setOverrides((ov) => renameSegment(ov, service.id, segId, name))
  }
  function handleDuration(segId, minutes) {
    setOverrides((ov) => setSegmentDuration(ov, service.id, segId, minutes))
  }
  function handleReorder(fromIdx, toIdx) {
    const ids = service.segments.map((s) => s.id)
    const [moved] = ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, moved)
    setOverrides((ov) => setOrder(ov, service.id, ids))
  }
  function handleRenameService(name) {
    setOverrides((ov) => renameService(ov, service.id, name))
  }
  function handleAddSegment() {
    setOverrides((ov) => addSegment(ov, service.id))
  }
  function handleRemoveSegment(segId) {
    if (segment?.id === segId) selectSegment(Math.max(0, segmentIndex - 1))
    setOverrides((ov) => removeSegment(ov, service.id, segId))
  }
  function handleSegmentFeature(segId, key, value) {
    setOverrides((ov) => setSegmentFeature(ov, service.id, segId, key, value))
  }
  function handleResetService() {
    if (window.confirm(`Restaurar a programação padrão de "${service.name}"? As edições de títulos, tempos e ordem serão perdidas.`)) {
      setOverrides((ov) => resetService(ov, service.id))
    }
  }

  const tabClass = (idx) => {
    const active = idx === serviceIdx
    const colors = {
      0: active
        ? 'bg-blue-700 border-blue-600 text-white'
        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-blue-800 hover:text-gray-200',
      1: active
        ? 'bg-purple-700 border-purple-600 text-white'
        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-purple-800 hover:text-gray-200',
    }
    return `flex-1 flex flex-col items-center gap-1 py-3 px-4 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${colors[idx]}`
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-church-700 flex items-center justify-center">
            <Church className="w-5 h-5 text-church-200" />
          </div>
          <div>
            <div className="font-bold text-white text-base leading-tight">Liturgia IASD</div>
            <div className="text-xs text-gray-500">
              Controlador de Mídia · <span className="text-gray-400 font-mono">v{APP_VERSION}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setBibleOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
            title="Abrir Bíblia"
          >
            <BookMarked className="w-4 h-4" /> Bíblia
          </button>
          <Clock />
        </div>
      </header>

      {updateAvailable && (
        <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-emerald-700 border-b border-emerald-600 shrink-0">
          <span className="text-sm text-white font-semibold">
            Nova versão disponível — atualize para usar a versão mais recente.
          </span>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-800 text-sm font-bold hover:bg-emerald-50 transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar agora
          </button>
        </div>
      )}

      <BiblePanel open={bibleOpen} onClose={() => setBibleOpen(false)} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 flex flex-col gap-3 p-4 border-r border-gray-800 bg-gray-950 overflow-hidden">
          {/* Service selector */}
          <div className="flex gap-2">
            {services.map((s, idx) => (
              <button key={s.id} onClick={() => switchService(idx)} className={tabClass(idx)}>
                <span className="text-xs font-bold uppercase tracking-wide">{s.shortName}</span>
                <span className="text-xs opacity-75">{s.timeRange}</span>
              </button>
            ))}
          </div>

          {/* Barra de edição */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {editMode ? 'Editando programação' : `${service.name} — ${segmentIndex + 1}/${service.segments.length}`}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {editMode && (
                <button
                  onClick={handleResetService}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                  title="Restaurar padrão"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setEditMode((e) => !e)}
                className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors ${
                  editMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={editMode ? 'Concluir edição' : 'Editar programação'}
              >
                {editMode ? <><Check className="w-3.5 h-3.5" /> Concluir</> : <><Pencil className="w-3.5 h-3.5" /> Editar</>}
              </button>
            </div>
          </div>

          {/* Nome do culto editável */}
          {editMode && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-gray-600">Nome do culto (aba)</label>
              <input
                value={service.shortName}
                onChange={(e) => handleRenameService(e.target.value)}
                className="bg-gray-950 border border-gray-700 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Segment list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ServicePanel
              service={service}
              activeIndex={segmentIndex}
              onSelect={selectSegment}
              editMode={editMode}
              onRename={handleRename}
              onDuration={handleDuration}
              onReorder={handleReorder}
              onAdd={handleAddSegment}
              onRemove={handleRemoveSegment}
              onFeature={handleSegmentFeature}
            />
          </div>

          {editMode && (
            <p className="text-[11px] text-gray-600 leading-snug">
              Arraste pelo ícone <span className="text-gray-400">⠿</span> para reordenar. Edite títulos e tempos diretamente. Tudo é salvo no navegador.
            </p>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 p-5 overflow-y-auto scrollbar-thin">
          <ActiveSegment
            key={`${service.id}-${segment.id}-${segment.duration}`}
            service={service}
            segment={segment}
            segmentIndex={segmentIndex}
            totalSegments={service.segments.length}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { SERVICES } from './data/liturgy'
import Clock from './components/Clock'
import ServicePanel from './components/ServicePanel'
import ActiveSegment from './components/ActiveSegment'
import { BookOpen, Church } from 'lucide-react'

export default function App() {
  const [serviceIdx, setServiceIdx] = useState(0)
  const [segmentIndex, setSegmentIndex] = useState(0)

  const service = SERVICES[serviceIdx]
  const segment = service.segments[segmentIndex]

  function switchService(idx) {
    setServiceIdx(idx)
    setSegmentIndex(0)
  }

  function selectSegment(idx) {
    setSegmentIndex(idx)
  }

  function handleNext() {
    if (segmentIndex < service.segments.length - 1) setSegmentIndex(s => s + 1)
  }

  function handlePrev() {
    if (segmentIndex > 0) setSegmentIndex(s => s - 1)
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
            <div className="text-xs text-gray-500">Controlador de Mídia</div>
          </div>
        </div>
        <Clock />
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 flex flex-col gap-4 p-4 border-r border-gray-800 bg-gray-950 overflow-hidden">
          <div className="flex gap-2">
            {SERVICES.map((s, idx) => (
              <button key={s.id} onClick={() => switchService(idx)} className={tabClass(idx)}>
                <span className="text-xs font-bold uppercase tracking-wide">{s.shortName}</span>
                <span className="text-xs opacity-75">{s.timeRange}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <BookOpen className="w-4 h-4" />
            <span>{service.name} — {segmentIndex + 1}/{service.segments.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ServicePanel service={service} activeIndex={segmentIndex} onSelect={selectSegment} />
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-5 overflow-y-auto scrollbar-thin">
          <ActiveSegment
            key={`${serviceIdx}-${segmentIndex}`}
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

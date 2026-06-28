import { ChevronLeft, ChevronRight, CheckCircle2, Lightbulb } from 'lucide-react'
import Icon from './Icon'
import SegmentTimer from './SegmentTimer'
import HymnPanel from './HymnPanel'
import YoutubeField from './YoutubeField'
import ImageField from './ImageField'
import SermonSlides from './SermonSlides'

export default function ActiveSegment({
  service,
  segment,
  segmentIndex,
  totalSegments,
  onPrev,
  onNext,
}) {
  const isFirst = segmentIndex === 0
  const isLast = segmentIndex === totalSegments - 1

  const accentClass = service.color === 'purple' ? 'text-purple-400' : 'text-blue-400'
  const badgeClass =
    service.color === 'purple'
      ? 'bg-purple-900/50 text-purple-300 border-purple-800'
      : 'bg-blue-900/50 text-blue-300 border-blue-800'

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Segment header */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${service.color === 'purple' ? 'bg-purple-900/60' : 'bg-blue-900/60'}`}>
            <Icon name={segment.icon} className={`w-7 h-7 ${accentClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold uppercase tracking-widest ${accentClass}`}>
                Segmento {segmentIndex + 1} de {totalSegments}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeClass}`}>
                {segment.duration} min
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1 leading-tight">
              {segment.name}
            </h2>
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed">
          {segment.description}
        </p>
      </div>

      {/* Timer */}
      <SegmentTimer key={`${service.id}-${segment.id}`} segment={segment} />

      {/* YouTube (em segmentos que usam vídeo) */}
      {segment.hasYoutube && (
        <YoutubeField segmentId={segment.id} />
      )}

      {/* Imagens / QR para o telão */}
      {segment.hasImages && (
        <ImageField segmentId={segment.id} title={segment.imagesLabel} accent={accentClass} />
      )}

      {/* Hinos sugeridos (apenas em momentos musicais) */}
      {segment.hymnCategory && (
        <HymnPanel category={segment.hymnCategory} accent={accentClass} />
      )}

      {/* Slides do pregador (PDF) */}
      {segment.hasSlides && (
        <SermonSlides slideKey={`${service.id}:${segment.id}`} accent={accentClass} />
      )}

      {/* Tips */}
      {segment.tips?.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
              Dicas para o Operador
            </span>
          </div>
          <ul className="space-y-2">
            {segment.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          Anterior
        </button>
        <button
          onClick={onNext}
          disabled={isLast}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            service.color === 'purple'
              ? 'bg-purple-700 hover:bg-purple-600 text-white border border-purple-600'
              : 'bg-blue-700 hover:bg-blue-600 text-white border border-blue-600'
          }`}
        >
          Próximo
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

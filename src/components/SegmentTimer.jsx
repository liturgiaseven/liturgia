import { useState, useEffect, useRef } from 'react'
import { formatDuration } from '../data/liturgy'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function SegmentTimer({ segment, running, onRunningChange, onReset }) {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)
  const elapsedRef = useRef(0)

  // Reset when segment changes
  useEffect(() => {
    setElapsed(0)
    elapsedRef.current = 0
    startRef.current = null
    onRunningChange(false)
  }, [segment?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsedRef.current * 1000
    }
  }, [running])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000)
      elapsedRef.current = secs
      setElapsed(secs)
    }, 500)
    return () => clearInterval(id)
  }, [running])

  const handleReset = () => {
    setElapsed(0)
    elapsedRef.current = 0
    startRef.current = running ? Date.now() : null
    onReset?.()
  }

  const durationSecs = (segment?.duration ?? 10) * 60
  const progress = Math.min(elapsed / durationSecs, 1)
  const overTime = elapsed > durationSecs
  const remaining = durationSecs - elapsed

  const progressColor = overTime
    ? 'bg-red-500'
    : progress > 0.85
    ? 'bg-yellow-500'
    : 'bg-emerald-500'

  const timeColor = overTime
    ? 'text-red-400'
    : progress > 0.85
    ? 'text-yellow-400'
    : 'text-emerald-400'

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
          Cronômetro
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRunningChange(!running)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              running
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {running ? (
              <><Pause className="w-4 h-4" /> Pausar</>
            ) : (
              <><Play className="w-4 h-4" /> Iniciar</>
            )}
          </button>
        </div>
      </div>

      {/* Main time display */}
      <div className={`text-5xl font-mono font-bold tabular-nums text-center py-4 ${timeColor}`}>
        {formatDuration(elapsed)}
      </div>

      {/* Progress bar */}
      <div className="mt-3 mb-2">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Duration info */}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Duração prevista: {segment?.duration ?? 0} min</span>
        <span className={overTime ? 'text-red-400 font-semibold' : ''}>
          {overTime
            ? `+${formatDuration(elapsed - durationSecs)} acima`
            : `${formatDuration(Math.max(remaining, 0))} restantes`}
        </span>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { formatDuration } from '../data/liturgy'
import { Play, Pause, RotateCcw, Pencil, Check, Tv } from 'lucide-react'
import { openProjectionWindow, sendToProjection, clearProjection } from '../utils/projection'

export default function SegmentTimer({ segment }) {
  const defaultDuration = (segment?.duration ?? 10) * 60
  const [totalSecs, setTotalSecs] = useState(defaultDuration)
  const [remaining, setRemaining] = useState(defaultDuration)
  const [running, setRunning] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editMin, setEditMin] = useState(segment?.duration ?? 10)
  const [editSec, setEditSec] = useState(0)
  const [projActive, setProjActive] = useState(false)
  const intervalRef = useRef(null)
  const remainingRef = useRef(defaultDuration)

  useEffect(() => {
    const secs = (segment?.duration ?? 10) * 60
    setTotalSecs(secs)
    setRemaining(secs)
    remainingRef.current = secs
    setRunning(false)
    setEditMin(segment?.duration ?? 10)
    setEditSec(0)
    setEditing(false)
    setProjActive(false)
  }, [segment?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast to projection window on every tick (when active)
  useEffect(() => {
    if (!projActive) return
    sendToProjection({
      type: 'timer',
      segmentName: segment?.name ?? '',
      remaining,
      totalSecs,
      expired: remaining === 0,
    })
  }, [remaining, totalSecs, projActive]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        remainingRef.current -= 1
        if (remainingRef.current <= 0) {
          remainingRef.current = 0
          setRemaining(0)
          setRunning(false)
          clearInterval(intervalRef.current)
        } else {
          setRemaining(remainingRef.current)
        }
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function handleReset() {
    setRunning(false)
    setRemaining(totalSecs)
    remainingRef.current = totalSecs
  }

  function handleEditConfirm() {
    const mins = Math.max(0, Math.min(180, Math.floor(Number(editMin) || 0)))
    const secs = Math.max(0, Math.min(59, Math.floor(Number(editSec) || 0)))
    let total = mins * 60 + secs
    if (total < 1) total = 60
    setEditMin(mins)
    setEditSec(secs)
    setTotalSecs(total)
    setRemaining(total)
    remainingRef.current = total
    setRunning(false)
    setEditing(false)
  }

  function handleEditKey(e) {
    if (e.key === 'Enter') handleEditConfirm()
    if (e.key === 'Escape') setEditing(false)
  }

  function handleProjection() {
    if (projActive) {
      setProjActive(false)
      clearProjection()
    } else {
      openProjectionWindow()
      setProjActive(true)
    }
  }

  const progress = remaining / totalSecs
  const expired = remaining === 0

  const timeColor = expired
    ? 'text-red-400 animate-pulse'
    : progress <= 0.25 ? 'text-red-400'
    : progress <= 0.5  ? 'text-yellow-400'
    : 'text-emerald-400'

  const barColor = expired
    ? 'bg-red-500'
    : progress <= 0.25 ? 'bg-red-500'
    : progress <= 0.5  ? 'bg-yellow-500'
    : 'bg-emerald-500'

  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
          Contagem Regressiva
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleProjection}
            className={`p-1.5 rounded-lg transition-colors ${
              projActive
                ? 'text-amber-400 bg-amber-900/30 hover:bg-amber-900/50'
                : 'text-gray-500 hover:text-amber-400 hover:bg-gray-800'
            }`}
            title={projActive ? 'Parar projeção' : 'Projetar no telão'}
          >
            <Tv className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => !expired && setRunning((r) => !r)}
            disabled={expired}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              running
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {running ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Iniciar</>}
          </button>
        </div>
      </div>

      <div className={`text-6xl font-mono font-bold tabular-nums text-center py-5 tracking-tight ${timeColor}`}>
        {expired ? '00:00' : formatDuration(remaining)}
      </div>
      {expired && (
        <div className="text-center text-red-400 text-sm font-semibold -mt-2 mb-2">Tempo esgotado!</div>
      )}

      <div className="mt-1 mb-3">
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <input
                type="number" min={0} max={180} value={editMin}
                onChange={(e) => setEditMin(e.target.value)} onKeyDown={handleEditKey} autoFocus
                className="w-14 bg-gray-800 border border-blue-500 rounded-md px-2 py-0.5 text-white text-xs text-center focus:outline-none"
              />
              <span>min</span>
              <input
                type="number" min={0} max={59} value={editSec}
                onChange={(e) => setEditSec(e.target.value)} onKeyDown={handleEditKey}
                className="w-14 bg-gray-800 border border-blue-500 rounded-md px-2 py-0.5 text-white text-xs text-center focus:outline-none"
              />
              <span>seg</span>
              <button
                onClick={handleEditConfirm}
                className="ml-1 p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                title="Confirmar"
              >
                <Check className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <span>Duração: {formatDuration(totalSecs)}</span>
              <button
                onClick={() => {
                  setEditMin(Math.floor(totalSecs / 60))
                  setEditSec(totalSecs % 60)
                  setEditing(true)
                  setRunning(false)
                }}
                className="p-1 rounded hover:bg-gray-800 hover:text-gray-300 transition-colors"
                title="Editar duração"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        <span className={remaining === 0 ? 'text-red-400' : ''}>
          {formatDuration(remaining)} restantes
        </span>
      </div>
    </div>
  )
}

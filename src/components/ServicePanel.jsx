import { useState } from 'react'
import Icon from './Icon'
import { GripVertical, X, Plus } from 'lucide-react'

const colorMap = {
  blue: {
    active: 'bg-blue-600 border-blue-500',
    done: 'bg-gray-800 border-gray-700 opacity-50',
    upcoming: 'bg-gray-900 border-gray-700 hover:border-blue-800',
  },
  purple: {
    active: 'bg-purple-700 border-purple-500',
    done: 'bg-gray-800 border-gray-700 opacity-50',
    upcoming: 'bg-gray-900 border-gray-700 hover:border-purple-800',
  },
}

export default function ServicePanel({
  service,
  activeIndex,
  onSelect,
  editMode = false,
  onRename,
  onDuration,
  onReorder,
  onAdd,
  onRemove,
}) {
  const colors = colorMap[service.color] ?? colorMap.blue
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  function handleDrop(toIdx) {
    if (dragIdx !== null && dragIdx !== toIdx) onReorder(dragIdx, toIdx)
    setDragIdx(null)
    setOverIdx(null)
  }

  // ---- Modo edição ----
  if (editMode) {
    return (
      <div className="flex flex-col gap-2 scrollbar-thin overflow-y-auto pr-1">
        {service.segments.map((seg, idx) => (
          <div
            key={seg.id}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); setOverIdx(idx) }}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
            onDrop={() => handleDrop(idx)}
            className={`flex items-center gap-2 rounded-xl border px-2 py-2 bg-gray-900 transition-all ${
              overIdx === idx && dragIdx !== null && dragIdx !== idx
                ? 'border-emerald-500'
                : 'border-gray-700'
            } ${dragIdx === idx ? 'opacity-40' : ''}`}
          >
            <GripVertical className="w-4 h-4 text-gray-600 shrink-0 cursor-grab active:cursor-grabbing" />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <input
                value={seg.name}
                onChange={(e) => onRename(seg.id, e.target.value)}
                onDragStart={(e) => e.preventDefault()}
                className="w-full bg-gray-950 border border-gray-700 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={seg.duration}
                  onChange={(e) => onDuration(seg.id, e.target.value)}
                  onDragStart={(e) => e.preventDefault()}
                  className="w-16 bg-gray-950 border border-gray-700 rounded-md px-2 py-0.5 text-xs text-white text-center focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">min</span>
              </div>
            </div>
            {service.segments.length > 1 && (
              <button
                onClick={() => onRemove?.(seg.id)}
                onDragStart={(e) => e.preventDefault()}
                className="shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors"
                title="Remover segmento"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => onAdd?.()}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-600 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> Adicionar segmento
        </button>
      </div>
    )
  }

  // ---- Modo normal ----
  return (
    <div className="flex flex-col gap-2 scrollbar-thin overflow-y-auto pr-1">
      {service.segments.map((seg, idx) => {
        const isActive = idx === activeIndex
        const isDone = idx < activeIndex
        const stateClass = isActive ? colors.active : isDone ? colors.done : colors.upcoming

        return (
          <button
            key={seg.id}
            onClick={() => onSelect(idx)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${stateClass} ${
              isActive ? 'shadow-lg' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? 'bg-white text-blue-700'
                    : isDone
                    ? 'bg-gray-600 text-gray-400'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm truncate ${isActive ? 'text-white' : isDone ? 'text-gray-500' : 'text-gray-200'}`}>
                  {seg.name}
                </div>
                <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                  {seg.duration} min
                </div>
              </div>
              <div className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                <Icon name={seg.icon} className="w-4 h-4" />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

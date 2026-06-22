import Icon from './Icon'

const colorMap = {
  blue: {
    active: 'bg-blue-600 border-blue-500',
    done: 'bg-gray-800 border-gray-700 opacity-50',
    upcoming: 'bg-gray-900 border-gray-700 hover:border-blue-800',
    dot: 'bg-blue-500',
    badge: 'bg-blue-900 text-blue-300',
  },
  purple: {
    active: 'bg-purple-700 border-purple-500',
    done: 'bg-gray-800 border-gray-700 opacity-50',
    upcoming: 'bg-gray-900 border-gray-700 hover:border-purple-800',
    dot: 'bg-purple-500',
    badge: 'bg-purple-900 text-purple-300',
  },
}

export default function ServicePanel({ service, activeIndex, onSelect }) {
  const colors = colorMap[service.color] ?? colorMap.blue

  return (
    <div className="flex flex-col gap-2 scrollbar-thin overflow-y-auto pr-1">
      {service.segments.map((seg, idx) => {
        const isActive = idx === activeIndex
        const isDone = idx < activeIndex
        const stateClass = isActive
          ? colors.active
          : isDone
          ? colors.done
          : colors.upcoming

        return (
          <button
            key={seg.id}
            onClick={() => onSelect(idx)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${stateClass} ${
              isActive ? 'shadow-lg' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Step number */}
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

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm truncate ${isActive ? 'text-white' : isDone ? 'text-gray-500' : 'text-gray-200'}`}>
                  {seg.name}
                </div>
                <div className={`text-xs mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                  {seg.duration} min
                </div>
              </div>

              {/* Icon */}
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

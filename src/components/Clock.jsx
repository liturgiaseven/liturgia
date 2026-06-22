import { useState, useEffect } from 'react'

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const day = DAYS[now.getDay()]
  const date = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div className="text-right">
      <div className="text-2xl font-mono font-bold text-white tabular-nums">
        {hh}:{mm}
        <span className="text-gray-400 text-xl">:{ss}</span>
      </div>
      <div className="text-xs text-gray-400 mt-0.5">
        {day}, {date}
      </div>
    </div>
  )
}

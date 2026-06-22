import { useState, useEffect } from 'react'

const INTERVAL_MS = 60_000 // check every 60 seconds

async function fetchDeployedVersion() {
  try {
    const res = await fetch('/', { cache: 'no-store' })
    const html = await res.text()
    const match = html.match(/<meta name="app-version" content="([^"]+)"/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export function useVersionCheck(currentVersion) {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const deployed = await fetchDeployedVersion()
      if (!cancelled && deployed && deployed !== currentVersion) {
        setUpdateAvailable(true)
      }
    }

    check()
    const id = setInterval(check, INTERVAL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [currentVersion])

  return updateAvailable
}

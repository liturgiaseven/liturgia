import { useState, useEffect } from 'react'
import { loadChurchLogo } from '../lib/churchLogo'

const LS_KEY = 'liturgia.church-logo-url'

export function useChurchLogo() {
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem(LS_KEY) || null)

  useEffect(() => {
    loadChurchLogo().then((url) => {
      if (url) {
        setLogoUrl(url)
        localStorage.setItem(LS_KEY, url)
      }
    })
  }, [])

  function updateLogo(url) {
    setLogoUrl(url)
    if (url) localStorage.setItem(LS_KEY, url)
    else localStorage.removeItem(LS_KEY)
  }

  return { logoUrl, updateLogo }
}

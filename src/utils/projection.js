const CHANNEL_NAME = 'liturgia-projection'
const LS_KEY = 'liturgia.proj-state'

// Singleton channel — initialized at module load so it's always listening
const _channel = new BroadcastChannel(CHANNEL_NAME)
let _projWin = null

// When projection window signals ready, re-send last known state
_channel.onmessage = (e) => {
  if (e.data?.type === 'ready') {
    try {
      const last = localStorage.getItem(LS_KEY)
      if (last) _channel.postMessage(JSON.parse(last))
    } catch {}
  }
}

export function sendToProjection(msg) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(msg)) } catch {}
  _channel.postMessage(msg)
}

export function openProjectionWindow() {
  if (!_projWin || _projWin.closed) {
    _projWin = window.open(
      '/projection.html',
      'liturgia-projection',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no',
    )
  } else {
    _projWin.focus()
  }
}

export function clearProjection() {
  sendToProjection({ type: 'clear' })
}

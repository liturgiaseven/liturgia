const CHANNEL_NAME = 'liturgia-projection'
const LS_KEY = 'liturgia.proj-state'

const _channel = new BroadcastChannel(CHANNEL_NAME)
let _projWin = null
let _navHandler = null

export function registerNavHandler(fn) { _navHandler = fn }
export function unregisterNavHandler() { _navHandler = null }

_channel.onmessage = (e) => {
  if (e.data?.type === 'ready') {
    try {
      const last = localStorage.getItem(LS_KEY)
      if (last) _channel.postMessage(JSON.parse(last))
    } catch {}
  } else if (e.data?.type === 'nav') {
    _navHandler?.(e.data.direction)
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

// Carregamento sob demanda da Bíblia (Almeida – Domínio Público).
// O JSON fica em /public e só é baixado quando o usuário abre a Bíblia.

let cache = null
let loadingPromise = null

export const BIBLE_VERSION = 'Almeida'

export function loadBible() {
  if (cache) return Promise.resolve(cache)
  if (loadingPromise) return loadingPromise
  loadingPromise = fetch('/bible-almeida.json')
    .then((r) => {
      if (!r.ok) throw new Error('Falha ao carregar a Bíblia')
      return r.json()
    })
    .then((data) => {
      cache = data.map((b, idx) => ({
        index: idx,
        abbrev: b.abbrev,
        name: b.name,
        chapters: b.chapters,
      }))
      return cache
    })
    .catch((err) => {
      loadingPromise = null
      throw err
    })
  return loadingPromise
}

// Normaliza para busca (sem acentos, minúsculo)
function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Aliases comuns de abreviações em português → abbrev do dataset
const ALIASES = {
  gn: 'gn', genesis: 'gn',
  ex: 'ex', exodo: 'ex',
  lv: 'lv', levitico: 'lv',
  nm: 'nm', numeros: 'nm',
  dt: 'dt', deuteronomio: 'dt',
  js: 'js', josue: 'js',
  jz: 'jz', juizes: 'jz',
  rt: 'rt', rute: 'rt',
  sl: 'sl', salmo: 'sl', salmos: 'sl', sal: 'sl',
  pv: 'pv', proverbios: 'pv', pr: 'pv',
  ec: 'ec', eclesiastes: 'ec',
  ct: 'ct', cantares: 'ct', cantico: 'ct',
  is: 'is', isaias: 'is',
  jr: 'jr', jeremias: 'jr',
  ez: 'ez', ezequiel: 'ez',
  dn: 'dn', daniel: 'dn',
  os: 'os', oseias: 'os',
  mt: 'mt', mateus: 'mt',
  mc: 'mc', marcos: 'mc',
  lc: 'lc', lucas: 'lc',
  jo: 'jo', joao: 'jo',
  atos: 'atos', at: 'atos',
  rm: 'rm', romanos: 'rm',
  ef: 'ef', efesios: 'ef',
  fp: 'fp', filipenses: 'fp',
  cl: 'cl', colossenses: 'cl',
  hb: 'hb', hebreus: 'hb',
  tg: 'tg', tiago: 'tg',
  ap: 'ap', apocalipse: 'ap',
}

// Encontra um livro por nome/abreviação aproximado
export function findBook(books, query) {
  const q = norm(query).replace(/\s+/g, '')
  if (!q) return null
  // alias direto
  if (ALIASES[q]) {
    const b = books.find((bk) => bk.abbrev === ALIASES[q])
    if (b) return b
  }
  // por abreviação exata
  let b = books.find((bk) => norm(bk.abbrev).replace(/\s+/g, '') === q)
  if (b) return b
  // por início do nome
  b = books.find((bk) => norm(bk.name).replace(/\s+/g, '').startsWith(q))
  if (b) return b
  // por conter
  b = books.find((bk) => norm(bk.name).replace(/\s+/g, '').includes(q))
  return b || null
}

// Faz o parse de "João 3:16", "1 Co 13:4-7", "Sl 23"
// Retorna { book, chapter (0-based), verseStart (0-based), verseEnd } ou null
export function parseReference(books, ref) {
  if (!ref) return null
  const m = ref.trim().match(/^(.*?)\s*(\d+)(?:\s*[:.]\s*(\d+)(?:\s*-\s*(\d+))?)?\s*$/)
  if (!m) {
    // só nome do livro
    const book = findBook(books, ref)
    return book ? { book, chapter: 0, verseStart: 0, verseEnd: null } : null
  }
  const [, namePart, chapStr, vStartStr, vEndStr] = m
  const book = findBook(books, namePart)
  if (!book) return null
  const chapter = Math.max(0, Math.min(book.chapters.length - 1, parseInt(chapStr, 10) - 1))
  const verseStart = vStartStr ? Math.max(0, parseInt(vStartStr, 10) - 1) : 0
  const verseEnd = vEndStr ? parseInt(vEndStr, 10) - 1 : vStartStr ? verseStart : null
  return { book, chapter, verseStart, verseEnd }
}

import {
  Music,
  Globe,
  BookOpen,
  Megaphone,
  Star,
  Heart,
  Mic,
  Book,
  Cross,
  HeartHandshake,
} from 'lucide-react'

const icons = {
  music: Music,
  globe: Globe,
  'book-open': BookOpen,
  book: Book,
  megaphone: Megaphone,
  star: Star,
  heart: Heart,
  microphone: Mic,
  pray: HeartHandshake,
  cross: Cross,
}

export default function Icon({ name, className = 'w-5 h-5' }) {
  const Component = icons[name] || BookOpen
  return <Component className={className} />
}

import Image from 'next/image'

/** Deterministic background color derived from the user's name. */
function nameToColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  const palette = [
    '#F97316', '#16A34A', '#BE185D', '#2563EB',
    '#7C3AED', '#0891B2', '#DC2626', '#CA8A04',
  ]
  return palette[hash % palette.length]
}

/** First + last initial, uppercased. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface UserAvatarProps {
  name: string
  avatarUrl: string | null
  /** Diameter in pixels — used for both the image dimensions and the initials circle. */
  size: number
  className?: string
}

export function UserAvatar({ name, avatarUrl, size, className = '' }: UserAvatarProps) {
  const fontSize = Math.max(10, Math.round(size * 0.38))

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 font-semibold text-white select-none ${className}`}
      style={{ width: size, height: size, backgroundColor: nameToColor(name), fontSize }}
      aria-label={`${name} avatar`}
    >
      {getInitials(name)}
    </span>
  )
}

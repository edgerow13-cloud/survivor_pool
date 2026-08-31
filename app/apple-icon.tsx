import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Home-screen icon on iOS — same navy "ink" brand mark as app/icon.tsx,
// just at the larger size Apple expects.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#17324D',
          color: '#F9F6EF',
          fontSize: 96,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        O
      </div>
    ),
    { ...size }
  )
}

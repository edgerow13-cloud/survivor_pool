import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Browser tab icon — matches the navy "ink" brand mark used in Header,
// AdminHeader, and the login page (see .ink-panel in app/globals.css).
export default function Icon() {
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
          borderRadius: 7,
          color: '#F9F6EF',
          fontSize: 20,
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

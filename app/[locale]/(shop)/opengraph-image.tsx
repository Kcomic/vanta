import { ImageResponse } from 'next/og';

// Use the default Node.js runtime for maximum compatibility with `next start`.
// Edge runtime can cause resolution issues in local preview.
export const runtime = 'nodejs';
export const alt = 'VANTA® — Bangkok-born. Globally worn.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0A0A0A', // --ink: products materialise out of the void
          color: '#F5F4EF', // --paper
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          VANTA®
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: '#FF3B1F' }}>
          {/* --blaze: signature urgency */}
          LIVE DROP — Bangkok-born. Globally worn.
        </div>
      </div>
    ),
    { ...size },
  );
}

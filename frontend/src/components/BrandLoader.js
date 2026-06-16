'use client';

export default function BrandLoader({ fullPage = true, transparent = false }) {
  return (
    <div
      style={{
        position: fullPage ? 'fixed' : 'relative',
        inset: fullPage ? 0 : 'auto',
        width: fullPage ? '100%' : 'auto',
        height: fullPage ? '100vh' : '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: fullPage 
          ? (transparent ? 'rgba(255, 255, 255, 0.82)' : '#FFFFFF') 
          : 'transparent',
        backdropFilter: fullPage && transparent ? 'blur(3px)' : 'none',
        WebkitBackdropFilter: fullPage && transparent ? 'blur(3px)' : 'none',
        zIndex: fullPage ? 99999 : 1,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '64px',
          height: '64px',
        }}
      >
        {/* Spinning ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid #FFE0C2',
            borderTopColor: '#FF8C00',
            animation: 'brand-spin 0.7s linear infinite',
          }}
        />
        {/* Inner pulsing dot */}
        <div
          style={{
            position: 'absolute',
            inset: '18px',
            borderRadius: '50%',
            backgroundColor: '#FF8C00',
            animation: 'brand-pulse 0.7s ease-in-out infinite alternate',
          }}
        />
      </div>

      <style>{`
        @keyframes brand-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes brand-pulse {
          from { opacity: 0.5; transform: scale(0.7); }
          to   { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

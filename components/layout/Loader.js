'use client';

export default function Loader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      width: '100%'
    }}>
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #e5e5ea',
        borderTopColor: '#1d1d1f',
        borderRadius: '50%',
        animation: 'jayenware-spin 1s linear infinite'
      }} />
      
      <style jsx>{`
        @keyframes jayenware-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

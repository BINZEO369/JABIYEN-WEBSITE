'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          transform: toast ? 'translateX(0)' : 'translateX(120%)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(40px) saturate(250%)',
            WebkitBackdropFilter: 'blur(40px) saturate(250%)',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
            borderRadius: 20,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            minWidth: 240,
            color: '#1d1d1f'
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#1d1d1f', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, flexShrink: 0
            }}>
              {type === 'success' ? '✓' : '!'}
            </span>
            <p style={{
              fontSize: 10, fontWeight: 700, flexGrow: 1,
              fontFamily: "'Inter', sans-serif", margin: 0,
              letterSpacing: '0.05em'
            }}>
              {toast.text}
            </p>
            <button onClick={hideToast} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#999', padding: 4, fontSize: 10
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

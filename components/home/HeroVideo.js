'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function HeroVideo({ videos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textPhase, setTextPhase] = useState('entering');

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const autoplayIntervalRef = useRef(null);
  const isMutedRef = useRef(true); // useRef to track mute state without triggering re-render

  const videoDuration = 8000;

  // Load video - isMuted removed from dependencies
  useEffect(() => {
    if (!videos.length || !playerRef.current) return;
    
    const video = videos[currentIndex];
    setIsTransitioning(true);
    setIsLoaded(false);
    setTextPhase('exiting');

    const textOutTimer = setTimeout(() => {
      setTextPhase('entering');
      
      if (playerRef.current) {
        playerRef.current.src = video.video_url;
        playerRef.current.muted = isMutedRef.current; // Use ref instead of state
        playerRef.current.load();
      }
    }, 400);

    return () => clearTimeout(textOutTimer);
  }, [currentIndex, videos]); // Removed isMuted from dependencies

  // Handle video load
  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    setIsTransitioning(false);
    setTextPhase('visible');
    
    if (!isPaused && playerRef.current) {
      playerRef.current.play().catch(() => {});
    }
  }, [isPaused]);

  // Progress tracking
  useEffect(() => {
    if (!isLoaded || isPaused || isTransitioning) {
      clearInterval(progressIntervalRef.current);
      return;
    }

    const interval = 50;
    const totalSteps = videoDuration / interval;
    let step = 0;
    setProgress(0);

    progressIntervalRef.current = setInterval(() => {
      step++;
      setProgress(Math.min((step / totalSteps) * 100, 100));
      if (step >= totalSteps) clearInterval(progressIntervalRef.current);
    }, interval);

    return () => clearInterval(progressIntervalRef.current);
  }, [isLoaded, isPaused, isTransitioning, videoDuration]);

  // Autoplay
  useEffect(() => {
    if (videos.length <= 1 || isPaused) {
      clearInterval(autoplayIntervalRef.current);
      return;
    }

    autoplayIntervalRef.current = setInterval(() => {
      if (!isTransitioning && isLoaded && !isPaused) {
        setCurrentIndex(prev => (prev + 1) % videos.length);
      }
    }, videoDuration);

    return () => clearInterval(autoplayIntervalRef.current);
  }, [videos.length, isPaused, isTransitioning, isLoaded, videoDuration]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(progressIntervalRef.current);
      clearInterval(autoplayIntervalRef.current);
    };
  }, []);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (playerRef.current) {
      const newMutedState = !playerRef.current.muted;
      playerRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      isMutedRef.current = newMutedState; // Update ref
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!playerRef.current) return;

    if (isPaused) {
      playerRef.current.play().catch(() => {});
      setIsPaused(false);
    } else {
      playerRef.current.pause();
      setIsPaused(true);
    }
  };

  const switchToVideo = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setProgress(100);
    clearInterval(autoplayIntervalRef.current);
    clearInterval(progressIntervalRef.current);
    setTimeout(() => setCurrentIndex(index), 300);
  };

  if (!videos.length) return null;

  const currentVideo = videos[currentIndex];
  const showCTA = currentVideo?.cta_title && currentVideo?.cta_link;

  return (
    <section 
      className="hero-video-section"
      style={{
        position: 'relative',
        width: '100%',
        background: '#000',
        overflow: 'hidden'
      }}
    >
      {/* Poster */}
      {currentVideo?.poster && !isLoaded && (
        <img
          src={currentVideo.poster}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0
          }}
        />
      )}

      {/* Video */}
      <div style={{
        position: 'relative', width: '100%',
        height: '850px', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center'
      }}>
        <video
          ref={playerRef}
          muted={isMuted}
          playsInline
          loop
          preload="metadata"
          onCanPlay={handleCanPlay}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', pointerEvents: 'none',
            filter: 'brightness(0.85)',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease'
          }}
        />

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)'
        }} />

        {/* Text Content */}
        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center',
          padding: '0 24px', maxWidth: 700, width: '100%', marginBottom: 60
        }}>
          {currentVideo?.label && (
            <span style={{
              display: 'inline-block', color: 'rgba(255,255,255,0.55)',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.3em',
              textTransform: 'uppercase', marginBottom: 16,
              opacity: textPhase === 'visible' ? 1 : 0,
              transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-20px)' : 'translateY(14px)',
              filter: textPhase === 'visible' ? 'blur(0)' : 'blur(4px)',
              transition: textPhase === 'exiting' ? 'all 0.4s ease' : 'all 0.7s ease'
            }}>
              {currentVideo.label}
            </span>
          )}

          {currentVideo?.title && (
            <h2 style={{
              color: '#fff', fontSize: 48, fontWeight: 800,
              lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.02em',
              opacity: textPhase === 'visible' ? 1 : 0,
              transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-20px)' : 'translateY(18px)',
              filter: textPhase === 'visible' ? 'blur(0)' : 'blur(6px)',
              transition: textPhase === 'exiting' ? 'all 0.4s ease' : 'all 0.9s ease'
            }}>
              {currentVideo.title}
            </h2>
          )}

          {currentVideo?.description && (
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 14,
              maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.5,
              opacity: textPhase === 'visible' ? 1 : 0,
              transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-20px)' : 'translateY(12px)',
              filter: textPhase === 'visible' ? 'blur(0)' : 'blur(3px)',
              transition: textPhase === 'exiting' ? 'all 0.4s ease' : 'all 0.8s ease'
            }}>
              {currentVideo.description}
            </p>
          )}

          {showCTA && (
            <a 
              href={currentVideo.cta_link} 
              className="cta-bubble"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '14px 36px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: textPhase === 'visible' ? 1 : 0,
                transform: textPhase === 'visible' ? 'translateY(0) scale(1)' : textPhase === 'exiting' ? 'translateY(-20px) scale(0.95)' : 'translateY(12px) scale(0.95)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.2)';
              }}
            >
              {/* Liquid effect overlay */}
              <span style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)',
                borderRadius: '100px',
                pointerEvents: 'none'
              }} />
              
              {/* Shine effect */}
              <span style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                animation: 'shine 3s infinite',
                pointerEvents: 'none'
              }} />
              
              <span style={{ position: 'relative', zIndex: 1 }}>
                {currentVideo.cta_title}
              </span>
            </a>
          )}
        </div>

        {/* Controls - ছোট ও উন্নত */}
        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          right: 20, 
          zIndex: 10, 
          display: 'flex', 
          gap: 8,
          alignItems: 'center'
        }}>
          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay}
            className="control-btn"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 10,
              padding: 0,
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              {isPaused ? (
                <path d="M8 5v14l11-7z"/>
              ) : (
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              )}
            </svg>
          </button>

          {/* Sound Button */}
          <button 
            onClick={toggleSound}
            className="control-btn"
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 10,
              padding: 0,
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              {isMuted ? (
                <>
                  <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                  <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2"/>
                </>
              ) : (
                <>
                  <path d="M3 9v6h4l5 5V4L7 9H3z"/>
                  <path d="M16 7.5c1.5 1.5 1.5 4 0 5.5" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19 5c3 3.5 3 9 0 13" fill="none" stroke="currentColor" strokeWidth="2"/>
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 2,
          background: 'rgba(255,255,255,0.5)', zIndex: 3,
          width: `${progress}%`, transition: 'width 0.1s linear'
        }} />

        {/* Dots Navigation */}
        {videos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 24, left: '50%',
            transform: 'translateX(-50%)', zIndex: 3,
            display: 'flex', gap: 8
          }}>
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => switchToVideo(i)}
                style={{
                  width: i === currentIndex ? 24 : 7,
                  height: 7,
                  borderRadius: i === currentIndex ? 4 : '50%',
                  background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.4s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        
        @keyframes liquidPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        .cta-bubble::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4));
          border-radius: 100px;
          z-index: -1;
          animation: liquidPulse 2s ease-in-out infinite;
        }

        .control-btn:active {
          transform: scale(0.95) !important;
        }
        
        @media (max-width: 1024px) {
          h2 { font-size: 40px !important; }
        }
        @media (max-width: 768px) {
          h2 { font-size: 32px !important; margin-bottom: 12px !important; }
          p { font-size: 12px !important; }
          span { font-size: 10px !important; }
          .cta-bubble { padding: 12px 28px !important; font-size: 11px !important; }
        }
        @media (max-width: 480px) {
          h2 { font-size: 26px !important; }
          p { font-size: 11px !important; }
          .cta-bubble { padding: 10px 24px !important; font-size: 10px !important; }
        }
      `}</style>
    </section>
  );
}

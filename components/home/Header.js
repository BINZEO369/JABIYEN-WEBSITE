'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function HeroVideo({ videos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [textPhase, setTextPhase] = useState('entering'); // 'entering' | 'visible' | 'exiting'

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const autoplayIntervalRef = useRef(null);

  const videoDuration = 8000;

  // Show section with animation
  useEffect(() => {
    if (videos.length > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    }
  }, [videos]);

  // Load video
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
        playerRef.current.muted = isMuted;
        playerRef.current.load();
      }
    }, 400);

    return () => clearTimeout(textOutTimer);
  }, [currentIndex, videos, isMuted]);

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

  const toggleSound = () => setIsMuted(prev => !prev);
  const togglePlay = () => setIsPaused(prev => !prev);

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
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease'
      }}
    >
      {/* Loading */}
      {!isLoaded && (
        <div style={{
          position: 'absolute', inset: 0, background: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5
        }}>
          <div style={{
            width: 40, height: 40, border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: '#fff', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
        </div>
      )}

      {/* Poster */}
      {currentVideo?.poster && (
        <img
          src={currentVideo.poster}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
            opacity: isLoaded ? 0 : 1,
            transition: 'opacity 0.5s ease'
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
            filter: 'brightness(0.85)'
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
            <a href={currentVideo.cta_link} style={{
              display: 'inline-flex', alignItems: 'center',
              color: '#fff', fontSize: 12, fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '0 0 4px',
              borderBottom: '2px solid rgba(255,255,255,0.6)',
              opacity: textPhase === 'visible' ? 1 : 0,
              transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-20px)' : 'translateY(12px)',
              transition: textPhase === 'exiting' ? 'all 0.4s ease' : 'all 0.8s ease'
            }}>
              {currentVideo.cta_title}
            </a>
          )}
        </div>

        {/* Controls */}
        <div style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 10, display: 'flex', gap: 10 }}>
          <button onClick={togglePlay} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: isPaused ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 12
          }}>
            <i className={`fa-solid ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
          </button>
          <button onClick={toggleSound} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: isMuted ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 12
          }}>
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
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
            position: 'absolute', bottom: 28, left: '50%',
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
        @media (max-width: 1024px) {
          h2 { font-size: 40px !important; }
        }
        @media (max-width: 768px) {
          h2 { font-size: 32px !important; margin-bottom: 12px !important; }
          p { font-size: 12px !important; }
          span { font-size: 10px !important; }
        }
        @media (max-width: 480px) {
          h2 { font-size: 26px !important; }
          p { font-size: 11px !important; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

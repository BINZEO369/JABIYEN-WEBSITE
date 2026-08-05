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
  const isMutedRef = useRef(true);
  const preloadedVideos = useRef({});
  const individualProgressRef = useRef({});

  const videoDuration = 20000; // 20 seconds

  // Preload all videos for faster switching
  useEffect(() => {
    if (!videos.length) return;
    
    videos.forEach((video, index) => {
      if (!preloadedVideos.current[index] && video.video_url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = video.video_url;
        document.head.appendChild(link);
        
        const preloadVideo = document.createElement('video');
        preloadVideo.preload = 'auto';
        preloadVideo.src = video.video_url;
        preloadVideo.muted = true;
        preloadedVideos.current[index] = preloadVideo;
        
        // Initialize individual progress
        individualProgressRef.current[index] = 0;
      }
    });
  }, [videos]);

  // Load video with faster transition
  useEffect(() => {
    if (!videos.length || !playerRef.current) return;
    
    const video = videos[currentIndex];
    setIsTransitioning(true);
    setTextPhase('exiting');

    const textOutTimer = setTimeout(() => {
      setTextPhase('entering');
      
      if (playerRef.current) {
        playerRef.current.src = video.video_url;
        playerRef.current.muted = isMutedRef.current;
        playerRef.current.preload = 'auto';
        playerRef.current.load();
      }
    }, 200);

    return () => clearTimeout(textOutTimer);
  }, [currentIndex, videos]);

  // Handle video load
  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    setIsTransitioning(false);
    setTextPhase('visible');
    
    if (!isPaused && playerRef.current) {
      playerRef.current.play().catch(() => {});
    }
  }, [isPaused]);

  // Progress tracking for current video
  useEffect(() => {
    if (!isLoaded || isPaused || isTransitioning) {
      clearInterval(progressIntervalRef.current);
      return;
    }

    const interval = 50;
    const totalSteps = videoDuration / interval;
    let step = 0;
    setProgress(0);
    
    // Reset individual progress for current video
    individualProgressRef.current[currentIndex] = 0;

    progressIntervalRef.current = setInterval(() => {
      step++;
      const currentProgress = Math.min((step / totalSteps) * 100, 100);
      setProgress(currentProgress);
      individualProgressRef.current[currentIndex] = currentProgress;
      
      if (step >= totalSteps) clearInterval(progressIntervalRef.current);
    }, interval);

    return () => clearInterval(progressIntervalRef.current);
  }, [isLoaded, isPaused, isTransitioning, videoDuration, currentIndex]);

  // Autoplay
  useEffect(() => {
    if (videos.length <= 1 || isPaused) {
      clearInterval(autoplayIntervalRef.current);
      return;
    }

    autoplayIntervalRef.current = setInterval(() => {
      if (!isTransitioning && isLoaded && !isPaused) {
        // Mark current video as completed
        individualProgressRef.current[currentIndex] = 100;
        setCurrentIndex(prev => (prev + 1) % videos.length);
      }
    }, videoDuration);

    return () => clearInterval(autoplayIntervalRef.current);
  }, [videos.length, isPaused, isTransitioning, isLoaded, videoDuration, currentIndex]);

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
      isMutedRef.current = newMutedState;
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
    individualProgressRef.current[currentIndex] = 100;
    clearInterval(autoplayIntervalRef.current);
    clearInterval(progressIntervalRef.current);
    setTimeout(() => setCurrentIndex(index), 200);
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
      {/* Video Container */}
      <div style={{
        position: 'relative', 
        width: '100%',
        height: '100vh',
        maxHeight: '850px',
        display: 'flex',
        alignItems: 'flex-end', 
        justifyContent: 'center'
      }}>
        <video
          ref={playerRef}
          muted={isMuted}
          playsInline
          loop
          preload="auto"
          onCanPlay={handleCanPlay}
          style={{
            position: 'absolute', 
            inset: 0, 
            width: '100%', 
            height: '100%',
            objectFit: 'cover', 
            pointerEvents: 'none',
            filter: 'brightness(0.85)',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute', 
          inset: 0, 
          zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)'
        }} />

        {/* Text Content */}
        <div style={{
          position: 'relative', 
          zIndex: 2, 
          textAlign: 'center',
          padding: '0 24px', 
          maxWidth: '800px', 
          width: '100%', 
          marginBottom: '80px'
        }}>
          {currentVideo?.label && (
            <span style={{
              display: 'inline-block', 
              color: 'rgba(255,255,255,0.55)',
              fontSize: '11px', 
              fontWeight: 600, 
              letterSpacing: '0.3em',
              textTransform: 'uppercase', 
              marginBottom: '16px',
              opacity: textPhase === 'visible' ? 1 : 0,
              transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-20px)' : 'translateY(14px)',
              filter: textPhase === 'visible' ? 'blur(0)' : 'blur(4px)',
              transition: textPhase === 'exiting' ? 'all 0.3s ease' : 'all 0.5s ease'
            }}>
              {currentVideo.label}
            </span>
          )}

          {currentVideo?.title && (
            <h2 style={{
              color: '#fff', 
              fontSize: 'clamp(32px, 5vw, 56px)', 
              fontWeight: 800,
              lineHeight: 1.1, 
              margin: '0 0 20px', 
              letterSpacing: '-0.02em',
              opacity: textPhase === 'visible' ? 1 : 0,
              transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-20px)' : 'translateY(18px)',
              filter: textPhase === 'visible' ? 'blur(0)' : 'blur(6px)',
              transition: textPhase === 'exiting' ? 'all 0.3s ease' : 'all 0.6s ease'
            }}>
              {currentVideo.title}
            </h2>
          )}

          {currentVideo?.description && (
            <p style={{
              color: 'rgba(255,255,255,0.7)', 
              fontSize: 'clamp(12px, 1.5vw, 16px)',
              maxWidth: '600px', 
              margin: '0 auto 32px', 
              lineHeight: 1.6,
              opacity: textPhase === 'visible' ? 1 : 0,
              transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-20px)' : 'translateY(12px)',
              filter: textPhase === 'visible' ? 'blur(0)' : 'blur(3px)',
              transition: textPhase === 'exiting' ? 'all 0.3s ease' : 'all 0.6s ease'
            }}>
              {currentVideo.description}
            </p>
          )}

          {showCTA && (
            <a 
              href={currentVideo.cta_link} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '16px 40px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                opacity: textPhase === 'visible' ? 1 : 0,
                transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-10px)' : 'translateY(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-10px)' : 'translateY(10px)';
              }}
            >
              {currentVideo.cta_title}
            </a>
          )}
        </div>

        {/* Controls */}
        <div style={{ 
          position: 'absolute', 
          bottom: '40px', 
          right: '40px', 
          zIndex: 10, 
          display: 'flex', 
          gap: '8px',
          alignItems: 'center'
        }}>
          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
              outline: 'none',
              opacity: 0.8
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <img 
              src="/videoicon.png" 
              alt={isPaused ? "Play" : "Pause"}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                opacity: isPaused ? 0.5 : 0.8
              }}
            />
          </button>

          {/* Sound Button */}
          <button 
            onClick={toggleSound}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
              outline: 'none',
              opacity: 0.8
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.8';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <img 
              src="/soundicon.png" 
              alt={isMuted ? "Unmute" : "Mute"}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                opacity: isMuted ? 0.5 : 0.8
              }}
            />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          height: '3px',
          background: 'rgba(255,255,255,0.5)', 
          zIndex: 3,
          width: `${progress}%`, 
          transition: 'width 0.1s linear'
        }} />

        {/* Line Navigation - Netflix/Apple Style */}
        {videos.length > 1 && (
          <div style={{
            position: 'absolute', 
            bottom: '12px', 
            left: '50%',
            transform: 'translateX(-50%)', 
            zIndex: 3,
            display: 'flex', 
            gap: '4px',
            width: 'auto',
            maxWidth: '300px',
            padding: '0 20px'
          }}>
            {videos.map((_, i) => {
              const isActive = i === currentIndex;
              const progressValue = individualProgressRef.current[i] || 0;
              
              return (
                <button
                  key={i}
                  onClick={() => switchToVideo(i)}
                  style={{
                    height: '2px',
                    flex: 1,
                    minWidth: '20px',
                    maxWidth: '60px',
                    background: isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '1px',
                    cursor: 'pointer',
                    padding: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background 0.3s ease'
                  }}
                >
                  {/* Active progress fill */}
                  <span style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: isActive ? `${progress}%` : '0%',
                    background: '#fff',
                    borderRadius: '1px',
                    transition: 'width 0.1s linear'
                  }} />
                </button>
              );
            })}
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
      `}</style>
    </section>
  );
}

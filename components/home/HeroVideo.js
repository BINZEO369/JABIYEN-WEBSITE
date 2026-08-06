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
  const [isInViewport, setIsInViewport] = useState(true);
  const [wasManuallyUnmuted, setWasManuallyUnmuted] = useState(false);

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const autoplayIntervalRef = useRef(null);
  const isMutedRef = useRef(true);
  const preloadedVideos = useRef({});
  const sectionRef = useRef(null);
  const observerRef = useRef(null);

  const videoDuration = 20000; // 20 seconds per video

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (!sectionRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
          
          if (!entry.isIntersecting && playerRef.current) {
            // Auto mute when scrolling away from video
            playerRef.current.muted = true;
            setIsMuted(true);
            isMutedRef.current = true;
            setWasManuallyUnmuted(false);
          } else if (entry.isIntersecting && wasManuallyUnmuted && playerRef.current) {
            // Restore unmuted state if user had manually unmuted
            playerRef.current.muted = false;
            setIsMuted(false);
            isMutedRef.current = false;
          }
        });
      },
      {
        threshold: [0, 0.1, 0.5],
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    observerRef.current.observe(sectionRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [wasManuallyUnmuted]);

  // Handle scroll-based visibility for video playback
  useEffect(() => {
    if (!playerRef.current || !isLoaded) return;

    if (!isInViewport && !isPaused) {
      // Pause video when not in viewport (saves resources)
      playerRef.current.pause();
    } else if (isInViewport && !isPaused && isLoaded) {
      // Resume playback when back in viewport
      playerRef.current.play().catch(() => {});
    }
  }, [isInViewport, isPaused, isLoaded]);

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
        
        // Preload video element
        const preloadVideo = document.createElement('video');
        preloadVideo.preload = 'auto';
        preloadVideo.src = video.video_url;
        preloadVideo.muted = true;
        preloadedVideos.current[index] = preloadVideo;
      }
    });
  }, [videos]);

  // Load video with faster transition
  useEffect(() => {
    if (!videos.length || !playerRef.current) return;
    
    const video = videos[currentIndex];
    setIsTransitioning(true);
    setTextPhase('exiting');

    // Faster text transition
    const textOutTimer = setTimeout(() => {
      setTextPhase('entering');
      
      if (playerRef.current) {
        playerRef.current.src = video.video_url;
        playerRef.current.muted = isMutedRef.current;
        playerRef.current.preload = 'auto';
        playerRef.current.load();
      }
    }, 200); // Reduced from 400ms

    return () => clearTimeout(textOutTimer);
  }, [currentIndex, videos]);

  // Handle video load
  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    setIsTransitioning(false);
    setTextPhase('visible');
    
    if (!isPaused && playerRef.current && isInViewport) {
      playerRef.current.play().catch(() => {});
    }
  }, [isPaused, isInViewport]);

  // Progress tracking
  useEffect(() => {
    if (!isLoaded || isPaused || isTransitioning || !isInViewport) {
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
  }, [isLoaded, isPaused, isTransitioning, videoDuration, isInViewport]);

  // Autoplay
  useEffect(() => {
    if (videos.length <= 1 || isPaused || !isInViewport) {
      clearInterval(autoplayIntervalRef.current);
      return;
    }

    autoplayIntervalRef.current = setInterval(() => {
      if (!isTransitioning && isLoaded && !isPaused) {
        setCurrentIndex(prev => (prev + 1) % videos.length);
      }
    }, videoDuration);

    return () => clearInterval(autoplayIntervalRef.current);
  }, [videos.length, isPaused, isTransitioning, isLoaded, videoDuration, isInViewport]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(progressIntervalRef.current);
      clearInterval(autoplayIntervalRef.current);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (playerRef.current) {
      const newMutedState = !playerRef.current.muted;
      playerRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      isMutedRef.current = newMutedState;
      
      // Track if user manually unmuted
      if (!newMutedState) {
        setWasManuallyUnmuted(true);
      } else {
        setWasManuallyUnmuted(false);
      }
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!playerRef.current) return;

    if (isPaused) {
      if (isInViewport) {
        playerRef.current.play().catch(() => {});
      }
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
    setTimeout(() => setCurrentIndex(index), 200); // Faster switch
  };

  if (!videos.length) return null;

  const currentVideo = videos[currentIndex];
  const showCTA = currentVideo?.cta_title && currentVideo?.cta_link;

  return (
    <section 
      ref={sectionRef}
      className="hero-video-section"
      style={{
        position: 'relative',
        width: '100%',
        background: '#000',
        overflow: 'hidden'
      }}
    >
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
          preload="auto"
          onCanPlay={handleCanPlay}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', pointerEvents: 'none',
            filter: 'brightness(0.85)',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
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
              transition: textPhase === 'exiting' ? 'all 0.3s ease' : 'all 0.5s ease'
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
              transition: textPhase === 'exiting' ? 'all 0.3s ease' : 'all 0.6s ease'
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
                transition: 'all 0.3s ease',
                opacity: textPhase === 'visible' ? 1 : 0,
                transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-10px)' : 'translateY(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              {currentVideo.cta_title}
            </a>
          )}
        </div>

        {/* Controls - Same size buttons with image icons */}
        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          right: 20, 
          zIndex: 10, 
          display: 'flex', 
          gap: 6,
          alignItems: 'center'
        }}>
          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay}
            style={{
              width: 24,
              height: 24,
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
              width: 24,
              height: 24,
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

        {/* Line-style Navigation Indicators (like world-class websites) */}
        {videos.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            display: 'flex',
            gap: 4,
            alignItems: 'center'
          }}>
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => switchToVideo(i)}
                style={{
                  width: i === currentIndex ? 32 : 16,
                  height: 3,
                  borderRadius: 2,
                  background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  padding: 0,
                  transform: i === currentIndex ? 'scaleY(1.5)' : 'scaleY(1)',
                }}
                onMouseEnter={(e) => {
                  if (i !== currentIndex) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
                    e.currentTarget.style.width = '24px';
                  }
                }}
                onMouseLeave={(e) => {
                  if (i !== currentIndex) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.width = '16px';
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom Progress Bar */}
        {videos.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'rgba(255,255,255,0.1)',
            zIndex: 3
          }}>
            <div style={{
              height: '100%',
              background: 'rgba(255,255,255,0.5)',
              width: `${progress}%`,
              transition: 'width 0.1s linear'
            }} />
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

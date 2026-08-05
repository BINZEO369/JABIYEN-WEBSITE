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
  const [showFullVideoCard, setShowFullVideoCard] = useState(false);
  const [isFullVideoOpen, setIsFullVideoOpen] = useState(false);

  const playerRef = useRef(null);
  const fullVideoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const autoplayIntervalRef = useRef(null);
  const isMutedRef = useRef(true);
  const preloadedVideos = useRef({});
  const cardTimerRef = useRef(null);

  const videoDuration = 8000;
  const cardAppearTime = 6500; // Show card at 6.5 seconds

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
    setShowFullVideoCard(false);
    setIsFullVideoOpen(false);
    
    // Clear any existing card timer
    if (cardTimerRef.current) {
      clearTimeout(cardTimerRef.current);
    }

    // Faster text transition
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

  // Show full video card after cardAppearTime
  useEffect(() => {
    if (!isLoaded || isPaused || isTransitioning) {
      if (cardTimerRef.current) {
        clearTimeout(cardTimerRef.current);
      }
      return;
    }

    cardTimerRef.current = setTimeout(() => {
      setShowFullVideoCard(true);
    }, cardAppearTime);

    return () => {
      if (cardTimerRef.current) {
        clearTimeout(cardTimerRef.current);
      }
    };
  }, [isLoaded, isPaused, isTransitioning, currentIndex]);

  // Reset card when video changes or pauses
  useEffect(() => {
    setShowFullVideoCard(false);
    setIsFullVideoOpen(false);
  }, [currentIndex, isPaused]);

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
    if (videos.length <= 1 || isPaused || isFullVideoOpen) {
      clearInterval(autoplayIntervalRef.current);
      return;
    }

    autoplayIntervalRef.current = setInterval(() => {
      if (!isTransitioning && isLoaded && !isPaused && !isFullVideoOpen) {
        setCurrentIndex(prev => (prev + 1) % videos.length);
      }
    }, videoDuration);

    return () => clearInterval(autoplayIntervalRef.current);
  }, [videos.length, isPaused, isTransitioning, isLoaded, videoDuration, isFullVideoOpen]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearInterval(progressIntervalRef.current);
      clearInterval(autoplayIntervalRef.current);
      if (cardTimerRef.current) {
        clearTimeout(cardTimerRef.current);
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
    setTimeout(() => setCurrentIndex(index), 200);
  };

  const openFullVideo = (e) => {
    e.stopPropagation();
    setIsFullVideoOpen(true);
    setShowFullVideoCard(false);
    
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPaused(true);
    }
    
    // Clear autoplay interval
    clearInterval(autoplayIntervalRef.current);
    
    // Play full video in background with sound
    setTimeout(() => {
      if (playerRef.current) {
        playerRef.current.currentTime = 0;
        playerRef.current.muted = false;
        setIsMuted(false);
        isMutedRef.current = false;
        playerRef.current.play().catch(() => {});
        setIsPaused(false);
      }
    }, 100);
  };

  const closeFullVideo = (e) => {
    e.stopPropagation();
    setIsFullVideoOpen(false);
    
    if (playerRef.current) {
      playerRef.current.muted = isMutedRef.current;
    }
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

        {/* Full Video Overlay */}
        {isFullVideoOpen && (
          <div 
            style={{
              position: 'absolute', inset: 0, zIndex: 4,
              background: 'rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 20, right: 20,
              zIndex: 5
            }}>
              <button
                onClick={closeFullVideo}
                style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '40px',
              animation: 'slideUp 0.5s ease'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255,255,255,0.3)',
                marginBottom: 20
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <h3 style={{
                color: '#fff',
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 8
              }}>
                Watching Full Video
              </h3>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 14,
                marginBottom: 24
              }}>
                {currentVideo?.title || 'Enjoy the complete experience'}
              </p>
              <div style={{
                width: 60,
                height: 3,
                background: 'rgba(255,255,255,0.3)',
                borderRadius: 2,
                margin: '0 auto',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: '#fff',
                  animation: 'loadingBar 1.5s infinite'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Text Content */}
        {!isFullVideoOpen && (
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
        )}

        {/* Watch Full Video Card */}
        {showFullVideoCard && !isFullVideoOpen && (
          <div style={{
            position: 'absolute',
            bottom: 120,
            right: 40,
            zIndex: 3,
            animation: 'cardSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <button
              onClick={openFullVideo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 20,
                padding: '20px 28px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                color: '#fff',
                textAlign: 'left',
                maxWidth: 320,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.boxShadow = '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2) inset';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset';
              }}
            >
              {/* Play Icon */}
              <div style={{
                width: 56,
                height: 56,
                minWidth: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
                border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
                  animation: 'pulse 2s infinite'
                }} />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>

              {/* Text Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 6
                }}>
                  Watch Full Video
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  marginBottom: 4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {currentVideo?.title || 'Discover More'}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {currentVideo?.duration || 'Full Length'}
                </div>
              </div>

              {/* Arrow */}
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="rgba(255,255,255,0.6)" 
                strokeWidth="2"
                style={{ 
                  minWidth: 20,
                  transition: 'all 0.3s ease'
                }}
              >
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullVideoCard(false);
              }}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.9)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✕
            </button>
          </div>
        )}

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

        {/* Progress Bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 2,
          background: 'rgba(255,255,255,0.5)', zIndex: 3,
          width: `${progress}%`, transition: 'width 0.1s linear'
        }} />

        {/* Dots Navigation */}
        {videos.length > 1 && !isFullVideoOpen && (
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
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes cardSlideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
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

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
  const [showFullVideo, setShowFullVideo] = useState(false);
  const [fullVideoData, setFullVideoData] = useState(null);

  const playerRef = useRef(null);
  const fullVideoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const autoplayIntervalRef = useRef(null);
  const isMutedRef = useRef(true);
  const preloadedVideos = useRef({});

  const videoDuration = 8000;

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

  // Full video cleanup
  useEffect(() => {
    if (showFullVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (fullVideoRef.current) {
        fullVideoRef.current.pause();
        fullVideoRef.current.src = '';
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFullVideo]);

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

  const openFullVideo = (videoData) => {
    setFullVideoData(videoData);
    setShowFullVideo(true);
    // Pause hero video
    if (playerRef.current) {
      playerRef.current.pause();
      setIsPaused(true);
    }
  };

  const closeFullVideo = () => {
    setShowFullVideo(false);
    setFullVideoData(null);
    // Resume hero video
    if (playerRef.current && isPaused) {
      playerRef.current.play().catch(() => {});
      setIsPaused(false);
    }
  };

  if (!videos.length) return null;

  const currentVideo = videos[currentIndex];
  const showCTA = currentVideo?.cta_title && currentVideo?.cta_link;

  return (
    <>
      <section 
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

            {/* Action Buttons Container */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Watch Full Video Button */}
              <button
                onClick={() => openFullVideo(currentVideo)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '14px 36px',
                  borderRadius: '100px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: textPhase === 'visible' ? 1 : 0,
                  transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-10px)' : 'translateY(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Full Video
              </button>

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
                    transition: 'all 0.3s ease'
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
        `}</style>
      </section>

      {/* Full Video Modal */}
      {showFullVideo && fullVideoData && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {/* Backdrop */}
          <div 
            onClick={closeFullVideo}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          />

          {/* Video Container */}
          <div style={{
            position: 'relative',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            background: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            animation: 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Close Button */}
            <button
              onClick={closeFullVideo}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.3s ease',
                padding: 0,
                lineHeight: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ✕
            </button>

            {/* Video Player */}
            <video
              ref={fullVideoRef}
              src={fullVideoData.video_url}
              controls
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '85vh',
                display: 'block',
                objectFit: 'contain'
              }}
            />

            {/* Video Info Bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '20px 24px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                {fullVideoData.label && (
                  <span style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    {fullVideoData.label}
                  </span>
                )}
                {fullVideoData.title && (
                  <h3 style={{
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 700,
                    margin: 0,
                    lineHeight: 1.3
                  }}>
                    {fullVideoData.title}
                  </h3>
                )}
              </div>

              {fullVideoData.cta_title && fullVideoData.cta_link && (
                <a
                  href={fullVideoData.cta_link}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '10px 24px',
                    background: '#fff',
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    borderRadius: '100px',
                    letterSpacing: '0.05em',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {fullVideoData.cta_title}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}

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
            playerRef.current.muted = true;
            setIsMuted(true);
            isMutedRef.current = true;
            setWasManuallyUnmuted(false);
          } else if (entry.isIntersecting && wasManuallyUnmuted && playerRef.current) {
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
      playerRef.current.pause();
    } else if (isInViewport && !isPaused && isLoaded) {
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
    setTimeout(() => setCurrentIndex(index), 200);
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
        background: '#fff', // ✅ সাদা ব্যাকগ্রাউন্ড
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

        {/* Dark Gradient Overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)'
        }} />

        {/* Text Content */}
        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          padding: '0 24px', maxWidth: 800, width: '100%', marginBottom: 80
        }}>
          {currentVideo?.label && (
            <span style={{
              display: 'inline-block', color: 'rgba(255,255,255,0.75)',
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.3em',
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
              color: '#fff', 
              fontSize: 'clamp(28px, 5vw, 64px)', 
              fontWeight: 300, 
              lineHeight: 1.1, 
              margin: '0 0 16px', 
              letterSpacing: '2px',
              textTransform: 'uppercase',
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
              color: 'rgba(255,255,255,0.75)', 
              fontSize: 'clamp(10px, 1.2vw, 14px)', 
              maxWidth: 480, 
              margin: '0 auto 24px', 
              lineHeight: 1.5,
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
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '14px 32px',
                borderRadius: '0', // ✅ শার্প কর্নার
                background: 'transparent', // ✅ ট্রান্সপারেন্ট
                border: '1px solid #fff', // ✅ সলিড হোয়াইট বর্ডার
                transition: 'all 0.3s ease',
                opacity: textPhase === 'visible' ? 1 : 0,
                transform: textPhase === 'visible' ? 'translateY(0)' : textPhase === 'exiting' ? 'translateY(-10px)' : 'translateY(10px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#fff';
              }}
            >
              {currentVideo.cta_title}
            </a>
          )}
        </div>

        {/* Controls - Play/Pause & Sound */}
        <div style={{ 
          position: 'absolute', 
          bottom: 30, 
          right: 30, 
          zIndex: 11, 
          display: 'flex', 
          gap: 12,
          alignItems: 'center'
        }}>
          <button 
            onClick={togglePlay}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, outline: 'none',
              opacity: isPaused ? 0.5 : 0.9, transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = isPaused ? '0.5' : '0.9'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <img 
              src="/videoicon.png" 
              alt={isPaused ? "Play" : "Pause"}
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          </button>

          <button 
            onClick={toggleSound}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'transparent', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, outline: 'none',
              opacity: isMuted ? 0.5 : 0.9, transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = isMuted ? '0.5' : '0.9'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <img 
              src="/soundicon.png" 
              alt={isMuted ? "Unmute" : "Mute"}
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          </button>
        </div>

        {/* Line Indicators */}
        {videos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
            zIndex: 11, display: 'flex', gap: 6, alignItems: 'center'
          }}>
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => switchToVideo(i)}
                style={{
                  width: i === currentIndex ? 60 : 32,
                  height: 1.5, // ✅ সরু লাইন
                  borderRadius: 0,
                  background: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.4s ease', outline: 'none', padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom Progress Bar */}
        {videos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: 'rgba(255,255,255,0.1)', zIndex: 11
          }}>
            <div style={{
              height: '100%', background: 'rgba(255,255,255,0.5)',
              width: `${progress}%`, transition: 'width 0.1s linear'
            }} />
          </div>
        )}
      </div>

      <style jsx>{`
        /* ✅ উপরের দিকের সাদা শ্যাডো (Top Fade) */
        .hero-video-section::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 15%; /* ভিডিওর জন্য একটু কম রাখা হলো */
          background: linear-gradient(
            to bottom, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 255, 255, 0.8) 30%, 
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        /* ✅ নিচের দিকের সাদা শ্যাডো (Bottom Fade) */
        .hero-video-section::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 15%; 
          background: linear-gradient(
            to top, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 255, 255, 0.8) 30%, 
            rgba(255, 255, 255, 0) 100%
          );
          z-index: 2;
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          .hero-video-section::before, .hero-video-section::after {
            height: 10%; /* মোবাইলে আরও কম */
          }
        }
      `}</style>
    </section>
  );
}

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
  const [videoDimensions, setVideoDimensions] = useState({ width: 1920, height: 1080 });
  const [containerHeight, setContainerHeight] = useState('100vh');
  const [videoFit, setVideoFit] = useState('cover');

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const autoplayIntervalRef = useRef(null);
  const isMutedRef = useRef(true);
  const preloadedVideos = useRef({});

  const videoDuration = 8000;

  // Detect video dimensions and adjust container
  const handleVideoMetadata = useCallback((e) => {
    const video = e.target;
    if (video.videoWidth && video.videoHeight) {
      const width = video.videoWidth;
      const height = video.videoHeight;
      setVideoDimensions({ width, height });
      
      // Calculate aspect ratio
      const aspectRatio = width / height;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const viewportRatio = viewportWidth / viewportHeight;
      
      // If video is wider than viewport, use "contain" to show full video
      if (aspectRatio > viewportRatio) {
        setVideoFit('contain');
        setContainerHeight('100vh');
      } else if (aspectRatio < 1) {
        // Vertical/portrait video
        setVideoFit('contain');
        setContainerHeight('100vh');
      } else {
        // Standard video - use cover
        setVideoFit('cover');
        setContainerHeight('100vh');
      }
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (videoDimensions.width && videoDimensions.height) {
        const aspectRatio = videoDimensions.width / videoDimensions.height;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const viewportRatio = viewportWidth / viewportHeight;
        
        if (aspectRatio > viewportRatio || aspectRatio < 1) {
          setVideoFit('contain');
        } else {
          setVideoFit('cover');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [videoDimensions]);

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

  if (!videos.length) return null;

  const currentVideo = videos[currentIndex];
  const showCTA = currentVideo?.cta_title && currentVideo?.cta_link;

  return (
    <section 
      className="hero-video-section"
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: containerHeight,
        minHeight: '600px',
        maxHeight: '100vh',
        background: '#000',
        overflow: 'hidden'
      }}
    >
      {/* Background color for letterbox areas */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: '#000',
        zIndex: 0
      }} />

      {/* Video Container with Smart Fitting */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <video
          ref={playerRef}
          muted={isMuted}
          playsInline
          loop
          preload="auto"
          onCanPlay={handleCanPlay}
          onLoadedMetadata={handleVideoMetadata}
          style={{
            width: videoFit === 'contain' ? '100%' : '100%',
            height: videoFit === 'contain' ? '100%' : '100%',
            objectFit: videoFit,
            objectPosition: 'center center',
            pointerEvents: 'none',
            filter: 'brightness(0.85)',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
      </div>

      {/* Gradient Overlay - Always full container */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.6) 100%)'
      }} />

      {/* Text Content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        textAlign: 'center',
        padding: '0 24px 60px',
        maxWidth: 700,
        margin: '0 auto',
        width: '100%'
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

      {/* Controls */}
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

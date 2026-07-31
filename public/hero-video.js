// ============================================================
// hero-video.js - JAYENWARE Hero Video Section Component
// Apple-Style Hero Video Section with Auto-Play Videos
// Version: 1.0.3 - Fixed Full-Screen Heights
// ============================================================

(function() {
    'use strict';

    // ==================== JABIYEN FONTS CONFIGURATION ====================
    const JABIYEN_FONTS = {
        families: {
            heading: "'Manrope', sans-serif",
            subtitle: "'Sora', sans-serif",
            body: "'Inter', sans-serif"
        },

        weights: {
            heading: {
                regular: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
                extrabold: 800
            },
            subtitle: {
                regular: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
                extrabold: 800
            },
            body: {
                light: 300,
                regular: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
                extrabold: 800,
                black: 900
            }
        },

        cssVariables: {
            '--font-heading': "'Manrope', sans-serif",
            '--font-subtitle': "'Sora', sans-serif",
            '--font-body': "'Inter', sans-serif",
            '--font-accent': "'Inter', sans-serif",
            '--text-xs': '0.75rem',
            '--text-sm': '0.875rem',
            '--text-base': '1rem',
            '--text-lg': '1.125rem',
            '--text-xl': '1.25rem',
            '--text-2xl': '1.5rem',
            '--text-3xl': '1.875rem',
            '--text-4xl': '2.25rem',
            '--text-5xl': '3rem',
            '--tracking-tight': '-0.5px',
            '--tracking-normal': '0',
            '--tracking-wide': '0.5px',
            '--tracking-wider': '1px',
            '--tracking-widest': '1.5px'
        }
    };

    // Apply CSS variables to :root
    function applyFontVariables() {
        const root = document.documentElement;
        const vars = JABIYEN_FONTS.cssVariables;
        for (const [key, value] of Object.entries(vars)) {
            root.style.setProperty(key, value);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFontVariables);
    } else {
        applyFontVariables();
    }

    // ==================== CSS STYLES ====================
    const HERO_VIDEO_CSS = `
        <style id="hero-video-styles">
            .hero-video-section {
                position: relative;
                width: 100%;
                background: #000;
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .hero-video-section.visible {
                opacity: 1;
                transform: translateY(0);
            }
            .hero-video-section.hidden-section {
                display: none;
            }
            
            /* 
               FIXED HEIGHTS FOR THREE DEVICE CATEGORIES:
               - Desktop (1025px+): 900px → covers most laptop/desktop screens without scrolling
               - Tablet (769px–1024px): 700px
               - Mobile (up to 768px): 850px → iPhone 15/16/17 Pro full screen (approx 852px)
               - Small Mobile (up to 480px): 750px → compact iPhones & Androids
            */
            
            .hero-video-wrapper {
                position: relative;
                width: 100%;
                height: 850px; /* Default: Mobile full screen */
                display: flex;
                align-items: flex-end;
                justify-content: center;
            }
            
            /* Desktop: Large full-screen block */
            @media (min-width: 1025px) {
                .hero-video-wrapper {
                    height: 900px;
                }
            }
            
            /* Tablet */
            @media (min-width: 769px) and (max-width: 1024px) {
                .hero-video-wrapper {
                    height: 700px;
                }
            }
            
            /* Mobile (iPhone 15/16/17 Pro scale) */
            @media (max-width: 768px) {
                .hero-video-wrapper {
                    height: 850px;
                }
            }
            
            /* Small Mobile */
            @media (max-width: 480px) {
                .hero-video-wrapper {
                    height: 750px;
                }
            }
            
            .hero-video-bg {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                pointer-events: none;
                user-select: none;
                filter: brightness(0.85);
                transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .hero-video-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    to bottom,
                    rgba(0,0,0,0.1) 0%,
                    rgba(0,0,0,0.0) 30%,
                    rgba(0,0,0,0.0) 70%,
                    rgba(0,0,0,0.6) 100%
                );
                z-index: 1;
                pointer-events: none;
            }
            
            .hero-video-content {
                position: relative;
                z-index: 2;
                text-align: center;
                padding: 0 24px;
                max-width: 700px;
                width: 100%;
                margin-bottom: 60px;
            }
            
            @media (max-width: 768px) {
                .hero-video-content {
                    margin-bottom: 50px;
                    padding: 0 20px;
                }
            }
            
            @media (max-width: 480px) {
                .hero-video-content {
                    margin-bottom: 40px;
                    padding: 0 16px;
                }
            }
            
            .hero-video-label {
                display: inline-block;
                font-family: var(--font-body);
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.3em;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.55);
                margin-bottom: 16px;
                opacity: 0;
                transform: translateY(14px);
                filter: blur(4px);
                transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, 
                            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, 
                            filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
            }
            @media (max-width: 768px) {
                .hero-video-label {
                    font-size: 10px;
                    letter-spacing: 0.25em;
                    margin-bottom: 12px;
                }
            }
            @media (max-width: 480px) {
                .hero-video-label {
                    font-size: 9px;
                    letter-spacing: 0.2em;
                    margin-bottom: 10px;
                }
            }
            .hero-video-section.visible .hero-video-label {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
            }
            
            .hero-video-title {
                font-family: var(--font-heading);
                font-size: 48px;
                font-weight: 800;
                line-height: 1.1;
                color: #ffffff;
                margin: 0 0 16px 0;
                letter-spacing: -0.02em;
                opacity: 0;
                transform: translateY(18px);
                filter: blur(6px);
                transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, 
                            transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, 
                            filter 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
            }
            @media (max-width: 1024px) {
                .hero-video-title {
                    font-size: 40px;
                }
            }
            @media (max-width: 768px) {
                .hero-video-title {
                    font-size: 32px;
                    margin: 0 0 12px 0;
                }
            }
            @media (max-width: 480px) {
                .hero-video-title {
                    font-size: 26px;
                    margin: 0 0 10px 0;
                }
            }
            .hero-video-section.visible .hero-video-title {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
            }
            
            .hero-video-desc {
                font-family: var(--font-body);
                font-size: 14px;
                font-weight: 400;
                line-height: 1.5;
                color: rgba(255, 255, 255, 0.7);
                max-width: 480px;
                margin: 0 auto 24px auto;
                opacity: 0;
                transform: translateY(12px);
                filter: blur(3px);
                transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s, 
                            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s, 
                            filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.35s;
            }
            @media (max-width: 768px) {
                .hero-video-desc {
                    font-size: 12px;
                    max-width: 400px;
                    margin: 0 auto 20px auto;
                }
            }
            @media (max-width: 480px) {
                .hero-video-desc {
                    font-size: 11px;
                    max-width: 320px;
                    margin: 0 auto 18px auto;
                }
            }
            .hero-video-section.visible .hero-video-desc {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
            }
            
            .hero-video-cta {
                display: inline-flex;
                align-items: center;
                font-family: var(--font-body);
                font-size: 12px;
                font-weight: 600;
                letter-spacing: 0.15em;
                text-transform: uppercase;
                color: #ffffff;
                text-decoration: none;
                padding: 0 0 4px 0;
                border: none;
                border-bottom: 2px solid rgba(255, 255, 255, 0.6);
                background: none;
                cursor: pointer;
                opacity: 0;
                transform: translateY(12px);
                filter: blur(2px);
                transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, 
                            transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s, 
                            filter 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s,
                            border-color 0.3s ease,
                            color 0.3s ease;
            }
            @media (max-width: 768px) {
                .hero-video-cta {
                    font-size: 11px;
                    padding: 0 0 3px 0;
                    border-bottom-width: 1.5px;
                }
            }
            @media (max-width: 480px) {
                .hero-video-cta {
                    font-size: 10px;
                    letter-spacing: 0.12em;
                }
            }
            .hero-video-section.visible .hero-video-cta {
                opacity: 1;
                transform: translateY(0);
                filter: blur(0);
            }
            .hero-video-cta:hover {
                color: rgba(255, 255, 255, 0.9);
                border-bottom-color: #ffffff;
            }
            .hero-video-cta:active {
                border-bottom-color: rgba(255, 255, 255, 0.4);
            }

            .video-text-exit {
                opacity: 0 !important;
                transform: translateY(-20px) !important;
                filter: blur(8px) !important;
                transition: opacity 0.4s cubic-bezier(0.55, 0, 1, 0.45), 
                            transform 0.4s cubic-bezier(0.55, 0, 1, 0.45), 
                            filter 0.4s cubic-bezier(0.55, 0, 1, 0.45) !important;
            }
            .video-text-enter {
                transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), 
                            transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), 
                            filter 0.7s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }

            .hero-video-controls {
                position: absolute;
                bottom: 24px;
                right: 24px;
                z-index: 10;
                display: flex;
                gap: 10px;
                align-items: center;
            }
            @media (max-width: 640px) {
                .hero-video-controls {
                    bottom: 16px;
                    right: 16px;
                    gap: 8px;
                }
            }

            .hero-video-ctrl-btn {
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.12);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                color: rgba(255, 255, 255, 0.75);
                font-size: 12px;
                outline: none;
                opacity: 0;
                transform: scale(0.8);
                animation: ctrlBtnIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards;
            }
            @media (max-width: 640px) {
                .hero-video-ctrl-btn {
                    width: 30px;
                    height: 30px;
                    font-size: 10px;
                }
            }
            @keyframes ctrlBtnIn {
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            .hero-video-ctrl-btn:hover {
                background: rgba(255, 255, 255, 0.22);
                border-color: rgba(255, 255, 255, 0.35);
                color: #ffffff;
                transform: scale(1.08);
                box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            }
            .hero-video-ctrl-btn:active {
                transform: scale(0.92);
                background: rgba(255, 255, 255, 0.18);
            }
            .hero-video-ctrl-btn.muted {
                color: rgba(255, 255, 255, 0.45);
                background: rgba(255, 255, 255, 0.06);
            }
            .hero-video-ctrl-btn.paused-state {
                color: rgba(255, 255, 255, 0.45);
                background: rgba(255, 255, 255, 0.06);
            }
            .hero-video-ctrl-btn .ctrl-icon {
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .hero-video-nav {
                position: absolute;
                bottom: 28px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 3;
                display: flex;
                gap: 8px;
                align-items: center;
            }
            @media (max-width: 640px) {
                .hero-video-nav {
                    bottom: 20px;
                    gap: 6px;
                }
            }
            .hero-video-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: rgba(255,255,255,0.3);
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                border: none;
                outline: none;
                padding: 0;
            }
            @media (max-width: 640px) {
                .hero-video-dot {
                    width: 6px;
                    height: 6px;
                }
            }
            .hero-video-dot:hover {
                background: rgba(255,255,255,0.6);
                transform: scale(1.2);
            }
            .hero-video-dot.active {
                background: #ffffff;
                width: 24px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            @media (max-width: 640px) {
                .hero-video-dot.active {
                    width: 20px;
                }
            }

            .hero-video-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: rgba(255,255,255,0.5);
                z-index: 3;
                transition: width 0.1s linear;
                pointer-events: none;
            }

            .hero-video-loading {
                position: absolute;
                inset: 0;
                background: #000;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5;
                transition: opacity 0.5s ease;
            }
            .hero-video-loading.hidden {
                opacity: 0;
                pointer-events: none;
            }
            .hero-video-spinner {
                width: 40px;
                height: 40px;
                border: 2px solid rgba(255,255,255,0.2);
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: videoSpinner 0.8s linear infinite;
            }
            @keyframes videoSpinner {
                to { transform: rotate(360deg); }
            }

            .hero-video-poster {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                z-index: 0;
                transition: opacity 0.5s ease;
            }
            .hero-video-poster.fade-out {
                opacity: 0;
            }
        </style>
    `;

    // ==================== HTML TEMPLATE ====================
    function getHeroVideoHTML() {
        return `
            <section id="hero-video-section" class="hero-video-section hidden-section">
                <div id="hero-video-loading" class="hero-video-loading">
                    <div class="hero-video-spinner"></div>
                </div>
                <div class="hero-video-wrapper" id="hero-video-wrapper">
                    <img id="hero-video-poster" class="hero-video-poster" src="" alt="" style="display:none;">
                    <video id="hero-video-player" class="hero-video-bg" muted playsinline loop preload="metadata"></video>
                    <div class="hero-video-overlay"></div>
                    <div class="hero-video-content">
                        <span id="hero-video-label" class="hero-video-label"></span>
                        <h2 id="hero-video-title" class="hero-video-title"></h2>
                        <p id="hero-video-desc" class="hero-video-desc"></p>
                        <a id="hero-video-cta" class="hero-video-cta" href="#">
                            <span id="hero-video-cta-text"></span>
                        </a>
                    </div>
                    <div class="hero-video-controls">
                        <button id="hero-video-play-btn" class="hero-video-ctrl-btn" 
                                onclick="window.JAYENWARE.heroVideo.togglePlay()" 
                                aria-label="Play/Pause video">
                            <span class="ctrl-icon" id="play-icon">
                                <i class="fa-solid fa-pause"></i>
                            </span>
                            <span class="ctrl-icon" id="pause-icon" style="display:none;">
                                <i class="fa-solid fa-play"></i>
                            </span>
                        </button>
                        <button id="hero-video-sound-btn" class="hero-video-ctrl-btn muted" 
                                onclick="window.JAYENWARE.heroVideo.toggleSound()" 
                                aria-label="Toggle sound">
                            <span class="ctrl-icon" id="sound-icon-muted">
                                <i class="fa-solid fa-volume-xmark"></i>
                            </span>
                            <span class="ctrl-icon" id="sound-icon-unmuted" style="display:none;">
                                <i class="fa-solid fa-volume-high"></i>
                            </span>
                        </button>
                    </div>
                    <div class="hero-video-progress" id="hero-video-progress"></div>
                    <div class="hero-video-nav" id="hero-video-nav"></div>
                </div>
            </section>
        `;
    }

    // ==================== COMPONENT LOGIC ====================
    class HeroVideoComponent {
        constructor() {
            this.currentIndex = 0;
            this.videos = [];
            this.isTransitioning = false;
            this.isMuted = true;
            this.isPaused = false;
            this.videoDuration = 8000;
            
            this.progressInterval = null;
            this.autoplayInterval = null;
            this.loadingTimeout = null;
            
            this.section = null;
            this.player = null;
            this.poster = null;
            this.loadingOverlay = null;
            this.progressBar = null;
            this.navContainer = null;
            
            this.isInitialized = false;
            this.isVideoLoaded = false;
        }

        init(data, options = {}) {
            if (!data || data.length === 0) {
                console.warn('[HeroVideo] No video data provided. Hiding section.');
                this.hide();
                return;
            }

            this.videos = data;
            this.videoDuration = options.videoDuration || 8000;
            this.isMuted = options.muted !== undefined ? options.muted : true;

            this.cacheElements();

            if (!this.section) {
                console.error('[HeroVideo] #hero-video-section not found in DOM');
                return;
            }

            this.show();
            this.setupNavigation();
            this.loadVideo(0);
            this.startAutoplay();

            this.isInitialized = true;
            console.log('[HeroVideo] Initialized with', this.videos.length, 'videos – Full-Screen Fixed Heights');
        }

        cacheElements() {
            this.section = document.getElementById('hero-video-section');
            this.player = document.getElementById('hero-video-player');
            this.poster = document.getElementById('hero-video-poster');
            this.loadingOverlay = document.getElementById('hero-video-loading');
            this.progressBar = document.getElementById('hero-video-progress');
            this.navContainer = document.getElementById('hero-video-nav');
        }

        show() {
            if (!this.section) return;
            this.section.classList.remove('hidden-section');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.section.classList.add('visible');
                });
            });
        }

        hide() {
            if (!this.section) return;
            this.cleanup();
            this.section.classList.add('hidden-section');
            this.section.classList.remove('visible');
        }

        setupNavigation() {
            if (!this.navContainer) return;
            
            if (this.videos.length > 1) {
                this.navContainer.innerHTML = this.videos.map((_, i) => 
                    `<button class="hero-video-dot ${i === 0 ? 'active' : ''}" 
                             data-video-index="${i}" 
                             aria-label="Video ${i + 1}">
                    </button>`
                ).join('');
                this.navContainer.style.display = 'flex';
                
                this.navContainer.addEventListener('click', (e) => {
                    const dot = e.target.closest('.hero-video-dot');
                    if (!dot) return;
                    const index = parseInt(dot.getAttribute('data-video-index'));
                    if (!isNaN(index) && index !== this.currentIndex) {
                        this.switchToVideo(index);
                    }
                });
            } else {
                this.navContainer.style.display = 'none';
            }
        }

        loadVideo(index) {
            if (index < 0 || index >= this.videos.length) return;
            if (!this.player) return;

            const video = this.videos[index];
            this.currentIndex = index;
            this.isTransitioning = true;
            this.isVideoLoaded = false;

            this.showLoading();

            this.animateTextOut(() => {
                this.updateContent(video);

                if (this.poster && video.poster) {
                    this.poster.src = video.poster;
                    this.poster.style.display = 'block';
                    this.poster.classList.remove('fade-out');
                } else if (this.poster) {
                    this.poster.style.display = 'none';
                }

                this.player.src = video.video_url;
                this.player.muted = this.isMuted;
                this.player.load();

                this.player.oncanplay = () => {
                    this.isVideoLoaded = true;
                    this.hideLoading();
                    
                    if (this.poster) {
                        this.poster.classList.add('fade-out');
                    }

                    if (!this.isPaused) {
                        const playPromise = this.player.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(() => {
                                console.warn('[HeroVideo] Autoplay blocked');
                            });
                        }
                    }

                    this.isTransitioning = false;
                    this.startProgressTracking();
                    this.animateTextIn();
                    this.updatePlayButtonUI();
                };

                this.player.onerror = () => {
                    console.error('[HeroVideo] Error loading video:', video.video_url);
                    this.hideLoading();
                    this.isTransitioning = false;
                    if (this.videos.length > 1) {
                        setTimeout(() => {
                            const nextIndex = (this.currentIndex + 1) % this.videos.length;
                            this.loadVideo(nextIndex);
                        }, 2000);
                    }
                };
            });

            this.updateDots();
            this.resetProgress();
        }

        updateContent(video) {
            const labelEl = document.getElementById('hero-video-label');
            const titleEl = document.getElementById('hero-video-title');
            const descEl = document.getElementById('hero-video-desc');
            const ctaEl = document.getElementById('hero-video-cta');
            const ctaTextEl = document.getElementById('hero-video-cta-text');

            if (labelEl) labelEl.textContent = video.label || video.subtitle || '';
            if (titleEl) titleEl.textContent = video.title || '';
            if (descEl) descEl.textContent = video.description || '';
            if (ctaTextEl) ctaTextEl.textContent = video.cta_title || 'Discover More';
            
            if (ctaEl) {
                ctaEl.href = video.cta_link || '#';
                ctaEl.style.display = (video.cta_title && video.cta_link) ? 'inline-flex' : 'none';
            }
        }

        animateTextOut(callback) {
            const elements = [
                document.getElementById('hero-video-label'),
                document.getElementById('hero-video-title'),
                document.getElementById('hero-video-desc'),
                document.getElementById('hero-video-cta')
            ].filter(el => el);

            if (elements.length === 0) {
                if (callback) callback();
                return;
            }

            elements.forEach((el, i) => {
                el.style.transitionDelay = `${i * 0.05}s`;
                el.classList.add('video-text-exit');
            });

            setTimeout(() => {
                elements.forEach((el, i) => {
                    el.classList.remove('video-text-exit');
                    el.style.transitionDelay = '0s';
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(20px)';
                    el.style.filter = 'blur(6px)';
                });
                if (callback) callback();
            }, 400);
        }

        animateTextIn() {
            const elements = [
                document.getElementById('hero-video-label'),
                document.getElementById('hero-video-title'),
                document.getElementById('hero-video-desc'),
                document.getElementById('hero-video-cta')
            ].filter(el => el);

            if (elements.length === 0) return;

            elements.forEach((el, i) => {
                el.classList.add('video-text-enter');
                el.style.transitionDelay = `${0.1 + i * 0.15}s`;
            });

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    elements.forEach((el) => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        el.style.filter = 'blur(0)';
                    });
                });
            });

            setTimeout(() => {
                elements.forEach((el) => {
                    el.classList.remove('video-text-enter');
                    el.style.transitionDelay = '0s';
                });
            }, 1000);
        }

        toggleSound() {
            if (!this.player) return;
            this.isMuted = !this.isMuted;
            this.player.muted = this.isMuted;
            this.updateSoundButtonUI();
        }

        updateSoundButtonUI() {
            const mutedIcon = document.getElementById('sound-icon-muted');
            const unmutedIcon = document.getElementById('sound-icon-unmuted');
            const btn = document.getElementById('hero-video-sound-btn');
            if (!mutedIcon || !unmutedIcon || !btn) return;
            if (this.isMuted) {
                mutedIcon.style.display = 'flex';
                unmutedIcon.style.display = 'none';
                btn.classList.add('muted');
            } else {
                mutedIcon.style.display = 'none';
                unmutedIcon.style.display = 'flex';
                btn.classList.remove('muted');
            }
        }

        togglePlay() {
            if (!this.player || !this.isVideoLoaded) return;
            if (this.isPaused) {
                const playPromise = this.player.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.isPaused = false;
                        this.updatePlayButtonUI();
                        this.startProgressTracking();
                        this.startAutoplay();
                    }).catch(() => {});
                }
            } else {
                this.player.pause();
                this.isPaused = true;
                this.updatePlayButtonUI();
                this.clearAutoplayInterval();
                this.clearProgressInterval();
            }
        }

        updatePlayButtonUI() {
            const playIcon = document.getElementById('play-icon');
            const pauseIcon = document.getElementById('pause-icon');
            const btn = document.getElementById('hero-video-play-btn');
            if (!playIcon || !pauseIcon || !btn) return;
            if (this.isPaused) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'flex';
                btn.classList.add('paused-state');
            } else {
                playIcon.style.display = 'flex';
                pauseIcon.style.display = 'none';
                btn.classList.remove('paused-state');
            }
        }

        startProgressTracking() {
            this.clearProgressInterval();
            if (!this.progressBar || this.isPaused) return;
            const duration = this.videoDuration;
            const interval = 50;
            const totalSteps = duration / interval;
            let currentStep = 0;
            this.progressBar.style.transition = `width ${interval}ms linear`;
            this.progressBar.style.width = '0%';
            this.progressInterval = setInterval(() => {
                if (this.isTransitioning || this.isPaused) return;
                currentStep++;
                const percentage = (currentStep / totalSteps) * 100;
                this.progressBar.style.width = `${Math.min(percentage, 100)}%`;
                if (currentStep >= totalSteps) this.clearProgressInterval();
            }, interval);
        }

        resetProgress() {
            this.clearProgressInterval();
            if (this.progressBar) {
                this.progressBar.style.transition = 'none';
                this.progressBar.style.width = '0%';
            }
        }

        startAutoplay() {
            this.clearAutoplayInterval();
            if (this.videos.length <= 1 || this.isPaused) return;
            this.autoplayInterval = setInterval(() => {
                if (!this.isTransitioning && this.isVideoLoaded && !this.isPaused) {
                    const nextIndex = (this.currentIndex + 1) % this.videos.length;
                    this.switchToVideo(nextIndex);
                }
            }, this.videoDuration);
        }

        switchToVideo(index) {
            if (this.isTransitioning || index === this.currentIndex) return;
            if (this.progressBar) {
                this.progressBar.style.transition = 'width 0.3s ease';
                this.progressBar.style.width = '100%';
            }
            this.clearAutoplayInterval();
            this.clearProgressInterval();
            setTimeout(() => {
                this.loadVideo(index);
                if (!this.isPaused) this.startAutoplay();
            }, 300);
        }

        nextVideo() { this.switchToVideo((this.currentIndex + 1) % this.videos.length); }
        prevVideo() { this.switchToVideo((this.currentIndex - 1 + this.videos.length) % this.videos.length); }

        updateDots() {
            document.querySelectorAll('.hero-video-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === this.currentIndex);
            });
        }

        showLoading() { if (this.loadingOverlay) this.loadingOverlay.classList.remove('hidden'); }
        hideLoading() { if (this.loadingOverlay) this.loadingOverlay.classList.add('hidden'); }

        clearProgressInterval() {
            if (this.progressInterval) { clearInterval(this.progressInterval); this.progressInterval = null; }
        }
        clearAutoplayInterval() {
            if (this.autoplayInterval) { clearInterval(this.autoplayInterval); this.autoplayInterval = null; }
        }

        pause() {
            if (this.player && this.isVideoLoaded && !this.isPaused) {
                this.player.pause();
                this.isPaused = true;
                this.updatePlayButtonUI();
                this.clearAutoplayInterval();
                this.clearProgressInterval();
            }
        }

        resume() {
            if (this.player && this.isVideoLoaded && this.isPaused) {
                const playPromise = this.player.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        this.isPaused = false;
                        this.updatePlayButtonUI();
                        this.startProgressTracking();
                        this.startAutoplay();
                    }).catch(() => {});
                }
            }
        }

        refresh(newData, options = {}) {
            this.cleanup();
            this.currentIndex = 0;
            this.isTransitioning = false;
            this.isVideoLoaded = false;
            this.isPaused = false;
            this.init(newData, options);
        }

        cleanup() {
            this.clearProgressInterval();
            this.clearAutoplayInterval();
            if (this.player) {
                this.player.pause();
                this.player.src = '';
                this.player.oncanplay = null;
                this.player.onerror = null;
            }
            if (this.loadingTimeout) { clearTimeout(this.loadingTimeout); this.loadingTimeout = null; }
            this.isVideoLoaded = false;
            this.isPaused = false;
        }

        destroy() {
            this.cleanup();
            this.hide();
            this.videos = [];
            this.isInitialized = false;
        }
    }

    // ==================== GLOBAL API ====================
    const heroVideo = new HeroVideoComponent();
    window.JAYENWARE = window.JAYENWARE || {};
    window.JAYENWARE.heroVideo = heroVideo;
    window.JABIYEN_FONTS = JABIYEN_FONTS;

    // ==================== AUTO-INITIALIZATION ====================
    if (!document.getElementById('hero-video-styles')) {
        document.head.insertAdjacentHTML('beforeend', HERO_VIDEO_CSS);
    }

    function injectHTML() {
        if (document.getElementById('hero-video-section')) return;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = getHeroVideoHTML();
        const videoSection = tempDiv.firstElementChild;
        const homeSection = document.getElementById('home');
        if (homeSection) {
            homeSection.insertBefore(videoSection, homeSection.firstChild);
        } else {
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.insertBefore(videoSection, mainElement.firstChild);
            } else {
                document.body.insertBefore(videoSection, document.body.firstChild);
            }
        }
    }

    function tryAutoInit() {
        injectHTML();
        if (window.currentData && window.currentData.heroVideos && window.currentData.heroVideos.length > 0) {
            heroVideo.init(window.currentData.heroVideos);
        } else {
            fetchHeroVideoData();
        }
    }

    async function fetchHeroVideoData() {
        try {
            const response = await fetch('/api/hero-videos');
            if (!response.ok) throw new Error('Failed to fetch hero video data');
            const data = await response.json();
            if (data && data.length > 0) {
                heroVideo.init(data);
            } else {
                heroVideo.hide();
            }
        } catch (error) {
            console.error('[HeroVideo] Error fetching video data:', error);
            heroVideo.hide();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(tryAutoInit, 150));
    } else {
        setTimeout(tryAutoInit, 150);
    }
})();

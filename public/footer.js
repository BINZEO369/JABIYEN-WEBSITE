// ============================================================================
// footer.js - Professional Premium Footer Component
// Version: 2.8 (Desktop & Mobile Optimized with Collapsible Menus)
// Brand: JABIYEN (Premium Apparel)
// Description: Fully responsive footer with collapsible menus on both mobile
//              and desktop, balanced left-right layout, and modern aesthetics.
// ============================================================================

function injectFooterStyles() {
    if (document.getElementById("footer-components-style")) return;

    const styles = `
    <style id="footer-components-style">
        /* ==================== BASE FOOTER STYLES ==================== */
        #main-footer {
            font-family: var(--font-body, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            position: relative;
            z-index: 10;
            background-color: var(--footer-bg, #0a0a0a);
            color: var(--footer-text, #b0b0b0);
            line-height: 1.5;
            width: 100%;
            letter-spacing: 0.01em;
            box-sizing: border-box;
        }
        
        #main-footer *,
        #main-footer *::before,
        #main-footer *::after {
            box-sizing: border-box;
        }
        
        #main-footer a {
            color: inherit;
            text-decoration: none;
            transition: color 0.25s ease, opacity 0.25s ease;
        }
        
        #main-footer a:hover {
            color: #ffffff;
            opacity: 1;
        }

        /* ==================== MAIN GRID ==================== */
        .footer-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 24px;
            padding-bottom: 32px;
        }
        
        @media (min-width: 768px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr;
                gap: 32px 40px;
            }
        }
        
        @media (min-width: 1024px) {
            .footer-grid {
                grid-template-columns: 1fr 1fr;
                gap: 40px 60px;
            }
        }

        /* ==================== INNER COLUMN STACK ==================== */
        .footer-left-col,
        .footer-right-col {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
        
        @media (min-width: 768px) {
            .footer-left-col,
            .footer-right-col {
                gap: 28px;
            }
        }
        
        @media (min-width: 1024px) {
            .footer-left-col,
            .footer-right-col {
                gap: 32px;
            }
        }

        /* ==================== 1. BRAND & CONTENT ==================== */
        .footer-brand-logo {
            max-width: 140px;
            width: 100%;
            height: auto;
            margin-bottom: 16px;
            border-radius: 4px;
            display: block;
            object-fit: contain;
            filter: brightness(0.95);
            transition: filter 0.3s ease;
        }
        
        @media (max-width: 767px) {
            .footer-brand-logo {
                max-width: 110px;
                margin-bottom: 12px;
            }
        }
        
        .footer-brand-logo:hover {
            filter: brightness(1.1);
        }
        
        .footer-brand-title {
            font-family: var(--font-heading, 'Manrope', sans-serif);
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
            text-transform: uppercase;
            color: #ffffff;
            line-height: 1.3;
        }
        
        @media (max-width: 767px) {
            .footer-brand-title {
                font-size: 0.95rem;
            }
        }
        
        .footer-brand-desc {
            font-size: 0.75rem;
            opacity: 0.7;
            margin-bottom: 16px;
            max-width: 320px;
            line-height: 1.6;
            font-weight: 350;
        }
        
        @media (max-width: 767px) {
            .footer-brand-desc {
                font-size: 0.7rem;
                max-width: 100%;
            }
        }

        /* ==================== 2. SOCIAL LINKS ==================== */
        .social-icons-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .social-icon-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #a0a0a0;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1.2);
        }
        
        @media (max-width: 767px) {
            .social-icon-link {
                width: 30px;
                height: 30px;
            }
        }
        
        .social-icon-link:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.25);
            color: #ffffff;
        }
        
        .social-icon-link svg, 
        .social-icon-link img {
            width: 14px;
            height: 14px;
            object-fit: contain;
        }

        /* ==================== SECTION TITLES ==================== */
        .footer-section-title {
            font-family: var(--font-heading, 'Manrope', sans-serif);
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 12px;
            color: #8a8a8a;
        }
        
        @media (max-width: 767px) {
            .footer-section-title {
                font-size: 0.65rem;
                margin-bottom: 10px;
            }
        }

        /* ==================== COLLAPSIBLE MENU BUTTON ==================== */
        .footer-menu-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            background: none;
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            color: #8a8a8a;
            padding: 8px 0;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            transition: color 0.25s ease, border-color 0.25s ease;
            text-align: left;
            font-family: var(--font-heading, 'Manrope', sans-serif);
        }
        
        @media (max-width: 767px) {
            .footer-menu-toggle {
                font-size: 0.65rem;
                padding: 7px 0;
            }
        }
        
        .footer-menu-toggle:hover {
            color: #ffffff;
            border-bottom-color: rgba(255, 255, 255, 0.2);
        }
        
        .footer-menu-toggle-icon {
            font-size: 0.6rem;
            transition: transform 0.3s ease;
            opacity: 0.5;
        }
        
        .footer-menu-toggle.active .footer-menu-toggle-icon {
            transform: rotate(180deg);
        }
        
        .footer-menu-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease, margin 0.4s ease;
        }
        
        .footer-menu-content.open {
            max-height: 600px;
            margin-top: 10px;
            margin-bottom: 4px;
        }

        /* ==================== 3 & 4. MENUS ==================== */
        .footer-links-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .footer-links-list > li {
            margin-bottom: 8px;
            font-size: 0.75rem;
            opacity: 0.75;
            transition: opacity 0.2s;
        }
        
        @media (max-width: 767px) {
            .footer-links-list > li {
                font-size: 0.7rem;
                margin-bottom: 7px;
            }
        }
        
        .footer-links-list > li:hover {
            opacity: 1;
        }
        
        .footer-link-desc {
            display: block;
            font-size: 0.65rem;
            opacity: 0.5;
            margin-top: 2px;
            font-style: italic;
        }
        
        @media (max-width: 767px) {
            .footer-link-desc {
                font-size: 0.6rem;
            }
        }

        .footer-nested-links {
            list-style: none;
            padding-left: 12px;
            margin-top: 6px;
            border-left: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        .footer-nested-links > li {
            margin-bottom: 5px;
            font-size: 0.7rem;
            opacity: 0.65;
        }
        
        @media (max-width: 767px) {
            .footer-nested-links > li {
                font-size: 0.65rem;
                margin-bottom: 4px;
            }
        }

        /* ==================== 5. PAYMENT METHODS ==================== */
        .footer-payment-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            margin-bottom: 0;
        }
        
        @media (max-width: 767px) {
            .footer-payment-grid {
                gap: 8px;
            }
        }
        
        .footer-payment-item {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: default;
            opacity: 0.5;
            transition: opacity 0.25s ease;
        }
        
        .footer-payment-item:hover {
            opacity: 0.8;
        }
        
        .footer-payment-icon { 
            height: 18px; 
            width: auto;
            object-fit: contain;
            filter: grayscale(100%) brightness(2);
        }
        
        @media (max-width: 767px) {
            .footer-payment-icon { 
                height: 15px; 
            }
        }
        
        .footer-payment-name { 
            display: none;
        }
        .footer-payment-account { 
            display: none;
        }
        
        .footer-qr-tooltip {
            display: none;
        }

        /* ==================== 6, 7 & 10. BADGES ==================== */
        .footer-mini-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
            margin-bottom: 16px;
        }
        
        @media (max-width: 767px) {
            .footer-mini-grid {
                gap: 8px;
                margin-bottom: 12px;
            }
        }
        
        .footer-badge-box {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.65rem;
            color: #999999;
            opacity: 0.6;
            transition: opacity 0.25s ease;
        }
        
        @media (max-width: 767px) {
            .footer-badge-box {
                font-size: 0.6rem;
                gap: 5px;
            }
        }
        
        .footer-badge-box:hover {
            opacity: 0.9;
        }
        
        .footer-badge-box img { 
            max-height: 18px; 
            width: auto;
            object-fit: contain;
            filter: grayscale(100%) brightness(2);
        }
        
        @media (max-width: 767px) {
            .footer-badge-box img { 
                max-height: 15px; 
            }
        }
        
        .badge-text-wrapper { 
            display: flex; 
            flex-direction: column; 
        }
        .badge-subtitle { 
            font-size: 0.55rem; 
            opacity: 0.5; 
        }
        
        @media (max-width: 767px) {
            .badge-subtitle { 
                font-size: 0.5rem; 
            }
        }

        /* ==================== 8. APP LINKS ==================== */
        .footer-app-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 16px;
        }
        
        @media (max-width: 767px) {
            .footer-app-grid {
                gap: 8px;
                margin-bottom: 12px;
            }
        }
        
        .footer-app-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #b0b0b0;
            font-weight: 500;
            font-size: 0.7rem;
            transition: color 0.25s ease;
            letter-spacing: 0.03em;
        }
        
        @media (max-width: 767px) {
            .footer-app-btn {
                font-size: 0.65rem;
            }
        }
        
        .footer-app-btn:hover { 
            color: #ffffff; 
        }
        .footer-app-btn img { 
            width: 15px; 
            height: 15px;
            opacity: 0.6;
        }
        
        @media (max-width: 767px) {
            .footer-app-btn img { 
                width: 13px; 
                height: 13px;
            }
        }

        /* ==================== 9. COUNTRY SELECTOR ==================== */
        .footer-country-wrapper {
            margin-top: 12px;
            display: block; 
            width: 100%;
            max-width: 240px;
        }
        
        @media (max-width: 767px) {
            .footer-country-wrapper {
                max-width: 100%;
            }
        }
        
        .footer-country-select {
            width: 100%;
            background: none;
            color: #b0b0b0;
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 7px 0;
            font-size: 0.7rem;
            outline: none;
            cursor: pointer;
            letter-spacing: 0.03em;
            font-family: var(--font-body, 'Inter', sans-serif);
        }
        
        @media (max-width: 767px) {
            .footer-country-select {
                font-size: 0.65rem;
            }
        }
        
        .footer-country-select:focus {
            color: #ffffff;
            border-bottom-color: rgba(255, 255, 255, 0.3);
        }
        
        .footer-country-select option { 
            background: #1a1a1a; 
            color: #cccccc; 
            padding: 6px;
        }
        
        .footer-exchange-rate { 
            font-size: 0.6rem; 
            color: #888888;
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 6px;
        }
        
        @media (max-width: 767px) {
            .footer-exchange-rate { 
                font-size: 0.55rem; 
            }
        }

        /* ==================== CONTACT INFO ==================== */
        .footer-contact-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 0.75rem;
            opacity: 0.75;
        }
        
        @media (max-width: 767px) {
            .footer-contact-item {
                font-size: 0.7rem;
                gap: 7px;
                margin-bottom: 7px;
            }
        }
        
        .footer-contact-item a {
            font-weight: 400;
        }
        .footer-contact-icon {
            font-size: 0.8rem;
            margin-top: 1px;
            opacity: 0.6;
        }
        
        @media (max-width: 767px) {
            .footer-contact-icon {
                font-size: 0.75rem;
            }
        }

        /* ==================== 11. BOTTOM BAR ==================== */
        .footer-bottom-bar {
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            padding-top: 20px;
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 0.7rem;
            opacity: 0.5;
        }
        
        @media (max-width: 767px) {
            .footer-bottom-bar {
                font-size: 0.65rem;
                padding-top: 16px;
                gap: 6px;
            }
        }
        
        @media (min-width: 768px) {
            .footer-bottom-bar { 
                flex-direction: row; 
            }
        }

        /* ==================== CENTERED LAYOUT OVERRIDES ==================== */
        .footer-layout-centered .footer-grid { 
            text-align: center; 
        }
        .footer-layout-centered .footer-country-wrapper { 
            margin: 12px auto 0; 
        }
        .footer-layout-centered .footer-contact-item { 
            justify-content: center; 
        }
        .footer-layout-centered .footer-brand-desc { 
            margin-left: auto; 
            margin-right: auto; 
        }
        .footer-layout-centered .social-icons-grid {
            justify-content: center;
        }
        .footer-layout-centered .footer-app-grid {
            justify-content: center;
        }
        .footer-layout-centered .footer-mini-grid {
            justify-content: center;
        }
        .footer-layout-centered .footer-payment-grid {
            justify-content: center;
        }
        .footer-layout-centered .footer-menu-toggle {
            justify-content: center;
            gap: 8px;
        }
        .footer-layout-centered .footer-links-list {
            text-align: center;
        }
        
        @media (max-width: 767px) {
            .footer-layout-centered .footer-contact-item {
                justify-content: flex-start;
            }
            .footer-layout-centered .footer-menu-toggle {
                justify-content: space-between;
            }
            .footer-layout-centered .footer-payment-grid {
                justify-content: flex-start;
            }
            .footer-layout-centered .footer-mini-grid {
                justify-content: flex-start;
            }
            .footer-layout-centered .social-icons-grid {
                justify-content: flex-start;
            }
            .footer-layout-centered .footer-links-list {
                text-align: left;
            }
        }
    </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
}

function getSocialIconHTML(platform, link) {
    const icons = {
        'facebook': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'instagram': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 2H7C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 11.37C16.1234 12.2022 15.9812 13.0522 15.5937 13.799C15.2062 14.5458 14.5931 15.1514 13.8416 15.5297C13.0901 15.908 12.2384 16.0396 11.4077 15.9059C10.5771 15.7722 9.80971 15.3801 9.21479 14.7851C8.61987 14.1902 8.2278 13.4228 8.09412 12.5922C7.96044 11.7615 8.092 10.9098 8.47026 10.1583C8.84852 9.40678 9.45418 8.7937 10.2009 8.4062C10.9477 8.0187 11.7978 7.87652 12.63 8C13.4789 8.12583 14.2648 8.52151 14.8716 9.12836C15.4785 9.73521 15.8742 10.5211 16 11.37Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>`,
        'youtube': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.54 6.42C22.4212 5.94541 22.1792 5.51057 21.8387 5.15941C21.4982 4.80824 21.0708 4.55518 20.6 4.43C18.88 4 12 4 12 4C12 4 5.12 4 3.4 4.46C2.92916 4.58518 2.50178 4.83824 2.16132 5.18941C1.82085 5.54057 1.57882 5.97541 1.46 6.45C1.14521 8.17418 0.991095 9.92534 1 11.68C0.991095 13.4347 1.14521 15.1858 1.46 16.91C1.57882 17.3846 1.82085 17.8194 2.16132 18.1706C2.50178 18.5218 2.92916 18.7748 3.4 18.9C5.12 19.36 12 19.36 12 19.36C12 19.36 18.88 19.36 20.6 18.9C21.0708 18.7748 21.4982 18.5218 21.8387 18.1706C22.1792 17.8194 22.4212 17.3846 22.54 16.91C22.8548 15.1858 23.0089 13.4347 23 11.68C23.0089 9.92534 22.8548 8.17418 22.54 6.42Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.75 15.02L15.5 11.68L9.75 8.34V15.02Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        'x': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25H21.552L14.325 10.51L22.827 21.75H16.17L10.956 14.933L4.99 21.75H1.68L9.41 12.915L1.254 2.25H8.08L12.793 8.481L18.244 2.25ZM17.083 19.77H18.916L7.084 4.126H5.117L17.083 19.77Z" fill="currentColor"/></svg>`,
        'linkedin': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9H2V21H6V9Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M22 12V21H18V12C18 10.5 17.5 9 16 9C14.5 9 14 10.5 14 12V21H10V9H14V11C14 11 14.5 9.5 16.5 9.5C18.5 9.5 22 10.5 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="2"/></svg>`
    };
    return icons[platform] || '';
}

function initMenuToggles() {
    document.querySelectorAll('.footer-menu-toggle').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content) {
                content.classList.toggle('open');
            }
        });
    });
}

async function renderFooter() {
    if (document.getElementById('main-footer')) return;
    
    injectFooterStyles();

    try {
        const response = await fetch('/api/footer/complete');
        if (!response.ok) throw new Error('Footer API response failed');
        const footerData = await response.json();
        
        const { 
            content = [], socialLinks = [], menus = [], paymentMethods = [], 
            shippingPartners = [], certifications = [], appLinks = [], 
            countries = [], trustBadges = [], settings = {} 
        } = footerData;
        
        const bgColor = settings.background_color || '#0a0a0a';
        const textColor = settings.text_color || '#b0b0b0';
        const layoutStyle = settings.layout_style || 'standard';
        const customCSS = settings.custom_css || '';
        
        let mergedContent = {};
        if (Array.isArray(content) && content.length > 0) {
            content.forEach(item => {
                mergedContent = { ...mergedContent, ...item };
            });
        }
        
        const logoUrl = mergedContent.logo_url || '';
        const brandTitle = mergedContent.title || '';
        const brandDesc = mergedContent.description || '';
        const address = mergedContent.address || '';
        const phone = mergedContent.phone || '';
        const email = mergedContent.email || '';
        const workingHours = mergedContent.working_hours || '';
        const defaultCopyright = settings.copyright_text || mergedContent.copyright_text || '© JayenWare. All Rights Reserved.';

        let socialsHTML = '';
        if (socialLinks && socialLinks.length > 0) {
            socialsHTML = `<div class="social-icons-grid">` + 
                socialLinks.sort((a, b) => a.sort_order - b.sort_order).map(link => {
                    const platform = (link.platform_name || '').toLowerCase();
                    const iconContent = link.platform_icon ? `<img src="${link.platform_icon}" alt="${link.platform_name}">` : getSocialIconHTML(platform, link.link_url);
                    return `<a href="${link.link_url}" target="_blank" rel="noopener noreferrer" class="social-icon-link" title="${link.hover_title || link.platform_name}">${iconContent}</a>`;
                }).join('') + `</div>`;
        }

        let appsHTML = '';
        if (appLinks && appLinks.length > 0) {
            appsHTML = `<div class="footer-app-grid">` + 
                appLinks.sort((a, b) => a.sort_order - b.sort_order).map(app => {
                    let btnHTML = '';
                    const icon = app.icon_url ? `<img src="${app.icon_url}" alt="app icon">` : '';
                    if(app.app_store_url) btnHTML += `<a href="${app.app_store_url}" class="footer-app-btn" target="_blank">${icon}App Store</a>`;
                    if(app.play_store_url) btnHTML += `<a href="${app.play_store_url}" class="footer-app-btn" target="_blank">${icon}Play Store</a>`;
                    return btnHTML;
                }).join('') + `</div>`;
        }

        let countryHTML = '';
        let dirAttribute = 'ltr';
        
        if (countries && countries.length > 0) {
            const defaultCountry = countries.find(c => c.is_default) || countries[0];
            if (defaultCountry && defaultCountry.is_rtl) dirAttribute = 'rtl';
            
            let exchangeRateHTML = '';
            if (defaultCountry && defaultCountry.exchange_rate && defaultCountry.exchange_rate !== 1) {
                const symbol = defaultCountry.currency_symbol || defaultCountry.currency_code || '';
                exchangeRateHTML = `<div class="footer-exchange-rate">1 USD = ${symbol}${defaultCountry.exchange_rate}</div>`;
            }
            
            countryHTML = `
            <div class="footer-country-wrapper">
                <select class="footer-country-select" onchange="window.location.href=this.value">
                    ${countries.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(c => `
                        <option value="?country=${c.country_code || ''}&lang=${c.language_code || ''}" ${c.is_default ? 'selected' : ''}>
                            ${c.country_name || 'Unknown'} / ${c.currency_code || ''} ${c.language_name ? '/ ' + c.language_name : ''}
                        </option>
                    `).join('')}
                </select>
                ${exchangeRateHTML}
            </div>`;
        }

        let menusHTML = '';
        if (menus && menus.length > 0) {
            menus.sort((a, b) => a.sort_order - b.sort_order).forEach((menu, index) => {
                const links = menu.links || [];
                const parents = links.filter(l => !l.parent_id).sort((a, b) => a.sort_order - b.sort_order);
                const menuId = `footer-menu-${index}-${Date.now()}`;
                
                menusHTML += `
                <div>
                    <button class="footer-menu-toggle" aria-expanded="false" aria-controls="${menuId}">
                        ${menu.title}
                        <span class="footer-menu-toggle-icon">▼</span>
                    </button>
                    <div class="footer-menu-content" id="${menuId}">
                        <ul class="footer-links-list">
                            ${parents.map(parent => {
                                const target = parent.open_in_new_tab ? 'target="_blank"' : '';
                                const children = links.filter(l => l.parent_id === parent.id).sort((a, b) => a.sort_order - b.sort_order);
                                
                                let childHTML = '';
                                if(children.length > 0) {
                                    childHTML = `<ul class="footer-nested-links">
                                        ${children.map(child => `<li><a href="${child.link_url || '#'}" ${child.open_in_new_tab ? 'target="_blank"' : ''}>${child.title}</a></li>`).join('')}
                                    </ul>`;
                                }
                                return `<li>
                                    <a href="${parent.link_url || '#'}" ${target}>${parent.title}</a>
                                    ${childHTML}
                                </li>`;
                            }).join('')}
                        </ul>
                    </div>
                </div>`;
            });
        }

        let paymentsHTML = '';
        if (paymentMethods && paymentMethods.length > 0) {
            paymentsHTML = `
            <div class="footer-section">
                <h5 class="footer-section-title">Accepted Payments</h5>
                <div class="footer-payment-grid">
                    ${paymentMethods.sort((a, b) => a.sort_order - b.sort_order).map(pm => `
                        <div class="footer-payment-item" title="${pm.name}">
                            ${pm.icon_url ? `<img src="${pm.icon_url}" alt="${pm.name}" class="footer-payment-icon">` : `<span class="footer-payment-name">${pm.name}</span>`}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        let trustHTML = '';
        if (trustBadges && trustBadges.length > 0) {
            trustHTML += `<div style="margin-bottom: 12px;"><h5 class="footer-section-title" style="margin-bottom: 10px;">Trust & Security</h5><div class="footer-mini-grid" style="margin-bottom: 8px;">` +
                trustBadges.sort((a, b) => a.sort_order - b.sort_order).map(badge => `
                <div class="footer-badge-box">
                    ${badge.badge_url ? `<img src="${badge.badge_url}" alt="${badge.title}">` : ''}
                    <div class="badge-text-wrapper">
                        <strong>${badge.title}</strong>
                        ${badge.subtitle ? `<span class="badge-subtitle">${badge.subtitle}</span>` : ''}
                    </div>
                </div>
            `).join('') + `</div></div>`;
        }
        
        let certsHTML = '';
        if (certifications && certifications.length > 0) {
            certsHTML += `<div style="margin-bottom: 12px;"><h5 class="footer-section-title" style="margin-bottom: 10px;">Certifications</h5><div class="footer-mini-grid" style="margin-bottom: 8px;">` +
                certifications.sort((a, b) => a.sort_order - b.sort_order).map(cert => `
                <div class="footer-badge-box">
                    ${cert.link_url ? `<a href="${cert.link_url}" target="_blank">` : ''}
                    ${cert.badge_url ? `<img src="${cert.badge_url}" alt="${cert.name}">` : `<strong>${cert.name}</strong>`}
                    ${cert.link_url ? `</a>` : ''}
                </div>
            `).join('') + `</div></div>`;
        }

        let shippingHTML = '';
        if (shippingPartners && shippingPartners.length > 0) {
            shippingHTML += `<div style="margin-bottom: 12px;"><h5 class="footer-section-title" style="margin-bottom: 10px;">Shipping Partners</h5><div class="footer-mini-grid" style="margin-bottom: 8px;">` +
                shippingPartners.sort((a, b) => a.sort_order - b.sort_order).map(ship => `
                <div class="footer-badge-box" title="${ship.name}">
                    ${ship.icon_url ? `<img src="${ship.icon_url}" alt="${ship.name}">` : `<span>${ship.name}</span>`}
                </div>
            `).join('') + `</div></div>`;
        }

        const layoutClass = layoutStyle === 'centered' ? 'footer-layout-centered' : '';
        
        const footerHTML = `
        <footer id="main-footer" class="pt-12 pb-6 ${layoutClass}" style="--footer-bg: ${bgColor}; --footer-text: ${textColor}; padding: 48px 24px 24px;" dir="${dirAttribute}">
            ${customCSS ? `<style>${customCSS}</style>` : ''}
            <div style="width: 100%; max-width: 1200px; margin: 0 auto;">
                <div class="footer-grid">
                    
                    <div class="footer-left-col">
                        <div>
                            ${logoUrl ? `<img src="${logoUrl}" alt="${brandTitle || 'Brand Logo'}" class="footer-brand-logo">` : ''}
                            ${brandTitle ? `<h4 class="footer-brand-title">${brandTitle}</h4>` : ''}
                            ${brandDesc ? `<p class="footer-brand-desc">${brandDesc}</p>` : ''}
                        </div>
                        
                        <div>
                            <h5 class="footer-section-title">Connect</h5>
                            ${socialsHTML}
                        </div>
                        
                        <div>
                            <h5 class="footer-section-title">Download App</h5>
                            ${appsHTML}
                        </div>
                        
                        ${countryHTML}
                    </div>
                    
                    <div class="footer-right-col">
                        <div>
                            <h5 class="footer-section-title">Contact</h5>
                            <div style="margin-bottom: 16px;">
                                ${address ? `<div class="footer-contact-item"><span class="footer-contact-icon"></span> <span>${address}</span></div>` : ''}
                                ${phone ? `<div class="footer-contact-item"><span class="footer-contact-icon"></span> <span><a href="tel:${phone}">${phone}</a></span></div>` : ''}
                                ${email ? `<div class="footer-contact-item"><span class="footer-contact-icon"></span> <span><a href="mailto:${email}">${email}</a></span></div>` : ''}
                                ${workingHours ? `<div class="footer-contact-item"><span class="footer-contact-icon"></span> <span>${workingHours}</span></div>` : ''}
                            </div>
                        </div>
                        
                        ${menusHTML}
                        
                        ${trustHTML}
                        ${certsHTML}
                        ${shippingHTML}
                        
                        ${paymentsHTML}
                    </div>
                </div>
                
                <div class="footer-bottom-bar">
                    <p>Infrastructure by <a href="https://binzeo.vercel.app" target="_blank" style="color: #ccc; font-weight: 500;">BINZEO</a> v${settings.version || '2.8'}</p>
                    <p>${defaultCopyright}</p>
                </div>
            </div>
        </footer>
        `;
        
        document.body.insertAdjacentHTML('beforeend', footerHTML);
        
        initMenuToggles();
        
    } catch (error) {
        console.error('Footer DB synchronization failed:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFooter);
} else {
    setTimeout(renderFooter, 100);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderFooter, getSocialIconHTML };
}

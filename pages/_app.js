import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <title>Jayenware Official Store | Bangladesh Heritage Fashion</title>
        
        <meta name="description" content="Shop at the official site of Jayenware BD. Discover the latest ready-to-wear, handbags, T-shirt, shoes and accessory collections" />
        <meta name="keywords" content="buy t-shirts online Bangladesh, premium lifestyle products BD, quality cotton t-shirt, JAYENWARE shop, BINZEO store, stylish apparel, printed t-shirts, oversized t-shirts, fashion accessories, online shopping Bangladesh, authentic clothing, best t-shirt brand Bangladesh" />
        <meta name="author" content="BINZEO" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="geo.region" content="BD" />
        <meta name="geo.placename" content="Bangladesh" />

        <link rel="alternate" hrefLang="en-BD" href="https://www.jayenware.shop/" />
        <link rel="alternate" hrefLang="bn-BD" href="https://www.jayenware.shop/" />
        <link rel="alternate" hrefLang="x-default" href="https://www.jayenware.shop/" />

        <meta property="og:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta property="og:description" content="Discover luxury Bangladesh clothing, T-shirt, bags, accessories and fragrances for women and men." />
        <meta property="og:image" content="https://www.jayenware.shop/logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Jayenware Official | Store Banner" />
        <meta property="og:url" content="https://www.jayenware.shop/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JAYENWARE" />
        <meta property="og:locale" content="en_BD" />
        <meta property="fb:app_id" content="861762253694814" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@jayenware" />
        <meta name="twitter:creator" content="@jayenware" />
        <meta name="twitter:title" content="Jayenware Official Store | Bangladesh Heritage Fashion" />
        <meta name="twitter:description" content="Discover luxury Bangladesh clothing, T-shirt, bags, accessories and fragrances for women and men." />
        <meta name="twitter:image" content="https://www.jayenware.shop/logo.png" />
        <meta name="twitter:image:alt" content="JAYENWARE Official Store | Bangladesh Heritage Fashion" />

        <link rel="canonical" href="https://www.jayenware.shop/" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://www.jayenware.shop/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://www.jayenware.shop/logo.png" />
        <link rel="apple-touch-icon" href="https://www.jayenware.shop/logo.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;

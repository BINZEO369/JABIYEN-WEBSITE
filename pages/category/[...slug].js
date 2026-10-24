import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function productSlug(product) {
  return slugify(product.slug || product.title || 'product');
}

function productImage(product) {
  return product.img || product.image || product.image_url || '/placeholder.png';
}

export default function CategoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const segments = Array.isArray(router.query.slug) ? router.query.slug : [];
  const categorySlug = segments[0] || '';
  const subcategorySlug = segments[1] || '';
  const categoryName = categorySlug ? categorySlug.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'Category';
  const subcategoryName = subcategorySlug ? subcategorySlug.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : '';

  useEffect(() => {
    if (!router.isReady || !categorySlug || segments.length > 2) return;
    let cancelled = false;
    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Products could not be loaded.');
        const payload = await response.json();
        const items = Array.isArray(payload) ? payload : payload?.data || payload?.products || [];
        if (!cancelled) setProducts(Array.isArray(items) ? items : []);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Products could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, [router.isReady, categorySlug, subcategorySlug, segments.length]);

  const filteredProducts = useMemo(() => products.filter(product => {
    const productCategory = slugify(product.category || product.main_category || product.gender);
    const productSubcategory = slugify(product.subcategory || product.sub_category || product.product_subcategory);
    const categoryMatches = productCategory === categorySlug;
    const subcategoryMatches = !subcategorySlug || productSubcategory === subcategorySlug;
    return categoryMatches && subcategoryMatches;
  }), [products, categorySlug, subcategorySlug]);

  if (segments.length > 2) return <ErrorState title="Category not found" />;

  return (
    <>
      <Head>
        <title>{subcategoryName ? `${subcategoryName} | ${categoryName} | JABIYEN` : `${categoryName} | JABIYEN`}</title>
        <meta name="description" content={`Shop ${subcategoryName ? `${subcategoryName} in ` : ''}${categoryName} at JABIYEN.`} />
      </Head>
      <main style={styles.page}>
        <div style={styles.shell}>
          <Link href="/" style={styles.back}>← Back to JABIYEN</Link>
          <div style={styles.breadcrumb}>
            <Link href={`/category/${categorySlug}`} style={styles.crumbLink}>{categoryName}</Link>
            {subcategoryName && <><span>/</span><span>{subcategoryName}</span></>}
          </div>
          <h1 style={styles.title}>{subcategoryName || categoryName}</h1>
          <p style={styles.subtitle}>{loading ? 'Loading products…' : `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`}</p>

          {error && <div style={styles.message}>{error}</div>}
          {!loading && !error && filteredProducts.length === 0 && <div style={styles.empty}>No products found in this category.</div>}
          <div style={styles.grid}>
            {filteredProducts.map(product => (
              <Link key={product.id || productSlug(product)} href={`/product/${productSlug(product)}`} style={styles.card}>
                <div style={styles.imageWrap}><img src={productImage(product)} alt={product.title || ''} style={styles.image} /></div>
                <div style={styles.cardBody}>
                  <h2 style={styles.productTitle}>{product.title || 'Product'}</h2>
                  <p style={styles.price}>৳ {product.price || 0}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function ErrorState({ title }) {
  return <main style={styles.page}><div style={styles.shell}><Link href="/" style={styles.back}>← Back to JABIYEN</Link><div style={styles.empty}>{title}</div></div></main>;
}

const styles = {
  page: { minHeight: '100vh', background: '#fff', color: '#1d1d1f', padding: 'clamp(28px, 6vw, 72px) 20px', fontFamily: "'Manrope', Arial, sans-serif" },
  shell: { maxWidth: 1240, margin: '0 auto' },
  back: { display: 'inline-block', marginBottom: 34, color: '#555', fontSize: 12, fontWeight: 700, textDecoration: 'none', letterSpacing: '.06em' },
  breadcrumb: { display: 'flex', gap: 8, alignItems: 'center', color: '#888', fontSize: 12, textTransform: 'capitalize' },
  crumbLink: { color: '#555', textDecoration: 'none' },
  title: { margin: '14px 0 6px', fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: 1, letterSpacing: '-.06em' },
  subtitle: { margin: 0, color: '#777', fontSize: 13 },
  message: { marginTop: 32, padding: 18, borderRadius: 16, background: '#fff4f4', color: '#a33', fontSize: 14 },
  empty: { marginTop: 34, padding: 48, borderRadius: 20, background: '#f6f6f3', color: '#777', textAlign: 'center', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 24, marginTop: 36 },
  card: { color: 'inherit', textDecoration: 'none', minWidth: 0 },
  imageWrap: { aspectRatio: '3 / 4', overflow: 'hidden', background: '#f7f7f5', borderRadius: 16 },
  image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardBody: { padding: '12px 4px' },
  productTitle: { margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.4 },
  price: { margin: '6px 0 0', fontSize: 13, color: '#555', fontWeight: 700 },
};

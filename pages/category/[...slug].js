import CatalogBrowser from '../../components/catalog/CatalogBrowser';

export default function NestedCategoryPage({ categorySlug, subcategorySlug }) {
  return <CatalogBrowser mode="subcategory" slug={subcategorySlug} categorySlug={categorySlug} />;
}

export async function getServerSideProps({ params }) {
  const segments = Array.isArray(params?.slug) ? params.slug : [];
  if (segments.length !== 2) return { notFound: true };
  return {
    props: {
      categorySlug: String(segments[0]),
      subcategorySlug: String(segments[1]),
    },
  };
}

import CatalogBrowser from '../../components/catalog/CatalogBrowser';

export default function CategoryPage({ slug }) {
  return <CatalogBrowser mode="category" slug={slug} />;
}

export async function getServerSideProps({ params }) {
  return { props: { slug: String(params?.slug || '') } };
}

import CatalogBrowser from '../../components/catalog/CatalogBrowser';

export default function SubcategoryPage({ slug }) {
  return <CatalogBrowser mode="subcategory" slug={slug} />;
}

export async function getServerSideProps({ params }) {
  return { props: { slug: String(params?.slug || '') } };
}

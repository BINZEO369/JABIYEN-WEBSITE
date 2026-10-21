export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/auth/account',
      permanent: false,
    },
  };
}

export default function AccountRouteRedirect() {
  return null;
}

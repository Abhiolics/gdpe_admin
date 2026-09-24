import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin/dashboard',
        destination: '/admin?tab=dashboard',
        permanent: false,
      },
      {
        source: '/admin/users',
        destination: '/admin?tab=users',
        permanent: false,
      },
      {
        source: '/admin/deposits',
        destination: '/admin?tab=deposits',
        permanent: false,
      },
      {
        source: '/admin/withdrawals',
        destination: '/admin?tab=withdrawals',
        permanent: false,
      },
      {
        source: '/admin/plans',
        destination: '/admin?tab=plans',
        permanent: false,
      },
      {
        source: '/admin/tasks',
        destination: '/admin?tab=tasks',
        permanent: false,
      },
      {
        source: '/admin/gift-codes',
        destination: '/admin?tab=gift-codes',
        permanent: false,
      },
      {
        source: '/admin/settings',
        destination: '/admin?tab=settings',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

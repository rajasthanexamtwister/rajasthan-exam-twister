/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  staticPageGenerationTimeout: 180,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "clsx"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/blogs/2026-27",
        destination: "/blogs/cm-anuprati-coaching-yojana-2026-27",
        permanent: true,
      },
      {
        source: "/blogs/rajasthan-ke-khanij-khanij-ke-kaka",
        destination: "/blogs/rajasthan-ke-khanij-sansadhan-guide",
        permanent: true,
      },
      {
        source: "/blogs/rajasthan-ke-ka-ki-ka",
        destination: "/blogs/rajasthan-prajamandal-andolan-timeline",
        permanent: true,
      },
      {
        source: "/blogs/rajasthan-polity-polity-ka",
        destination: "/blogs/rajasthan-polity-complete-guide",
        permanent: true,
      },
      {
        source: "/blogs/1857-ki-rajasthan-ka-ka",
        destination: "/blogs/1857-kranti-rajasthan-contribution",
        permanent: true,
      },
      {
        source: "/blogs/rajasthan-ke-lok-nritya-ka-nritya",
        destination: "/blogs/rajasthan-ke-lok-nritya-complete-guide",
        permanent: true,
      },
      {
        source: "/blogs/rsmssb-ldc-2026-score-card-out-download-link",
        destination: "/blogs/rssb-ldc-score-card-2026-out-check-marks-direct-link",
        permanent: true,
      },
      {
        source: "/blogs/rajasthan-cet-graduate-level-form-reopen-status-rssb-update",
        destination: "/blogs/rajasthan-cet-2026-ke-syllabus-preparation",
        permanent: true,
      },
      {
        source: "/notes/rajasthan-lok-sanskriti-mela-tyohar-master-handbook",
        destination: "/notes/rajasthan-mela-tyohar-combined",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://www.google.co.in https://www.googletagservices.com https://www.googletagmanager.com https://adservice.google.com https://adservice.google.co.in https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://resources.infolinks.com https://s.infolinks.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' https:; connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://www.google.com https://www.google.co.in https://resources.infolinks.com https://s.infolinks.com; frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://pagead2.googlesyndication.com https://www.google.com https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://resources.infolinks.com https://s.infolinks.com; frame-ancestors 'self';",
          },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(icon.png|apple-icon.png|favicon.ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

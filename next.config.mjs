/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // ✅ allow placeholder images
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },

      // ✅ Supabase storage bucket (replace with your actual project ref if different)
      {
        protocol: "https",
        hostname: "ymhjlnthzixrgagpuhdf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },

      // Optional: allow example.com (development only)
      {
        protocol: "https",
        hostname: "example.com",
        pathname: "/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/Home",
        permanent: false,
      },
    ];
  },
};

// ✅ Export correctly for Next.js 15 ESM config
export default nextConfig;
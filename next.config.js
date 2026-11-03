/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "export",
	images: {
		unoptimized: true,
	},
	experimental: {
		optimizePackageImports: ["framer-motion"],
	},
	devIndicators: false,
};

export default nextConfig;

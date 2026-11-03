import type { MetadataRoute } from "next";
import { getAllCanonicalPaths } from "@/lib/seo";

export const dynamic = "force-static";

const BASE_URL = "https://vidashby.com";

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	return getAllCanonicalPaths().map((path) => ({
		url: path === "/" ? BASE_URL : `${BASE_URL}${path}`,
		lastModified: now,
		changeFrequency: "monthly" as const,
		priority: path === "/" ? 1.0 : 0.7,
	}));
}

import type { Metadata } from "next";
import { CERT_GROUPS, EDUCATION, FEATURED_PROJECTS } from "@/lib/profile";

import { SITE_CONFIG } from "./metadata";
import {
	getCertificationFileBySlug,
	getProjectFileBySlug,
	isValidCertificationSlug,
	isValidProjectSlug,
} from "./path-routing";

/**
 * Route configuration for metadata generation.
 */
interface RouteMetadata {
	title: string;
	description: string;
	ogImage?: string;
}

/**
 * Default homepage metadata (extracted for type safety).
 */
const DEFAULT_METADATA: RouteMetadata = {
	title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
	description: SITE_CONFIG.description,
};

/**
 * Static route metadata configurations.
 */
const ROUTE_METADATA: Record<string, RouteMetadata> = {
	"/": DEFAULT_METADATA,
	"/about": {
		title: "About",
		description: `About ${SITE_CONFIG.name}: projects, certifications, experience and skills.`,
	},
	"/resume": {
		title: "Résumé",
		description: `Résumé of ${SITE_CONFIG.name}, ${SITE_CONFIG.title}.`,
	},
	"/projects": {
		title: "Projects",
		description: "Selected open-source work across automation, security and hardware.",
	},
	"/certifications": {
		title: "Certifications",
		description:
			"Audit, quality and security certifications with issuers, dates and credential IDs.",
	},
};

/**
 * File-specific metadata for project markdown files.
 */
const PROJECT_FILE_METADATA: Record<string, RouteMetadata> = Object.fromEntries(
	FEATURED_PROJECTS.map((project) => [
		project.slug,
		{ title: project.title, description: project.description },
	]),
);

/**
 * File-specific metadata for certification markdown files.
 */
const CERTIFICATION_FILE_METADATA: Record<string, RouteMetadata> = {
	...Object.fromEntries(
		CERT_GROUPS.map((group) => [
			group.slug,
			{
				title: `Certifications: ${group.label}`,
				description: group.certs.map((cert) => cert.name).join(", "),
			},
		]),
	),
	education: {
		title: "Education",
		description: EDUCATION.map((entry) => `${entry.name}, ${entry.school}`).join("; "),
	},
};

/**
 * Generate the canonical URL for a given path.
 */
function getCanonicalUrl(path: string): string {
	const normalizedPath = path === "/" ? "" : path;
	return `${SITE_CONFIG.baseUrl}${normalizedPath}`;
}

/**
 * Build complete metadata object from route metadata.
 */
function buildMetadata(path: string, meta: RouteMetadata): Metadata {
	const canonicalUrl = getCanonicalUrl(path);
	const ogImage = meta.ogImage ?? SITE_CONFIG.ogImage;

	return {
		title: meta.title,
		description: meta.description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			title: `${meta.title} | ${SITE_CONFIG.siteName}`,
			description: meta.description,
			url: canonicalUrl,
			siteName: SITE_CONFIG.siteName,
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: `${meta.title} - ${SITE_CONFIG.siteName}`,
				},
			],
			type: "website",
			locale: "en_US",
		},
		twitter: {
			card: "summary_large_image",
			title: `${meta.title} | ${SITE_CONFIG.siteName}`,
			description: meta.description,
			images: [ogImage],
		},
	};
}

/**
 * Generate metadata for a static route.
 *
 * @param path - The route path (e.g., "/about", "/projects/streamdrop")
 * @returns Next.js Metadata object
 */
export function generatePathMetadata(path: string): Metadata {
	const normalizedPath = path.toLowerCase().replace(/\/$/, "") || "/";

	// Check static routes first
	const staticMeta = ROUTE_METADATA[normalizedPath];
	if (staticMeta) {
		return buildMetadata(normalizedPath, staticMeta);
	}

	// Check dynamic project file routes
	const projectMatch = normalizedPath.match(/^\/projects\/(.+)$/);
	if (projectMatch) {
		const slug = projectMatch[1];
		if (slug) {
			const fileMeta = PROJECT_FILE_METADATA[slug];
			if (fileMeta) {
				return buildMetadata(normalizedPath, fileMeta);
			}
			// Fallback for valid project files without custom metadata
			const file = getProjectFileBySlug(slug);
			if (file) {
				return buildMetadata(normalizedPath, {
					title: file.title,
					description: "",
				});
			}
		}
	}

	// Check dynamic certification file routes
	const certificationMatch = normalizedPath.match(/^\/certifications\/(.+)$/);
	if (certificationMatch) {
		const slug = certificationMatch[1];
		if (slug) {
			const fileMeta = CERTIFICATION_FILE_METADATA[slug];
			if (fileMeta) {
				return buildMetadata(normalizedPath, fileMeta);
			}
			// Fallback for valid certification files without custom metadata
			const file = getCertificationFileBySlug(slug);
			if (file) {
				return buildMetadata(normalizedPath, {
					title: file.title,
					description: "",
				});
			}
		}
	}

	// Fallback to default homepage metadata
	return buildMetadata("/", DEFAULT_METADATA);
}

/**
 * Generate metadata for a project file route.
 *
 * @param slug - The project file slug
 * @returns Next.js Metadata object or null if invalid slug
 */
export function generateProjectFileMetadata(slug: string): Metadata | null {
	if (!isValidProjectSlug(slug)) return null;

	const path = `/projects/${slug}`;
	const fileMeta = PROJECT_FILE_METADATA[slug];
	if (fileMeta) {
		return buildMetadata(path, fileMeta);
	}

	const file = getProjectFileBySlug(slug);
	if (file) {
		return buildMetadata(path, {
			title: file.title,
			description: "",
		});
	}

	return null;
}

/**
 * Generate metadata for a certification file route.
 *
 * @param slug - The certification file slug
 * @returns Next.js Metadata object or null if invalid slug
 */
export function generateCertificationFileMetadata(slug: string): Metadata | null {
	if (!isValidCertificationSlug(slug)) return null;

	const path = `/certifications/${slug}`;
	const fileMeta = CERTIFICATION_FILE_METADATA[slug];
	if (fileMeta) {
		return buildMetadata(path, fileMeta);
	}

	const file = getCertificationFileBySlug(slug);
	if (file) {
		return buildMetadata(path, {
			title: file.title,
			description: "",
		});
	}

	return null;
}

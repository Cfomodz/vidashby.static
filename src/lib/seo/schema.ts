// Schema.org JSON-LD for search engine knowledge graphs

import { ENTITY, getSameAsUrls } from "./entity";
import { SITE_CONFIG } from "./metadata";

/*
 * Person schema for the portfolio owner.
 * Establishes Knowledge Graph entity for the site owner.
 */
export interface PersonSchema {
	"@context": "https://schema.org";
	"@type": "Person";
	"@id": string;
	name: string;
	givenName: string;
	familyName: string;
	jobTitle: string;
	description: string;
	url: string;
	image: string;
	email?: string;
	sameAs: string[];
	worksFor?: {
		"@type": "Organization";
		name: string;
		url?: string;
	};
	alumniOf?: Array<{
		"@type": "EducationalOrganization";
		name: string;
		url?: string;
	}>;
	knowsAbout: string[];
}

/**
 * ProfilePage schema wrapping the Person.
 * Indicates this page is a profile/portfolio.
 */
export interface ProfilePageSchema {
	"@context": "https://schema.org";
	"@type": "ProfilePage";
	"@id": string;
	name: string;
	description: string;
	url: string;
	mainEntity: PersonSchema;
}

/**
 * CreativeWork schema for projects.
 * Enables rich snippets for portfolio projects.
 */
export interface CreativeWorkSchema {
	"@context": "https://schema.org";
	"@type": "CreativeWork";
	"@id": string;
	name: string;
	description: string;
	url: string;
	sameAs?: string;
	author: {
		"@type": "Person";
		"@id": string;
		name: string;
	};
	keywords?: string[];
	genre?: string;
}

/**
 * SoftwareApplication schema for projects (Story 5).
 * More specific than CreativeWork for software projects.
 * Enables richer results in search.
 */
export interface SoftwareApplicationSchema {
	"@context": "https://schema.org";
	"@type": "SoftwareApplication";
	"@id": string;
	name: string;
	description: string;
	url: string;
	applicationCategory: string;
	operatingSystem?: string;
	author: {
		"@type": "Person";
		"@id": string;
		name: string;
	};
	offers?: {
		"@type": "Offer";
		price: string;
		priceCurrency: string;
	};
	codeRepository?: string;
	programmingLanguage?: string[];
	keywords?: string[];
}

/**
 * WebSite schema with SearchAction (Story 5).
 * Enables sitelinks search box in search results.
 */
export interface WebSiteSchema {
	"@context": "https://schema.org";
	"@type": "WebSite";
	"@id": string;
	name: string;
	description: string;
	url: string;
	publisher: {
		"@type": "Person";
		"@id": string;
		name: string;
	};
	potentialAction?: {
		"@type": "SearchAction";
		target: {
			"@type": "EntryPoint";
			urlTemplate: string;
		};
		"query-input": string;
	};
}

/**
 * Project metadata for schema generation.
 * Contains technical details about each project.
 */
export interface ProjectMetadata {
	name: string;
	description: string;
	codeRepository?: string;
	programmingLanguage: string[];
	keywords: string[];
	applicationCategory: string;
	dateCreated?: string;
	license?: string;
}

/**
 * Project metadata registry.
 * Maps file IDs to their technical metadata.
 */
export const PROJECT_METADATA: Record<string, ProjectMetadata> = {};

/**
 * Generate the Person schema for the site owner.
 * Uses centralized ENTITY data for consistency with visible DOM content.
 */
export function generatePersonSchema(): PersonSchema {
	return {
		"@context": "https://schema.org",
		"@type": "Person",
		"@id": `${SITE_CONFIG.baseUrl}/#person`,
		name: ENTITY.name,
		givenName: ENTITY.givenName,
		familyName: ENTITY.familyName,
		jobTitle: ENTITY.jobTitle,
		description: ENTITY.description,
		url: ENTITY.url,
		image: ENTITY.ogImage,
		sameAs: getSameAsUrls(),
		worksFor: {
			"@type": "Organization",
			name: ENTITY.currentEmployer.organization,
			url: ENTITY.currentEmployer.organizationUrl,
		},
		alumniOf: ENTITY.education.map((edu) => ({
			"@type": "EducationalOrganization" as const,
			name: edu.institution,
			url: edu.institutionUrl,
		})),
		knowsAbout: ENTITY.knowsAbout,
	};
}

/**
 * Generate the ProfilePage schema wrapping the Person.
 * Uses centralized ENTITY data for consistency.
 */
export function generateProfilePageSchema(): ProfilePageSchema {
	return {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		"@id": `${SITE_CONFIG.baseUrl}/#profilepage`,
		name: `${ENTITY.name} | ${ENTITY.jobTitle}`,
		description: ENTITY.description,
		url: ENTITY.url,
		mainEntity: generatePersonSchema(),
	};
}

/**
 * Generate CreativeWork schema for a project.
 * Uses centralized ENTITY data for author reference.
 *
 * @param fileId - The VFS file ID (e.g., "file.streamdrop")
 * @returns Schema object or null if project not found
 */
export function generateProjectSchema(fileId: string): CreativeWorkSchema | null {
	const metadata = PROJECT_METADATA[fileId];
	if (!metadata) return null;

	const fileSlug = fileId.replace("file.", "");

	return {
		"@context": "https://schema.org",
		"@type": "CreativeWork",
		"@id": `${SITE_CONFIG.baseUrl}?app=markdown&file=${fileSlug}#project`,
		name: metadata.name,
		description: metadata.description,
		url: `${SITE_CONFIG.baseUrl}?app=markdown&file=${fileSlug}`,
		sameAs: metadata.codeRepository,
		author: {
			"@type": "Person",
			"@id": `${SITE_CONFIG.baseUrl}/#person`,
			name: ENTITY.name,
		},
		keywords: metadata.keywords,
		genre: metadata.applicationCategory,
	};
}

/**
 * Render JSON-LD script tag content.
 * Use this in a <script type="application/ld+json"> tag.
 */
export function renderJsonLd<T extends object>(schema: T): string {
	return JSON.stringify(schema, null, 0);
}

/**
 * Generate SoftwareApplication schema for a project (Story 5).
 * Uses the same metadata as CreativeWork but with SoftwareApplication type.
 *
 * @param fileId - The VFS file ID (e.g., "file.streamdrop")
 * @returns Schema object or null if project not found
 */
export function generateSoftwareApplicationSchema(
	fileId: string,
): SoftwareApplicationSchema | null {
	const metadata = PROJECT_METADATA[fileId];
	if (!metadata) return null;

	const fileSlug = fileId.replace("file.", "");

	// Map applicationCategory to Schema.org values
	const categoryMap: Record<string, string> = {
		EducationalApplication: "EducationalApplication",
		SecurityApplication: "SecurityApplication",
		EntertainmentApplication: "EntertainmentApplication",
		UtilitiesApplication: "UtilitiesApplication",
		SocialNetworkingApplication: "SocialNetworkingApplication",
	};

	const canonicalUrl = `${SITE_CONFIG.baseUrl}/projects/${fileSlug}`;

	return {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"@id": `${canonicalUrl}#software`,
		name: metadata.name,
		description: metadata.description,
		url: canonicalUrl,
		applicationCategory: categoryMap[metadata.applicationCategory] ?? "WebApplication",
		operatingSystem: "Web Browser",
		author: {
			"@type": "Person",
			"@id": `${SITE_CONFIG.baseUrl}/#person`,
			name: ENTITY.name,
		},
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "USD",
		},
		codeRepository: metadata.codeRepository,
		programmingLanguage: metadata.programmingLanguage,
		keywords: metadata.keywords,
	};
}

/**
 * Generate WebSite schema with SearchAction (Story 5).
 * Enables sitelinks search box eligibility.
 *
 * Note: The search action uses the homepage as target since
 * the portfolio doesn't have traditional search functionality.
 * This still signals site structure to search engines.
 *
 * @returns WebSite schema object
 */
export function generateWebSiteSchema(): WebSiteSchema {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${SITE_CONFIG.baseUrl}/#website`,
		name: SITE_CONFIG.siteName,
		description: SITE_CONFIG.description,
		url: SITE_CONFIG.baseUrl,
		publisher: {
			"@type": "Person",
			"@id": `${SITE_CONFIG.baseUrl}/#person`,
			name: ENTITY.name,
		},
		// Note: potentialAction omitted as site lacks search functionality
		// Can be added later if search is implemented
	};
}

/**
 * Entity Identity Data — Single Source of Truth
 *
 * Centralizes all identity data for the portfolio owner.
 * Used by:
 * - Schema.org JSON-LD generation (Person, ProfilePage)
 * - SSR Entity Card (crawlable identity signals)
 * - ProfileSidebar component
 * - AboutSystemModal component
 *
 * This ensures consistency between structured data claims
 * and visible DOM content — critical for entity verification.
 */

import { EDUCATION, PROFILE, SKILLS } from "@/lib/profile";

import { SITE_CONFIG } from "./metadata";

/**
 * Social profile link configuration.
 */
export interface SocialProfile {
	platform: string;
	url: string;
	username: string;
	ariaLabel: string;
}

/**
 * Work experience entry.
 */
export interface WorkExperience {
	organization: string;
	organizationUrl?: string;
	role: string;
	startDate: string;
	endDate?: string;
	current: boolean;
}

/**
 * Education entry.
 */
export interface Education {
	institution: string;
	institutionUrl?: string;
	degree?: string;
	field?: string;
	graduationYear?: number;
}

/**
 * Complete entity identity data.
 */
export interface EntityData {
	// Core identity
	name: string;
	givenName: string;
	familyName: string;
	jobTitle: string;
	description: string;

	// Location
	location: string;
	timezone: string;

	// Contact
	email: string;
	url: string;

	// Images
	profileImage: string;
	ogImage: string;

	// Social profiles (used in sameAs schema)
	socialProfiles: SocialProfile[];

	// Professional
	currentEmployer: WorkExperience;
	education: Education[];

	// Skills/expertise (used in knowsAbout schema)
	knowsAbout: string[];
}

/**
 * The Entity — built from src/lib/profile.ts
 *
 * This constant is the canonical source for all identity data used by SEO.
 */
export const ENTITY: EntityData = {
	// Core identity
	name: PROFILE.name,
	givenName: PROFILE.givenName,
	familyName: PROFILE.familyName,
	jobTitle: PROFILE.title,
	description: SITE_CONFIG.description,

	// Location
	location: PROFILE.location,
	timezone: PROFILE.timezone,

	// Contact
	email: PROFILE.email,
	url: SITE_CONFIG.baseUrl,

	// Images
	profileImage: "/assets/profile_picture/pfp.svg",
	ogImage: `${SITE_CONFIG.baseUrl}/assets/web_assets/og.png`,

	// Social profiles
	socialProfiles: [
		{
			platform: "GitHub",
			url: PROFILE.github,
			username: PROFILE.handle,
			ariaLabel: "View GitHub profile",
		},
		{
			platform: "LinkedIn",
			url: PROFILE.linkedin,
			username: "david-ashby",
			ariaLabel: "View LinkedIn profile",
		},
		{
			platform: "n8n",
			url: PROFILE.n8n,
			username: "n8n creator",
			ariaLabel: "View n8n creator profile",
		},
	],

	// Current employment
	currentEmployer: {
		organization: "Quality Electrical Systems",
		role: "Quality Engineer",
		startDate: "2026-03",
		current: true,
	},

	// Education
	education: EDUCATION.map((entry) => ({
		institution: entry.school,
		field: entry.name,
	})),

	// Skills and expertise
	knowsAbout: SKILLS.flatMap((group) => group.skills),
};

/**
 * Get social profile URLs for schema.org sameAs property.
 * Excludes internal links (like "Links" page).
 */
export function getSameAsUrls(): string[] {
	const externalPlatforms = ["GitHub", "LinkedIn", "n8n"];
	return ENTITY.socialProfiles
		.filter((profile) => externalPlatforms.includes(profile.platform))
		.map((profile) => profile.url);
}

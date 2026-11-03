import type { Metadata } from "next";
import { OS_INFO, PROFILE } from "@/lib/profile";
import { getFileById } from "@/os/filesystem/files";
import { AppID } from "@/os/store/types";
import {
	APP_SLUG_MAP,
	FILE_SLUG_MAP,
	generateCanonicalURL,
	type PageSearchParams,
} from "./url-state";

export const SITE_CONFIG = {
	name: PROFILE.name,
	title: PROFILE.title,
	siteName: OS_INFO.name,
	baseUrl: PROFILE.siteUrl,
	description:
		"David Ashby: quality engineer, ISO 27001/27701 lead auditor and open-source developer. GitHub portfolio, certifications and experience.",
	ogImage: "/assets/web_assets/og.png",
	twitterHandle: "",
} as const;

const APP_METADATA: Record<AppID, { title: string; description: string; ogImage?: string }> = {
	[AppID.About]: {
		title: "About",
		description: `About ${PROFILE.name}: ${PROFILE.title}.`,
	},
	[AppID.Terminal]: {
		title: "Terminal",
		description: "Terminal.",
	},
	[AppID.Settings]: {
		title: "Settings",
		description: "Settings.",
	},
	[AppID.FolderProjects]: {
		title: "Projects",
		description: "Selected open-source work across automation, security and hardware.",
	},
	[AppID.FolderCertifications]: {
		title: "Certifications",
		description: "Audit, quality and security certifications with credential IDs.",
	},
	[AppID.Browser]: {
		title: "Portfolio",
		description: "GitHub repository index.",
	},
	[AppID.MarkdownViewer]: {
		title: "Document",
		description: "Document viewer.",
	},
};

const FILE_METADATA: Record<string, { title?: string; description?: string }> = {};

export function generatePageMetadata(searchParams: PageSearchParams): Metadata {
	const appSlug = searchParams.app?.toLowerCase();
	const fileSlug = searchParams.file?.toLowerCase();

	if (!appSlug) {
		return {
			title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
			description: SITE_CONFIG.description,
			alternates: {
				canonical: SITE_CONFIG.baseUrl,
			},
			openGraph: {
				title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
				description: SITE_CONFIG.description,
				url: SITE_CONFIG.baseUrl,
				siteName: SITE_CONFIG.siteName,
				images: [
					{
						url: SITE_CONFIG.ogImage,
						width: 1200,
						height: 630,
						alt: `${SITE_CONFIG.name} - ${SITE_CONFIG.siteName}`,
					},
				],
				type: "website",
				locale: "en_US",
			},
			twitter: {
				card: "summary_large_image",
				title: `${SITE_CONFIG.name} | ${SITE_CONFIG.title}`,
				description: SITE_CONFIG.description,
				images: [SITE_CONFIG.ogImage],
			},
		};
	}

	const appId = APP_SLUG_MAP[appSlug];
	if (!appId) {
		return generatePageMetadata({});
	}

	const appMeta = APP_METADATA[appId];
	let title = appMeta.title;
	let description = appMeta.description;
	const ogImage = appMeta.ogImage ?? SITE_CONFIG.ogImage;
	let fileId: string | null = null;

	if (appId === AppID.MarkdownViewer && fileSlug) {
		fileId = FILE_SLUG_MAP[fileSlug] ?? null;
		const file = fileId ? getFileById(fileId) : undefined;

		if (file && fileId) {
			title = file.name;
			const fileMeta = FILE_METADATA[fileId];
			if (fileMeta?.description) {
				description = fileMeta.description;
			}
		}
	}

	const canonicalUrl = generateCanonicalURL(SITE_CONFIG.baseUrl, appId, fileId);

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			title: `${title} | ${SITE_CONFIG.siteName}`,
			description,
			url: canonicalUrl,
			siteName: SITE_CONFIG.siteName,
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
					alt: `${title} - ${SITE_CONFIG.siteName}`,
				},
			],
			type: "website",
			locale: "en_US",
		},
		twitter: {
			card: "summary_large_image",
			title: `${title} | ${SITE_CONFIG.siteName}`,
			description,
			images: [ogImage],
		},
	};
}

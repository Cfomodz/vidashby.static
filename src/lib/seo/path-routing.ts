// Maps clean URL paths to app state and vice versa

import { CERT_GROUPS, FEATURED_PROJECTS } from "@/lib/profile";
import { type FolderId, getFileById, VFS_REGISTRY } from "@/os/filesystem/files";
import {
	AppID,
	AUTO_FULLSCREEN_APPS,
	DEFAULT_WINDOW_SIZES,
	MAXIMIZED_APPS,
	type WindowInstance,
	type WindowProps,
} from "@/os/store/types";
import type { HydrationState } from "./url-state";

/**
 * Route configuration for static paths.
 */
interface StaticRouteConfig {
	appId: AppID;
	props?: WindowProps;
}

/**
 * Static route mappings (paths without dynamic segments).
 */
const STATIC_ROUTES: Record<string, StaticRouteConfig> = {
	"/about": { appId: AppID.About },
	"/resume": {
		appId: AppID.MarkdownViewer,
		props: { url: "/readmes/resume.md", title: "Résumé" },
	},
	"/projects": { appId: AppID.FolderProjects, props: { folderId: "projects" } },
	"/certifications": {
		appId: AppID.FolderCertifications,
		props: { folderId: "certifications" },
	},
};

/**
 * Project app slugs that map to dedicated app components (not markdown viewer).
 */
const PROJECT_APP_SLUGS = new Set<string>();

/**
 * File slug to file ID mapping for project markdown files.
 */
const PROJECT_FILE_SLUGS: Record<string, string> = Object.fromEntries(
	FEATURED_PROJECTS.map((project) => [project.slug, `file.${project.slug}`]),
);

/**
 * File slug to file ID mapping for certification markdown files.
 */
const CERTIFICATION_FILE_SLUGS: Record<string, string> = Object.fromEntries(
	[...CERT_GROUPS.map((group) => group.slug), "education"].map((slug) => [slug, `file.${slug}`]),
);

/**
 * Reverse mapping: AppID to canonical path.
 */
const APP_TO_PATH: Record<AppID, string> = {
	[AppID.About]: "/about",
	[AppID.Terminal]: "/", // Terminal doesn't have a dedicated route
	[AppID.Settings]: "/", // Settings doesn't have a dedicated route
	[AppID.Browser]: "/", // Browser doesn't have a dedicated route
	[AppID.FolderProjects]: "/projects",
	[AppID.FolderCertifications]: "/certifications",
	[AppID.MarkdownViewer]: "/", // Needs file context to determine path
};

/**
 * File ID to canonical path mapping.
 */
const FILE_ID_TO_PATH: Record<string, string> = {};

/**
 * Default viewport for SSR window positioning.
 */
const SSR_VIEWPORT = { width: 1440, height: 900 };
const SYSTEM_BAR_HEIGHT = 0;
const DOCK_HEIGHT = 80;
const MAXIMIZED_PADDING = 32;

/**
 * Calculate centered window position for SSR.
 */
function calculateSSRPosition(width: number, height: number): { x: number; y: number } {
	const availableHeight = SSR_VIEWPORT.height - SYSTEM_BAR_HEIGHT - DOCK_HEIGHT;
	return {
		x: Math.max(16, (SSR_VIEWPORT.width - width) / 2),
		y: Math.max(SYSTEM_BAR_HEIGHT + 8, SYSTEM_BAR_HEIGHT + (availableHeight - height) / 2),
	};
}

/**
 * Calculate maximized window size for SSR.
 */
function calculateSSRMaximizedSize(): { width: number; height: number } {
	return {
		width: SSR_VIEWPORT.width - MAXIMIZED_PADDING * 2,
		height: SSR_VIEWPORT.height - SYSTEM_BAR_HEIGHT - DOCK_HEIGHT - MAXIMIZED_PADDING,
	};
}

/**
 * Create a window instance for a given app and props.
 */
function createWindowForState(appId: AppID, props?: WindowProps): WindowInstance {
	const isMaximized = MAXIMIZED_APPS.has(appId);
	const defaultSize = DEFAULT_WINDOW_SIZES[appId];
	const size = isMaximized ? calculateSSRMaximizedSize() : defaultSize;

	const position = isMaximized
		? { x: MAXIMIZED_PADDING, y: SYSTEM_BAR_HEIGHT + MAXIMIZED_PADDING / 2 }
		: calculateSSRPosition(size.width, size.height);

	return {
		id: appId,
		status: "open",
		position,
		size,
		props,
		openedAt: Date.now(),
	};
}

/**
 * Parse a URL pathname into hydration state.
 *
 * @param pathname - The URL pathname (e.g., "/projects/streamdrop")
 * @returns HydrationState for store initialization
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: route parsing requires comprehensive path matching
export function parsePathToState(pathname: string): HydrationState {
	const emptyState: HydrationState = {
		windows: [],
		activeWindowId: null,
		fullscreenWindowId: null,
	};

	// Normalize pathname
	const normalizedPath = pathname.toLowerCase().replace(/\/$/, "") || "/";

	// Check static routes first
	if (normalizedPath === "/") {
		return emptyState;
	}

	const staticRoute = STATIC_ROUTES[normalizedPath];
	if (staticRoute) {
		const window = createWindowForState(staticRoute.appId, staticRoute.props);
		const shouldAutoFullscreen = AUTO_FULLSCREEN_APPS.has(staticRoute.appId);

		return {
			windows: [window],
			activeWindowId: staticRoute.appId,
			fullscreenWindowId: shouldAutoFullscreen ? staticRoute.appId : null,
		};
	}

	// Check dynamic routes
	const segments = normalizedPath.split("/").filter(Boolean);

	// /projects/[slug] route
	if (segments[0] === "projects" && segments.length === 2) {
		const slug = segments[1];

		// Skip if it's a project app (handled by static routes)
		if (slug && PROJECT_APP_SLUGS.has(slug)) {
			return emptyState; // Should have been caught by static routes
		}

		// Look up file by slug
		if (slug) {
			const fileId = PROJECT_FILE_SLUGS[slug];
			if (fileId) {
				const file = getFileById(fileId);
				if (file) {
					const window = createWindowForState(AppID.MarkdownViewer, {
						url: file.contentUrl,
						title: file.name,
					});
					return {
						windows: [window],
						activeWindowId: AppID.MarkdownViewer,
						fullscreenWindowId: AUTO_FULLSCREEN_APPS.has(AppID.MarkdownViewer)
							? AppID.MarkdownViewer
							: null,
					};
				}
			}
		}
	}

	// /certifications/[slug] route
	if (segments[0] === "certifications" && segments.length === 2) {
		const slug = segments[1];

		if (slug) {
			const fileId = CERTIFICATION_FILE_SLUGS[slug];
			if (fileId) {
				const file = getFileById(fileId);
				if (file) {
					const window = createWindowForState(AppID.MarkdownViewer, {
						url: file.contentUrl,
						title: file.name,
					});
					return {
						windows: [window],
						activeWindowId: AppID.MarkdownViewer,
						fullscreenWindowId: AUTO_FULLSCREEN_APPS.has(AppID.MarkdownViewer)
							? AppID.MarkdownViewer
							: null,
					};
				}
			}
		}
	}

	// No matching route - return empty state
	return emptyState;
}

/**
 * Get the canonical URL path for an app and optional window props.
 *
 * @param appId - The application ID
 * @param props - Optional window props (for file-based apps)
 * @returns The canonical URL path
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reverse mapping requires exhaustive file lookups
export function getCanonicalPath(appId: AppID | null, props?: WindowProps): string {
	if (!appId) {
		return "/";
	}

	// For MarkdownViewer, determine path from file URL
	if (appId === AppID.MarkdownViewer && props?.url) {
		// Extract file ID from URL
		const url = props.url;

		// Check for resume special case
		if (url === "/readmes/resume.md") {
			return "/resume";
		}

		// Find matching file ID from URL
		for (const [folderId, files] of Object.entries(VFS_REGISTRY)) {
			for (const file of files) {
				if (file.kind === "file" && file.contentUrl === url) {
					const path = FILE_ID_TO_PATH[file.id];
					if (path) {
						return path;
					}
					// Fallback: construct path from folder and file slug
					const slug = file.id.replace("file.", "");
					return `/${folderId}/${slug}`;
				}
			}
		}

		// Unknown file - return home
		return "/";
	}

	return APP_TO_PATH[appId] ?? "/";
}

/**
 * Convert a window state to a canonical URL path.
 * Used by URL sync to update browser URL when window state changes.
 *
 * @param window - The window instance
 * @returns The canonical URL path
 */
export function windowToPath(window: WindowInstance | null): string {
	if (!window) {
		return "/";
	}
	return getCanonicalPath(window.id, window.props);
}

/**
 * Get the legacy redirect path for query-parameter URLs.
 * Returns null if the legacy URL is invalid.
 *
 * @param appSlug - The app slug from ?app= param
 * @param fileSlug - The file slug from ?file= param
 * @returns The canonical path or null
 */
export function getLegacyRedirectPath(appSlug: string, fileSlug?: string): string | null {
	const normalizedApp = appSlug.toLowerCase();
	const normalizedFile = fileSlug?.toLowerCase();

	// Direct app mappings
	const appMappings: Record<string, string> = {
		about: "/about",
		resume: "/resume",
		terminal: "/", // No dedicated route
		settings: "/", // No dedicated route
		projects: "/projects",
		certifications: "/certifications",
		// Legacy folder app IDs
		"folder-projects": "/projects",
		"folder-certifications": "/certifications",
	};

	// Handle markdown viewer with file param
	if (normalizedApp === "markdown" && normalizedFile) {
		// Check project app slugs - legacy URLs may reference these
		if (PROJECT_APP_SLUGS.has(normalizedFile)) {
			return `/projects/${normalizedFile}`;
		}
		// Check project files
		if (PROJECT_FILE_SLUGS[normalizedFile]) {
			return `/projects/${normalizedFile}`;
		}
		// Check certification files
		if (CERTIFICATION_FILE_SLUGS[normalizedFile]) {
			return `/certifications/${normalizedFile}`;
		}
		// Check special files
		if (normalizedFile === "resume") {
			return "/resume";
		}
		// Unknown file
		return null;
	}

	return appMappings[normalizedApp] ?? null;
}

/**
 * Get all valid project file slugs for dynamic route generation.
 */
export function getProjectFileSlugs(): string[] {
	return Object.keys(PROJECT_FILE_SLUGS);
}

/**
 * Get all valid certification file slugs for dynamic route generation.
 */
export function getCertificationFileSlugs(): string[] {
	return Object.keys(CERTIFICATION_FILE_SLUGS);
}

/**
 * Check if a project slug is valid (either an app or a file).
 */
export function isValidProjectSlug(slug: string): boolean {
	return PROJECT_APP_SLUGS.has(slug) || slug in PROJECT_FILE_SLUGS;
}

/**
 * Check if a certification slug is valid.
 */
export function isValidCertificationSlug(slug: string): boolean {
	return slug in CERTIFICATION_FILE_SLUGS;
}

/**
 * Get file metadata for a project slug.
 * Returns null for project app slugs.
 */
export function getProjectFileBySlug(
	slug: string,
): { fileId: string; contentUrl: string; title: string } | null {
	const fileId = PROJECT_FILE_SLUGS[slug];
	if (!fileId) return null;

	const file = getFileById(fileId);
	if (!file) return null;

	return {
		fileId,
		contentUrl: file.contentUrl,
		title: file.name,
	};
}

/**
 * Get file metadata for a certification slug.
 */
export function getCertificationFileBySlug(
	slug: string,
): { fileId: string; contentUrl: string; title: string } | null {
	const fileId = CERTIFICATION_FILE_SLUGS[slug];
	if (!fileId) return null;

	const file = getFileById(fileId);
	if (!file) return null;

	return {
		fileId,
		contentUrl: file.contentUrl,
		title: file.name,
	};
}

/**
 * Get all indexable paths for sitemap generation.
 */
export function getAllCanonicalPaths(): string[] {
	const paths: string[] = ["/", "/about", "/resume", "/projects", "/certifications"];

	// Add project file paths
	for (const slug of Object.keys(PROJECT_FILE_SLUGS)) {
		paths.push(`/projects/${slug}`);
	}

	// Add certification file paths
	for (const slug of Object.keys(CERTIFICATION_FILE_SLUGS)) {
		paths.push(`/certifications/${slug}`);
	}

	return paths;
}

/**
 * Determine the folder type from a pathname.
 */
export function getFolderFromPath(pathname: string): FolderId | null {
	const segments = pathname.toLowerCase().split("/").filter(Boolean);
	if (segments[0] === "projects") return "projects";
	if (segments[0] === "certifications") return "certifications";
	return null;
}

// Hidden nav for crawler discovery (sr-only links to all routes)

import { getAllCanonicalPaths } from "./path-routing";

const PATH_LABELS: Record<string, string> = {
	"/": "Homepage",
	"/about": "About",
	"/resume": "Résumé",
	"/projects": "Projects",
	"/certifications": "Certifications",
};

/**
 * Get a human-readable label for a path.
 */
function getPathLabel(path: string): string {
	return PATH_LABELS[path] ?? path.split("/").pop()?.replace(/-/g, " ") ?? path;
}

export interface SiteIndexProps {
	/** Base URL for absolute links (optional, defaults to relative) */
	baseUrl?: string;
}

/**
 * Hidden site index for crawler discovery.
 *
 * Renders all canonical routes as accessible anchor tags,
 * hidden from visual users but discoverable by search engines.
 *
 * @example
 * ```tsx
 * // In layout or page component
 * <SiteIndex />
 * ```
 */
export function SiteIndex({ baseUrl }: SiteIndexProps) {
	const paths = getAllCanonicalPaths();

	return (
		<nav
			aria-label="Site index for search engines"
			className="sr-only"
			// Additional fallback for crawlers that might not respect sr-only
			style={{
				position: "absolute",
				width: "1px",
				height: "1px",
				padding: 0,
				margin: "-1px",
				overflow: "hidden",
				clip: "rect(0, 0, 0, 0)",
				whiteSpace: "nowrap",
				border: 0,
			}}
		>
			<h2>Site Navigation</h2>
			<ul>
				{paths.map((path) => {
					const href = baseUrl ? `${baseUrl}${path}` : path;
					const label = getPathLabel(path);

					return (
						<li key={path}>
							<a href={href}>{label}</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

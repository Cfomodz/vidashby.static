/**
 * Content Module — Server-Side Content Utilities
 *
 * Re-exports server-side content fetching utilities.
 * These are server-only modules for use in Server Components.
 *
 * Story 5 additions:
 * - Resume semantic parsing
 */

export {
	type ContentFetchResult,
	fetchMarkdownContent,
	fetchParsedResume,
	hydrateWindowContent,
	isAllowedContentPath,
	type ParsedResume,
	parseResumeMarkdown,
	type ResumeSection,
	safeFetchMarkdownContent,
} from "./server";

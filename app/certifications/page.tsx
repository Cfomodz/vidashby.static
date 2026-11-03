import type { Metadata } from "next";
import { generatePathMetadata, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

/**
 * Generate metadata for the certifications folder page.
 */
export function generateMetadata(): Metadata {
	return generatePathMetadata("/certifications");
}

/**
 * Certifications Folder Page — /certifications
 *
 * Opens the Certifications folder window.
 */
export default async function CertificationsPage() {
	const initialState = parsePathToState("/certifications");

	return <OSShell initialState={initialState} />;
}

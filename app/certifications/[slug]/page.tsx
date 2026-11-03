import type { Metadata } from "next";
import {
	generateCertificationFileMetadata,
	getCertificationFileSlugs,
	parsePathToState,
} from "@/lib/seo";
import { OSShell } from "@/os/ssr";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
	return getCertificationFileSlugs().map((slug) => ({ slug }));
}

interface CertificationFilePageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CertificationFilePageProps): Promise<Metadata> {
	const { slug } = await params;
	return generateCertificationFileMetadata(slug) ?? {};
}

/**
 * Certification document page — /certifications/[slug]
 *
 * Opens the certification group's markdown document in the Markdown Viewer.
 */
export default async function CertificationFilePage({ params }: CertificationFilePageProps) {
	const { slug } = await params;
	const initialState = parsePathToState(`/certifications/${slug}`);

	return <OSShell initialState={initialState} hasContentH1 />;
}

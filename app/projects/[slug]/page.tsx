import type { Metadata } from "next";
import { generateProjectFileMetadata, getProjectFileSlugs, parsePathToState } from "@/lib/seo";
import { OSShell } from "@/os/ssr";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
	return getProjectFileSlugs().map((slug) => ({ slug }));
}

interface ProjectFilePageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectFilePageProps): Promise<Metadata> {
	const { slug } = await params;
	return generateProjectFileMetadata(slug) ?? {};
}

/**
 * Project document page — /projects/[slug]
 *
 * Opens the project's markdown document in the Markdown Viewer.
 */
export default async function ProjectFilePage({ params }: ProjectFilePageProps) {
	const { slug } = await params;
	const initialState = parsePathToState(`/projects/${slug}`);

	return <OSShell initialState={initialState} fileId={`file.${slug}`} hasContentH1 />;
}

/**
 * Virtual File System (VFS) Registry
 *
 * Hierarchical data structure mirroring the terminal VFS.
 * Desktop folders display the same tree the terminal exposes.
 */

import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

import { CERT_GROUPS, FEATURED_PROJECTS } from "@/lib/profile";

/**
 * Supported file types in the VFS.
 */
export type FileType = "md" | "txt";

/**
 * A node in the desktop VFS — either a file or a folder.
 */
export type VFSEntry =
	| {
			kind: "file";
			id: string;
			name: string;
			type: FileType;
			icon: LucideIcon;
			/** URL to fetch content from /public, or inline content string */
			contentUrl?: string;
			/** Inline content (used when mirroring terminal VFS text) */
			content?: string;
	  }
	| {
			kind: "folder";
			id: string;
			name: string;
			children: VFSEntry[];
	  };

// ---- legacy compat re-export (used by getFileById) ----
export interface VirtualFile {
	id: string;
	name: string;
	type: FileType;
	icon: LucideIcon;
	contentUrl: string;
}

/**
 * Folder identifiers matching desktop folder apps.
 */
export type FolderId = "projects" | "certifications";

function markdownFile(slug: string, name: string): VFSEntry {
	return {
		kind: "file",
		id: `file.${slug}`,
		name,
		type: "md",
		icon: FileText,
		contentUrl: `/readmes/${slug}.md`,
	};
}

/**
 * Projects — mirrors terminal VFS at /projects/
 */
const PROJECTS_TREE: VFSEntry[] = FEATURED_PROJECTS.map((project) =>
	markdownFile(project.slug, `${project.slug}.md`),
);

/**
 * Certifications — mirrors terminal VFS at /certifications/
 */
const CERTIFICATIONS_TREE: VFSEntry[] = [
	...CERT_GROUPS.map((group) => markdownFile(group.slug, `${group.slug}.md`)),
	markdownFile("education", "education.md"),
];

/**
 * VFS Registry mapping folder IDs to their entry trees.
 */
export const VFS_REGISTRY: Record<FolderId, VFSEntry[]> = {
	projects: PROJECTS_TREE,
	certifications: CERTIFICATIONS_TREE,
};

/**
 * Get the entry tree for a folder.
 */
export function getEntriesForFolder(folderId: FolderId): VFSEntry[] {
	return VFS_REGISTRY[folderId] ?? [];
}

// ---- legacy helpers (still used by some callers) ----

export function getFilesForFolder(folderId: FolderId): VirtualFile[] {
	// Flatten all files from the tree for backward compat
	const result: VirtualFile[] = [];
	function walk(entries: VFSEntry[]) {
		for (const e of entries) {
			if (e.kind === "file" && e.contentUrl) {
				result.push({
					id: e.id,
					name: e.name,
					type: e.type,
					icon: e.icon,
					contentUrl: e.contentUrl,
				});
			} else if (e.kind === "folder") {
				walk(e.children);
			}
		}
	}
	walk(VFS_REGISTRY[folderId] ?? []);
	return result;
}

export function getFileById(fileId: string): VirtualFile | undefined {
	for (const entries of Object.values(VFS_REGISTRY)) {
		const found = findFile(entries, fileId);
		if (found) return found;
	}
	return undefined;
}

function findFile(entries: VFSEntry[], id: string): VirtualFile | undefined {
	for (const e of entries) {
		if (e.kind === "file" && e.id === id && e.contentUrl) {
			return { id: e.id, name: e.name, type: e.type, icon: e.icon, contentUrl: e.contentUrl };
		}
		if (e.kind === "folder") {
			const found = findFile(e.children, id);
			if (found) return found;
		}
	}
	return undefined;
}

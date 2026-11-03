"use client";

import { ChevronLeft, FileText, Folder } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { type FolderId, type VFSEntry, getEntriesForFolder } from "@/os/filesystem";
import { useNavigate } from "@/os/hooks";
import { AppID } from "@/os/store";
import type { AppComponentProps } from "@/os/window/app-registry";

export interface FolderAppProps extends AppComponentProps {}

// Finder-style folder viewer with nested navigation via the VFS
export const FolderApp = memo(function FolderApp({ windowProps }: FolderAppProps) {
	const folderId = windowProps?.folderId as FolderId | undefined;
	const rootEntries = folderId ? getEntriesForFolder(folderId) : [];

	// Stack-based navigation: push on drill-in, pop on back
	const [path, setPath] = useState<{ entries: VFSEntry[]; label: string }[]>([]);
	const currentEntries = path.length > 0 ? path[path.length - 1]!.entries : rootEntries;

	const navigateInto = useCallback(
		(folder: VFSEntry & { kind: "folder" }) => {
			setPath((prev) => [...prev, { entries: folder.children, label: folder.name }]);
		},
		[],
	);

	const navigateBack = useCallback(() => {
		setPath((prev) => prev.slice(0, -1));
	}, []);

	if (rootEntries.length === 0) {
		return <EmptyState />;
	}

	const itemCount = currentEntries.length;

	return (
		<div className="relative flex h-full flex-col">
			{path.length > 0 && (
				<div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
					<button
						type="button"
						onClick={navigateBack}
						className="flex items-center gap-1 rounded px-1.5 py-0.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80"
					>
						<ChevronLeft className="h-3.5 w-3.5" />
						<span className="font-mono text-xs">Back</span>
					</button>
					<span className="font-mono text-xs text-white/30">/</span>
					{path.map((p, i) => (
						<span key={p.label} className="font-mono text-xs text-white/50">
							{p.label}
							{i < path.length - 1 && <span className="ml-2 text-white/30">/</span>}
						</span>
					))}
				</div>
			)}

			<div className="relative flex-1 overflow-y-auto p-4">
				<div className="relative grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
					{currentEntries.map((entry) =>
						entry.kind === "folder" ? (
							<FolderIcon key={entry.id} entry={entry} onOpen={navigateInto} />
						) : (
							<FileIcon key={entry.id} entry={entry} />
						),
					)}
				</div>
			</div>

			<div className="border-t border-white/[0.06] bg-white/[0.03] px-4 py-2">
				<p className="font-mono text-xs text-white/40">
					{itemCount} {itemCount === 1 ? "item" : "items"}
				</p>
			</div>
		</div>
	);
});

// Double-click to navigate into a sub-folder
function FolderIcon({
	entry,
	onOpen,
}: {
	entry: VFSEntry & { kind: "folder" };
	onOpen: (folder: VFSEntry & { kind: "folder" }) => void;
}) {
	const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const clickCountRef = useRef(0);

	// Manual double-click detection (more reliable cross-browser than ondblclick)
	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			clickCountRef.current += 1;

			if (clickCountRef.current === 1) {
				clickTimeoutRef.current = setTimeout(() => {
					clickCountRef.current = 0;
				}, 300);
			} else if (clickCountRef.current === 2) {
				if (clickTimeoutRef.current) {
					clearTimeout(clickTimeoutRef.current);
					clickTimeoutRef.current = null;
				}
				clickCountRef.current = 0;
				onOpen(entry);
			}
		},
		[entry, onOpen],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onOpen(entry);
			}
		},
		[entry, onOpen],
	);

	return (
		<button
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className="group flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
			aria-label={`Open folder ${entry.name}`}
		>
			<div className="relative">
				<div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/[0.03] transition-colors group-hover:bg-white/[0.06]">
					<Folder
						className="h-8 w-8 text-white/50 transition-colors group-hover:text-white/70"
						strokeWidth={1.5}
					/>
				</div>
			</div>
			<span
				className="max-w-full truncate px-1 font-mono text-xs text-white/70 transition-colors group-hover:text-white/90"
				title={entry.name}
			>
				{entry.name}
			</span>
		</button>
	);
}

// Double-click to open file in MarkdownViewer
function FileIcon({ entry }: { entry: VFSEntry & { kind: "file" } }) {
	const { navigate } = useNavigate();
	const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const clickCountRef = useRef(0);

	const openFile = useCallback(() => {
		trackEvent(AnalyticsEvent.FILE_OPENED, {
			file_slug: entry.id,
			file_type: entry.type,
		});

		navigate(AppID.MarkdownViewer, {
			props: {
				url: entry.contentUrl ?? "",
				title: entry.name,
			},
			launchMethod: "app",
		});
	}, [entry, navigate]);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			clickCountRef.current += 1;

			if (clickCountRef.current === 1) {
				clickTimeoutRef.current = setTimeout(() => {
					clickCountRef.current = 0;
				}, 300);
			} else if (clickCountRef.current === 2) {
				if (clickTimeoutRef.current) {
					clearTimeout(clickTimeoutRef.current);
					clickTimeoutRef.current = null;
				}
				clickCountRef.current = 0;
				openFile();
			}
		},
		[openFile],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openFile();
			}
		},
		[openFile],
	);

	return (
		<button
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className="group flex flex-col items-center gap-1.5 rounded-lg p-3 transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
			aria-label={`Open ${entry.name}`}
		>
			<div className="relative">
				<div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/[0.03] transition-colors group-hover:bg-white/[0.06]">
					<FileText
						className="h-8 w-8 text-white/50 transition-colors group-hover:text-white/70"
						strokeWidth={1.5}
					/>
				</div>
				<span className="absolute -bottom-1 -right-1 rounded bg-white/20 px-1 py-0.5 font-mono text-[9px] font-bold uppercase leading-none text-white/70 shadow-sm">
					{entry.type}
				</span>
			</div>
			<span
				className="max-w-full truncate px-1 font-mono text-xs text-white/70 transition-colors group-hover:text-white/90"
				title={entry.name}
			>
				{entry.name}
			</span>
		</button>
	);
}

function EmptyState() {
	return (
		<div className="relative flex h-full flex-col items-center justify-center">
			<div className="relative flex flex-col items-center gap-4 text-center">
				<div className="rounded-2xl bg-white/[0.03] p-6">
					<Folder className="h-16 w-16 text-white/20" strokeWidth={1} aria-hidden="true" />
				</div>
				<div className="space-y-1">
					<p className="font-mono text-sm text-white/40">This folder is empty</p>
					<p className="font-mono text-xs text-white/20">0 items</p>
				</div>
			</div>
		</div>
	);
}

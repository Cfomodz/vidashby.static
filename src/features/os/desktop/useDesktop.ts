"use client";

import { useCallback, useRef, useState } from "react";

import { AppID } from "@/os/store";

export type DesktopIconType = "folder" | "file";

export interface DesktopItem {
	id: string;
	label: string;
	appId: AppID;
	iconType: DesktopIconType;
	folderId?: string;
	contentUrl?: string;
	title?: string;
}

export interface SelectionRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

// CUSTOMIZE: Add, remove, or rename desktop icons here.
// Each item appears as a clickable icon on the desktop.
export const DESKTOP_ITEMS: DesktopItem[] = [
	{
		id: "projects",
		label: "Projects",
		appId: AppID.FolderProjects,
		iconType: "folder",
		folderId: "projects",
	},
	{
		id: "certifications",
		label: "Certifications",
		appId: AppID.FolderCertifications,
		iconType: "folder",
		folderId: "certifications",
	},
	{
		id: "resume",
		label: "Résumé",
		appId: AppID.MarkdownViewer,
		iconType: "file",
		contentUrl: "/readmes/resume.md",
		title: "Résumé",
	},
	{
		id: "portfolio",
		label: "Portfolio",
		appId: AppID.Browser,
		iconType: "file",
	},
];

function rectsIntersect(a: SelectionRect, b: SelectionRect): boolean {
	return !(
		a.x + a.width < b.x ||
		b.x + b.width < a.x ||
		a.y + a.height < b.y ||
		b.y + b.height < a.y
	);
}

// Manages desktop icon selection and rubber-band (drag-to-select) logic.
export function useDesktop() {
	const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
	const iconRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

	const selectItem = useCallback((itemId: string) => {
		setSelectedItemIds(new Set([itemId]));
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedItemIds(new Set());
	}, []);

	const registerIconRef = useCallback((itemId: string, element: HTMLButtonElement | null) => {
		if (element) {
			iconRefs.current.set(itemId, element);
		} else {
			iconRefs.current.delete(itemId);
		}
	}, []);

	// Selects all icons that intersect with the rubber-band selection box
	const updateSelectionFromBox = useCallback(
		(selectionBox: SelectionRect, containerRect: DOMRect) => {
			const newSelection = new Set<string>();

			for (const item of DESKTOP_ITEMS) {
				const element = iconRefs.current.get(item.id);
				if (!element) continue;

				const iconRect = element.getBoundingClientRect();

				const relativeIconRect: SelectionRect = {
					x: iconRect.left - containerRect.left,
					y: iconRect.top - containerRect.top,
					width: iconRect.width,
					height: iconRect.height,
				};

				if (rectsIntersect(selectionBox, relativeIconRect)) {
					newSelection.add(item.id);
				}
			}

			setSelectedItemIds(newSelection);
		},
		[],
	);

	return {
		items: DESKTOP_ITEMS,
		selectedItemIds,
		selectItem,
		clearSelection,
		registerIconRef,
		updateSelectionFromBox,
	};
}

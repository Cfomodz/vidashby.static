import { Globe, Info, type LucideIcon, Settings, SquareTerminal } from "lucide-react";

import { AppID, type DockStackID } from "@/os/store";

interface DockIconStyle {
	icon?: LucideIcon;
	iconSrc?: string;
	gradient?: [string, string];
	backgroundColor?: string;
	iconPadding?: string;
}

// App item — launches an app directly when clicked
export interface DockAppItem extends DockIconStyle {
	type: "app";
	id: AppID;
	label: string;
}

// Stack item — expandable folder on mobile containing multiple apps
export interface DockStackItem extends DockIconStyle {
	type: "stack";
	id: DockStackID;
	label: string;
	contents: AppID[];
}

export type DockItem = DockAppItem | DockStackItem;

export function isDockStackItem(item: DockItem): item is DockStackItem {
	return item.type === "stack";
}

export function isDockAppItem(item: DockItem): item is DockAppItem {
	return item.type === "app";
}

// @deprecated Use DockItem instead
export type DockItemConfig = DockAppItem;

// CUSTOMIZE: Add, remove, or reorder desktop dock apps here.
// Each entry needs an AppID (defined in store), a label, and an icon or iconSrc.
export const DOCK_ITEMS: DockAppItem[] = [
	{
		type: "app",
		id: AppID.About,
		label: "About",
		icon: Info,
		gradient: ["#8E8E93", "#636366"],
	},
	{
		type: "app",
		id: AppID.Terminal,
		label: "Terminal",
		icon: SquareTerminal,
		gradient: ["#8E8E93", "#636366"],
	},
	{
		type: "app",
		id: AppID.Browser,
		label: "Browser",
		icon: Globe,
		gradient: ["#8E8E93", "#636366"],
	},
	{
		type: "app",
		id: AppID.Settings,
		label: "Settings",
		icon: Settings,
		gradient: ["#8E8E93", "#636366"],
	},
];

// CUSTOMIZE: Add, remove, or reorder mobile dock apps here.
// Stacks group multiple apps into one folder icon to save horizontal space.
export const MOBILE_DOCK_ITEMS: DockItem[] = [
	{
		type: "app",
		id: AppID.About,
		label: "About",
		icon: Info,
		gradient: ["#8E8E93", "#636366"],
	},
	{
		type: "app",
		id: AppID.Terminal,
		label: "Terminal",
		icon: SquareTerminal,
		gradient: ["#8E8E93", "#636366"],
	},
	{
		type: "app",
		id: AppID.Browser,
		label: "Browser",
		icon: Globe,
		gradient: ["#8E8E93", "#636366"],
	},
	{
		type: "app",
		id: AppID.Settings,
		label: "Settings",
		icon: Settings,
		gradient: ["#8E8E93", "#636366"],
	},
];

// Lookup map for resolving full app config by AppID (used by DockStack)
export const APP_CONFIG_MAP: Record<AppID, DockAppItem | undefined> = DOCK_ITEMS.reduce(
	(acc, item) => {
		acc[item.id] = item;
		return acc;
	},
	{} as Record<AppID, DockAppItem | undefined>,
);

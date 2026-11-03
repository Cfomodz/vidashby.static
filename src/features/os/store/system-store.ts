import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";

import type {
	AppID,
	BootPhase,
	DockConfig,
	LaunchMethod,
	SystemStore,
	WindowInstance,
	WindowPosition,
	WindowSize,
	WindowSpawnConfig,
} from "./types";
import {
	AUTO_FULLSCREEN_APPS,
	DEFAULT_DOCK_CONFIG,
	DEFAULT_WINDOW_SIZES,
	MAXIMIZED_APPS,
} from "./types";

// Only wallpaper, dock, and terminal prefs persist across sessions
interface PersistedState {
	wallpaper: string | null;
	dockConfig: DockConfig;
	terminalFontColor: string;
	iconColor: string;
}

// CUSTOMIZE: Assumed viewport for SSR/initial render before client hydration
const DEFAULT_VIEWPORT = { width: 1440, height: 900 };

const MAXIMIZED_PADDING = 32;

function calculateMaximizedSize(): WindowSize {
	const viewport =
		typeof window !== "undefined"
			? { width: window.innerWidth, height: window.innerHeight }
			: DEFAULT_VIEWPORT;

	const systemBarHeight = 0;
	const dockHeight = 80;

	return {
		width: viewport.width - MAXIMIZED_PADDING * 2,
		height: viewport.height - systemBarHeight - dockHeight - MAXIMIZED_PADDING,
	};
}

// Centers window with cascade offset so stacked windows don't overlap exactly
function calculateCenteredPosition(windowSize: WindowSize, windowCount: number): WindowPosition {
	const cascadeOffset = 24;

	const viewport =
		typeof window !== "undefined"
			? { width: window.innerWidth, height: window.innerHeight }
			: DEFAULT_VIEWPORT;

	const systemBarHeight = 0;
	const dockHeight = 80;
	const availableHeight = viewport.height - systemBarHeight - dockHeight;

	const centerX = (viewport.width - windowSize.width) / 2;
	const centerY = systemBarHeight + (availableHeight - windowSize.height) / 2;

	const offset = (windowCount % 6) * cascadeOffset;

	return {
		x: Math.max(16, centerX + offset),
		y: Math.max(systemBarHeight + 8, centerY + offset),
	};
}

function calculateWindowSize(appId: AppID, configSize?: WindowSize): WindowSize {
	const isMaximized = MAXIMIZED_APPS.has(appId);
	const defaultSize = isMaximized ? calculateMaximizedSize() : DEFAULT_WINDOW_SIZES[appId];
	return configSize ?? defaultSize;
}

function calculateWindowPosition(
	appId: AppID,
	windowSize: WindowSize,
	windowCount: number,
	configPosition?: WindowPosition,
): WindowPosition {
	if (configPosition) return configPosition;

	const isMaximized = MAXIMIZED_APPS.has(appId);
	if (isMaximized) {
		return { x: MAXIMIZED_PADDING, y: MAXIMIZED_PADDING / 2 };
	}
	return calculateCenteredPosition(windowSize, windowCount);
}

function createWindowInstance(
	appId: AppID,
	windowCount: number,
	config?: WindowSpawnConfig,
): WindowInstance {
	const size = calculateWindowSize(appId, config?.size);
	const position = calculateWindowPosition(appId, size, windowCount, config?.position);

	return {
		id: appId,
		status: "open",
		position,
		size,
		props: config?.props,
		openedAt: Date.now(),
	};
}

// Returns topmost visible window, or null
function findNextFocusTarget(windows: WindowInstance[], excludeId?: AppID): AppID | null {
	for (let i = windows.length - 1; i >= 0; i--) {
		const window = windows[i];
		if (window && window.status === "open" && window.id !== excludeId) {
			return window.id;
		}
	}
	return null;
}

// Array order = z-index (last = topmost). Use granular selectors to avoid unnecessary re-renders.
export const useSystemStore = create<SystemStore>()(
	persist(
		(set, get) => ({
			bootPhase: "hidden" as BootPhase,
			windows: [],
			activeWindowId: null,
			fullscreenWindowId: null,
			// CUSTOMIZE: Default wallpaper path (null = grid/vignette background)
			wallpaper: "/assets/wallpapers/wall-4.jpg",
			dockConfig: DEFAULT_DOCK_CONFIG,
			terminalFontColor: "white" as const,
			iconColor: "blue" as const,
			bootTime: Date.now(),
			desktopRefreshKey: 0,
			isAboutModalOpen: false,
			isLocked: false,

			setBootPhase: (phase: BootPhase) => {
				const { bootPhase: previousPhase, bootTime } = get();
				set({ bootPhase: phase });

				if (phase === "complete" && previousPhase !== "complete") {
					const bootDuration = Date.now() - bootTime;
					trackEvent(AnalyticsEvent.OS_BOOT_COMPLETE, {
						boot_duration_ms: bootDuration,
					});
				}
			},

			launchApp: (appId: AppID, config?: WindowSpawnConfig) => {
				const { windows } = get();
				const existingWindow = windows.find((w) => w.id === appId);
				const shouldAutoFullscreen = AUTO_FULLSCREEN_APPS.has(appId);
				const fullscreenId = shouldAutoFullscreen ? appId : get().fullscreenWindowId;
				const launchMethod: LaunchMethod = config?.launchMethod ?? "system";

				if (existingWindow) {
					// Already open — restore if minimized and bring to front
					const updatedWindows = windows.filter((w) => w.id !== appId);
					updatedWindows.push({ ...existingWindow, status: "open" });

					set({
						windows: updatedWindows,
						activeWindowId: appId,
						fullscreenWindowId: fullscreenId,
					});
					return;
				}

				const newWindow = createWindowInstance(appId, windows.length, config);
				set({
					windows: [...windows, newWindow],
					activeWindowId: appId,
					fullscreenWindowId: fullscreenId,
				});

				trackEvent(AnalyticsEvent.APP_WINDOW_OPENED, {
					app_id: appId,
					launch_method: launchMethod,
				});
			},

			closeWindow: (id: AppID) => {
				const { windows, activeWindowId, fullscreenWindowId } = get();
				const closingWindow = windows.find((w) => w.id === id);
				const filteredWindows = windows.filter((w) => w.id !== id);

				const newActiveId =
					activeWindowId === id ? findNextFocusTarget(filteredWindows) : activeWindowId;

				const newFullscreenId = fullscreenWindowId === id ? null : fullscreenWindowId;

				set({
					windows: filteredWindows,
					activeWindowId: newActiveId,
					fullscreenWindowId: newFullscreenId,
				});

				if (closingWindow) {
					const sessionDuration = Date.now() - closingWindow.openedAt;
					trackEvent(AnalyticsEvent.APP_WINDOW_CLOSED, {
						app_id: id,
						session_duration_ms: sessionDuration,
					});
				}
			},

			focusWindow: (id: AppID) => {
				const { windows, activeWindowId } = get();

				if (activeWindowId === id && windows[windows.length - 1]?.id === id) {
					return;
				}

				const windowIndex = windows.findIndex((w) => w.id === id);
				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				// Move to end of array = highest z-index
				const reorderedWindows = windows.filter((w) => w.id !== id);
				reorderedWindows.push({
					...targetWindow,
					status: "open",
				});

				set({
					windows: reorderedWindows,
					activeWindowId: id,
				});
			},

			minimizeWindow: (id: AppID) => {
				const { windows, activeWindowId, fullscreenWindowId } = get();
				const windowIndex = windows.findIndex((w) => w.id === id);

				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				const updatedWindows = [...windows];
				updatedWindows[windowIndex] = {
					...targetWindow,
					status: "minimized",
				};

				const newActiveId =
					activeWindowId === id ? findNextFocusTarget(updatedWindows, id) : activeWindowId;

				const newFullscreenId = fullscreenWindowId === id ? null : fullscreenWindowId;

				set({
					windows: updatedWindows,
					activeWindowId: newActiveId,
					fullscreenWindowId: newFullscreenId,
				});
			},

			updateWindowPosition: (id: AppID, position: WindowPosition) => {
				const { windows } = get();
				const windowIndex = windows.findIndex((w) => w.id === id);

				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				const updatedWindows = [...windows];
				updatedWindows[windowIndex] = {
					...targetWindow,
					position,
				};

				set({ windows: updatedWindows });
			},

			updateWindowSize: (id: AppID, size: WindowSize) => {
				const { windows } = get();
				const windowIndex = windows.findIndex((w) => w.id === id);

				if (windowIndex === -1) return;

				const targetWindow = windows[windowIndex];
				if (!targetWindow) return;

				const updatedWindows = [...windows];
				updatedWindows[windowIndex] = {
					...targetWindow,
					size,
				};

				set({ windows: updatedWindows });
			},

			toggleFullscreen: (id: AppID) => {
				const { fullscreenWindowId } = get();

				if (fullscreenWindowId === id) {
					set({ fullscreenWindowId: null });
				} else {
					get().focusWindow(id);
					set({ fullscreenWindowId: id });
				}
			},

			exitFullscreen: () => {
				set({ fullscreenWindowId: null });
			},

			setWallpaper: (path: string | null) => {
				set({ wallpaper: path });
			},

			setDockConfig: (config: Partial<DockConfig>) => {
				const { dockConfig } = get();
				set({
					dockConfig: {
						...dockConfig,
						...config,
					},
				});
			},

			setTerminalFontColor: (color) => {
				set({ terminalFontColor: color });
			},

			setIconColor: (color) => {
				set({ iconColor: color });
			},

			refreshDesktop: () => {
				set((state) => ({
					desktopRefreshKey: state.desktopRefreshKey + 1,
				}));
			},

			lockSystem: () => {
				set({ isLocked: true });
			},

			unlockSystem: () => {
				set({ isLocked: false });
			},

			toggleAboutModal: (isOpen: boolean) => {
				set({ isAboutModalOpen: isOpen });
			},
		}),
		{
			// CUSTOMIZE: localStorage key for persisted preferences
			name: "jos-preferences",
			partialize: (state): PersistedState => ({
				wallpaper: state.wallpaper,
				dockConfig: state.dockConfig,
				terminalFontColor: state.terminalFontColor,
				iconColor: state.iconColor,
			}),
		},
	),
);

// Returns false during SSR, true after localStorage hydration.
// Use to prevent hydration mismatches when persisted state differs from defaults.
export function useHasHydrated(): boolean {
	const [hasHydrated, setHasHydrated] = React.useState(false);

	React.useEffect(() => {
		setHasHydrated(true);
	}, []);

	return hasHydrated;
}

// Selectors — use these for granular subscriptions to avoid unnecessary re-renders.
// Selectors returning derived arrays/objects need useShallow from 'zustand/react/shallow'.
export const selectWindows = (state: SystemStore) => state.windows;
export const selectActiveWindowId = (state: SystemStore) => state.activeWindowId;
export const selectFullscreenWindowId = (state: SystemStore) => state.fullscreenWindowId;
export const selectIsWindowActive = (id: AppID) => (state: SystemStore) =>
	state.activeWindowId === id;
export const selectIsWindowFullscreen = (id: AppID) => (state: SystemStore) =>
	state.fullscreenWindowId === id;
export const selectIsAnyWindowFullscreen = (state: SystemStore) =>
	state.fullscreenWindowId !== null;
export const selectWindowById = (id: AppID) => (state: SystemStore) =>
	state.windows.find((w) => w.id === id);
export const selectWallpaper = (state: SystemStore) => state.wallpaper;
export const selectDockConfig = (state: SystemStore) => state.dockConfig;
export const selectBootPhase = (state: SystemStore) => state.bootPhase;
export const selectBootTime = (state: SystemStore) => state.bootTime;
export const selectDesktopRefreshKey = (state: SystemStore) => state.desktopRefreshKey;
export const selectIsAboutModalOpen = (state: SystemStore) => state.isAboutModalOpen;
export const selectIsLocked = (state: SystemStore) => state.isLocked;

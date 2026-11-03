"use client";

import { useEffect, useRef } from "react";

import { selectWallpaper, useSystemStore } from "@/os/store";

import type { DeviceType } from "./dock/useDeviceType";
import { useDeviceType } from "./dock/useDeviceType";
import {
	DEFAULT_MOBILE_WALLPAPER_PATH,
	DEFAULT_WALLPAPER_PATH,
	isDesktopWallpaper,
	isMobileWallpaper,
	MOBILE_WALLPAPER_MAP,
	WALLPAPER_MAP,
} from "./wallpapers";

// Returns null if current wallpaper is valid, otherwise the correct fallback path
function getWallpaperFallback(
	currentWallpaper: string | null,
	deviceType: DeviceType,
): string | null {
	const isMobile = deviceType === "mobile";
	const defaultPath = isMobile ? DEFAULT_MOBILE_WALLPAPER_PATH : DEFAULT_WALLPAPER_PATH;

	if (!currentWallpaper) {
		return defaultPath;
	}

	const inRegistry = WALLPAPER_MAP.has(currentWallpaper) || MOBILE_WALLPAPER_MAP.has(currentWallpaper);
	if (!inRegistry) {
		return defaultPath;
	}

	const wallpaperIsMobile = isMobileWallpaper(currentWallpaper);
	const wallpaperIsDesktop = isDesktopWallpaper(currentWallpaper);

	// Swap to device-appropriate default when orientation doesn't match
	if (isMobile && wallpaperIsDesktop) {
		return DEFAULT_MOBILE_WALLPAPER_PATH;
	}
	if (!isMobile && wallpaperIsMobile) {
		return DEFAULT_WALLPAPER_PATH;
	}

	return null;
}

// Keeps wallpaper in sync with device type (mobile vs desktop).
// Swaps to device-appropriate default on boot, invalid persisted state, or viewport resize.
export function useWallpaperSync() {
	const deviceType = useDeviceType();
	const wallpaper = useSystemStore(selectWallpaper);
	const setWallpaper = useSystemStore((s) => s.setWallpaper);
	const hasInitializedRef = useRef(false);
	const previousDeviceTypeRef = useRef(deviceType);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const shouldUpdate = !hasInitializedRef.current || previousDeviceTypeRef.current !== deviceType;

		if (shouldUpdate) {
			hasInitializedRef.current = true;
			previousDeviceTypeRef.current = deviceType;

			const fallback = getWallpaperFallback(wallpaper, deviceType);
			if (fallback) {
				setWallpaper(fallback);
			}
		}
	}, [deviceType, wallpaper, setWallpaper]);

	return deviceType;
}

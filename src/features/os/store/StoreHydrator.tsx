"use client";


import { useRef } from "react";
import type { HydrationState } from "@/lib/seo";
import { useSystemStore } from "./system-store";

export interface StoreHydratorProps {
	/**
	 * Initial state derived from URL search params.
	 * Passed from the server component.
	 */
	initialState: HydrationState | null;
	children: React.ReactNode;
}

export function StoreHydrator({ initialState, children }: StoreHydratorProps) {
	const isHydrated = useRef(false);

	// Hydrate synchronously during first render (before effects)
	// This ensures the store has the correct state before any component reads it
	if (!isHydrated.current && initialState) {
		// Only hydrate window state if we have windows to show
		// This preserves persisted preferences (wallpaper, dock config)
		if (initialState.windows.length > 0) {
			useSystemStore.setState({
				windows: initialState.windows,
				activeWindowId: initialState.activeWindowId,
				fullscreenWindowId: initialState.fullscreenWindowId,
			});
		}
		isHydrated.current = true;
	}

	return <>{children}</>;
}

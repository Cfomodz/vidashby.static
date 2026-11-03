"use client";

import { useEffect, useRef } from "react";

import {
	type AppID,
	NotificationID,
	PROJECT_APP_IDS,
	selectBootPhase,
	useNotificationHasHydrated,
	useNotificationStore,
	useSystemStore,
} from "@/os/store";

const WELCOME_NOTIFICATION_DELAY = 1500;

const WELCOME_BACK_DELAY = 1200;

const APP_NOTIFICATION_DELAY = 600;

// Triggers notifications for boot events and app exploration
export function useNotificationTriggers(): void {
	const bootPhase = useSystemStore(selectBootPhase);
	const windows = useSystemStore((s) => s.windows);
	const hasHydrated = useNotificationHasHydrated();

	const addNotification = useNotificationStore((s) => s.addNotification);
	const hasSeen = useNotificationStore((s) => s.hasSeen);
	const trackProjectAppOpen = useNotificationStore((s) => s.trackProjectAppOpen);

	// Track if we've already triggered welcome notification this mount
	const welcomeTriggeredRef = useRef(false);

	// Track previously seen window IDs to detect new opens
	const prevWindowIdsRef = useRef<Set<AppID>>(new Set());

	// Welcome notification trigger - fires after boot completes
	useEffect(() => {
		// Wait for store to hydrate before checking seen status
		if (!hasHydrated) return;

		// Only trigger once per mount
		if (welcomeTriggeredRef.current) return;

		// Boot must be complete
		if (bootPhase !== "complete") return;

		// Case 1: First-time visitor - show Welcome after boot
		if (!hasSeen(NotificationID.Welcome)) {
			welcomeTriggeredRef.current = true;

			const timer = setTimeout(() => {
				addNotification(NotificationID.Welcome);
			}, WELCOME_NOTIFICATION_DELAY);

			return () => clearTimeout(timer);
		}

		// Case 2: Returning visitor - show Welcome back
		if (!hasSeen(NotificationID.WelcomeBack)) {
			welcomeTriggeredRef.current = true;

			// Delay slightly after boot to let UI settle
			const timer = setTimeout(() => {
				addNotification(NotificationID.WelcomeBack);
			}, WELCOME_BACK_DELAY);

			return () => clearTimeout(timer);
		}
	}, [bootPhase, hasHydrated, hasSeen, addNotification]);

	// App open trigger
	useEffect(() => {
		// Wait for store to hydrate
		if (!hasHydrated) return;

		// Get current open window IDs
		const currentWindowIds = new Set(windows.filter((w) => w.status === "open").map((w) => w.id));

		// Find newly opened windows
		const newlyOpened: AppID[] = [];
		for (const id of currentWindowIds) {
			if (!prevWindowIdsRef.current.has(id)) {
				newlyOpened.push(id);
			}
		}

		// Update ref for next comparison
		prevWindowIdsRef.current = currentWindowIds;

		// Track any newly opened project apps
		for (const appId of newlyOpened) {
			// Check if this is a project app
			if (PROJECT_APP_IDS.includes(appId as (typeof PROJECT_APP_IDS)[number])) {
				// Delay to let window animation complete
				setTimeout(() => {
					trackProjectAppOpen(appId);
				}, APP_NOTIFICATION_DELAY);
			}
		}
	}, [windows, hasHydrated, trackProjectAppOpen]);
}

// CUSTOMIZE: All values in milliseconds. Adjust to change boot sequence feel.
export const BOOT_TIMING = {
	START_DELAY: 100,
	// CUSTOMIZE: How long the progress bar runs
	BOOT_DURATION: 2500,
	DESKTOP_ENTER_DURATION: 1000,
	REDUCED_MOTION_DELAY: 50,
	FADE_OUT_DURATION: 400,
	UI_STAGGER_DELAY: 200,
	STAGE_FADE_DURATION: 600,
	// CUSTOMIZE: How long the welcome text stays visible
	WELCOME_DISPLAY_DURATION: 2500,
	// Tuned to 800ms so dock/systembar animations settle before About window opens
	ABOUT_LAUNCH_DELAY: 800,
	WELCOME_SUBTEXT_DELAY: 400,
	WELCOME_EXIT_DURATION: 600,
} as const;

// Spring config for welcome text bounce animation
export const WELCOME_SPRING = {
	stiffness: 300,
	damping: 20,
} as const;

// CUSTOMIZE: Entrance animations for the "curtain up" reveal after boot
export const UI_REVEAL = {
	systemBar: {
		duration: 0.5,
		ease: "circOut" as const,
		delay: 0,
	},
	dock: {
		duration: 0.6,
		ease: "backOut" as const,
		delay: 0.1,
	},
	content: {
		duration: 0.4,
		ease: "easeOut" as const,
		delay: 0.3,
		scale: { from: 0.95, to: 1 },
	},
	mobile: {
		duration: 0.3,
		ease: "easeOut" as const,
	},
	// Opens after UI reveal is fully settled
	aboutLaunch: {
		delay: 0.8,
	},
	// Windows fade in after dock/systembar/icons start their animations
	windows: {
		duration: 0.35,
		ease: "easeOut" as const,
		delay: 0.4,
	},
} as const;

// CUSTOMIZE: Change this key if you rename the OS
export const SESSION_BOOT_KEY = "vidashby-os-booted";

// Skip boot animation on same-session page refresh
export function hasBootedThisSession(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return sessionStorage.getItem(SESSION_BOOT_KEY) === "true";
	} catch {
		return false;
	}
}

export function markBootComplete(): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.setItem(SESSION_BOOT_KEY, "true");
	} catch {
		// sessionStorage may be unavailable in private browsing
	}
}

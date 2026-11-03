// Boot sequence: hidden -> booting -> welcome -> complete
export type BootPhase = "hidden" | "booting" | "welcome" | "complete";

// CUSTOMIZE: Add/remove/rename apps here. Each entry needs a matching component in app-registry.
export enum AppID {
	Terminal = "app.terminal",
	About = "app.about",
	Settings = "app.settings",
	Browser = "app.browser",
	FolderProjects = "app.folder.projects",
	FolderCertifications = "app.folder.certifications",
	MarkdownViewer = "app.markdown",
}

// CUSTOMIZE: Dock folder groups for mobile. These are NOT apps, just collapsible containers.
export enum DockStackID {
	Projects = "stack.projects",
}

export type WindowStatus = "open" | "minimized";

export interface WindowPosition {
	x: number;
	y: number;
}

export interface WindowSize {
	width: number;
	height: number;
}

// Props passed through to app components inside windows
export interface WindowProps {
	url?: string;
	title?: string;
	folderId?: string;
	initialTab?: string;
	// Pre-loaded content for SSR — skips client-side fetch when provided
	ssrContent?: string;
}

export interface WindowInstance {
	id: AppID;
	status: WindowStatus;
	position: WindowPosition;
	size: WindowSize;
	props?: WindowProps;
	openedAt: number;
}

// CUSTOMIZE: Add your own launch sources for analytics tracking
export type LaunchMethod =
	| "dock"
	| "desktop_icon"
	| "context_menu"
	| "system"
	| "system_bar"
	| "app";

export interface WindowSpawnConfig {
	position?: WindowPosition;
	size?: WindowSize;
	props?: WindowProps;
	launchMethod?: LaunchMethod;
}

// CUSTOMIZE: Default window dimensions per app (width x height in px)
export const DEFAULT_WINDOW_SIZES: Record<AppID, WindowSize> = {
	[AppID.Terminal]: { width: 780, height: 520 },
	[AppID.About]: { width: 860, height: 600 },
	[AppID.Settings]: { width: 680, height: 480 },
	[AppID.Browser]: { width: 1000, height: 700 },
	[AppID.FolderProjects]: { width: 700, height: 450 },
	[AppID.FolderCertifications]: { width: 700, height: 450 },
	[AppID.MarkdownViewer]: { width: 900, height: 650 },
};

// CUSTOMIZE: Apps that maximize to fill viewport on desktop
export const MAXIMIZED_APPS: Set<AppID> = new Set([AppID.Browser]);

// CUSTOMIZE: Apps that auto-enter fullscreen (hides dock and system bar)
export const AUTO_FULLSCREEN_APPS: Set<AppID> = new Set([]);

// CUSTOMIZE: Apps that fill available space on mobile (with padding)
export const MOBILE_MAXIMIZED_APPS: Set<AppID> = new Set([
	AppID.About,
	AppID.Terminal,
	AppID.Settings,
	AppID.Browser,
]);

// CUSTOMIZE: Apps that go edge-to-edge on mobile (no padding at all)
export const FULL_HEIGHT_MOBILE_APPS: Set<AppID> = new Set([
	AppID.About,
	AppID.Terminal,
	AppID.Settings,
	AppID.Browser,
]);

// "Top" excluded to avoid overlap with system chrome
export type DockPosition = "bottom" | "left" | "right";

// sm=40px, md=50px, lg=64px
export type DockSize = "sm" | "md" | "lg";

export interface DockConfig {
	position: DockPosition;
	size: DockSize;
	magnification: boolean;
}

// CUSTOMIZE: Default dock appearance
export const DEFAULT_DOCK_CONFIG: DockConfig = {
	position: "bottom",
	size: "md",
	magnification: true,
};

export const DOCK_SIZE_MAP: Record<DockSize, number> = {
	sm: 40,
	md: 50,
	lg: 64,
};

// CUSTOMIZE: Shared color palette used by both terminal font and desktop icon settings.
// Each entry is an RGB string for use with rgba()/rgb() in inline styles.
export type ThemeColor =
	| "white"
	| "red"
	| "orange"
	| "amber"
	| "green"
	| "teal"
	| "blue"
	| "purple"
	| "pink"
	| "gray";

export const COLOR_PALETTE: Record<ThemeColor, { label: string; value: string }> = {
	white: { label: "White", value: "255,255,255" },
	red: { label: "Red", value: "239,68,68" },
	orange: { label: "Orange", value: "251,146,60" },
	amber: { label: "Amber", value: "251,191,36" },
	green: { label: "Green", value: "74,222,128" },
	teal: { label: "Teal", value: "45,212,191" },
	blue: { label: "Blue", value: "59,130,246" },
	purple: { label: "Purple", value: "168,85,247" },
	pink: { label: "Pink", value: "244,114,182" },
	gray: { label: "Gray", value: "156,163,175" },
};

// Terminal and Icon colors both draw from the shared palette
export type TerminalFontColor = ThemeColor;
export const TERMINAL_FONT_COLORS = COLOR_PALETTE;

export type IconColor = ThemeColor;
export const ICON_COLORS = COLOR_PALETTE;

export interface SystemState {
	bootPhase: BootPhase;
	// Array order = z-index. Last item is topmost window.
	windows: WindowInstance[];
	activeWindowId: AppID | null;
	// Fullscreen hides dock and system bar
	fullscreenWindowId: AppID | null;
	// CUSTOMIZE: null = default grid/vignette background
	wallpaper: string | null;
	dockConfig: DockConfig;
	terminalFontColor: TerminalFontColor;
	iconColor: IconColor;
	bootTime: number;
	// Increment to remount desktop and replay entrance animations
	desktopRefreshKey: number;
	isAboutModalOpen: boolean;
	isLocked: boolean;
}

export interface SystemActions {
	setBootPhase: (phase: BootPhase) => void;
	launchApp: (appId: AppID, config?: WindowSpawnConfig) => void;
	closeWindow: (id: AppID) => void;
	focusWindow: (id: AppID) => void;
	minimizeWindow: (id: AppID) => void;
	updateWindowPosition: (id: AppID, position: WindowPosition) => void;
	updateWindowSize: (id: AppID, size: WindowSize) => void;
	toggleFullscreen: (id: AppID) => void;
	exitFullscreen: () => void;
	setWallpaper: (path: string | null) => void;
	setDockConfig: (config: Partial<DockConfig>) => void;
	setTerminalFontColor: (color: TerminalFontColor) => void;
	setIconColor: (color: IconColor) => void;
	refreshDesktop: () => void;
	lockSystem: () => void;
	unlockSystem: () => void;
	toggleAboutModal: (isOpen: boolean) => void;
}

export type SystemStore = SystemState & SystemActions;

// --- Notification System ---

// CUSTOMIZE: Add/remove notification triggers. Each ID fires at most once per user lifetime.
export enum NotificationID {
	Welcome = "sys.welcome",
	WelcomeBack = "sys.welcome_back",
	FirstAppOpened = "sys.first_app",
	AllAppsExplored = "sys.all_apps",
	DockConfigChanged = "sys.dock_config",
	WallpaperChanged = "sys.wallpaper",
	TerminalOpened = "sys.terminal_open",
	HiddenFeature = "sys.hidden_feature",
	DeveloperMode = "sys.developer",
}

export interface NotificationContent {
	title: string;
	message?: string;
}

// CUSTOMIZE: Notification copy — this is the "system voice" personality
export const NOTIFICATION_REGISTRY: Record<NotificationID, NotificationContent> = {
	[NotificationID.Welcome]: {
		title: "Welcome to vidashbyOS",
		message: "Explore the desktop. Click around.",
	},
	[NotificationID.WelcomeBack]: {
		title: "Welcome back",
		message: "Right where you left off.",
	},
	[NotificationID.FirstAppOpened]: {
		title: "You're in",
		message: "Explore. Everything is interactive.",
	},
	[NotificationID.AllAppsExplored]: {
		title: "Nice. You found them all.",
		message: "Curiosity noted.",
	},
	[NotificationID.DockConfigChanged]: {
		title: "Everything here is customizable",
		message: "Make it yours.",
	},
	[NotificationID.WallpaperChanged]: {
		title: "Visual preferences updated",
	},
	[NotificationID.TerminalOpened]: {
		title: "Command line active",
		message: "Type 'help' to see available commands.",
	},
	[NotificationID.HiddenFeature]: {
		title: "Hidden feature accessed",
		message: "You found something.",
	},
	[NotificationID.DeveloperMode]: {
		title: "Developer identified",
		message: "Right-click again for browser menu.",
	},
};

export interface NotificationInstance {
	id: NotificationID;
	content: NotificationContent;
	timestamp: number;
}

// CUSTOMIZE: Which apps count toward "explored all" notification
export const PROJECT_APP_IDS = [
	AppID.About,
	AppID.Browser,
	AppID.FolderProjects,
	AppID.FolderCertifications,
] as const;

export interface NotificationState {
	queue: NotificationInstance[];
	current: NotificationInstance | null;
	// Persisted to localStorage to prevent repeat notifications
	seenIds: Set<NotificationID>;
	isProcessing: boolean;
	// Tracks which project apps opened this session (resets on refresh)
	openedProjectApps: Set<AppID>;
}

export interface NotificationActions {
	addNotification: (id: NotificationID) => void;
	dismissCurrent: () => void;
	markAsSeen: (id: NotificationID) => void;
	hasSeen: (id: NotificationID) => boolean;
	processQueue: () => void;
	trackProjectAppOpen: (appId: AppID) => void;
	resetSeen: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

// CUSTOMIZE: Timing between consecutive notifications (ms)
export const NOTIFICATION_QUEUE_DELAY = 800;

// CUSTOMIZE: How long notifications stay visible before auto-dismiss (ms)
export const NOTIFICATION_AUTO_DISMISS = 5500;

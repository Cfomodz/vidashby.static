export interface WallpaperConfig {
	id: string;
	name: string;
	path: string;
	dominantColor: string;
	blurDataURL: string;
}

// Generates a tiny SVG-based blur placeholder from a hex color for next/image
function generateBlurPlaceholder(hexColor: string): string {
	const hex = hexColor.replace("#", "");
	const r = Number.parseInt(hex.substring(0, 2), 16);
	const g = Number.parseInt(hex.substring(2, 4), 16);
	const b = Number.parseInt(hex.substring(4, 6), 16);

	// next/image requires minimum 10x10 for blur placeholders
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect fill="rgb(${r},${g},${b})" width="10" height="10"/></svg>`;
	const base64 = btoa(svg);
	return `data:image/svg+xml;base64,${base64}`;
}

// CUSTOMIZE: Add or remove wallpapers. Place images in /public/assets/wallpapers/.
// dominantColor is used as a loading placeholder — pick the image's most prominent color.
export const WALLPAPERS: WallpaperConfig[] = [
	{
		id: "wall-4",
		name: "Fluid Blue",
		path: "/assets/wallpapers/wall-4.jpg",
		dominantColor: "#0d1b2a",
		blurDataURL: generateBlurPlaceholder("#0d1b2a"),
	},
	{
		id: "wall-1",
		name: "Monterey Dark",
		path: "/assets/wallpapers/wall-1.jpg",
		dominantColor: "#1a1a2e",
		blurDataURL: generateBlurPlaceholder("#1a1a2e"),
	},
	{
		id: "wall-2",
		name: "Sonoma",
		path: "/assets/wallpapers/wall-2.jpg",
		dominantColor: "#2d1f3d",
		blurDataURL: generateBlurPlaceholder("#2d1f3d"),
	},
	{
		id: "unsplash-heart-red",
		name: "Crimson Heart",
		path: "/assets/wallpapers/unsplash-heart-red.jpg",
		dominantColor: "#1a0505",
		blurDataURL: generateBlurPlaceholder("#1a0505"),
	},
	{
		id: "unsplash-swirl-pink",
		name: "Pink Swirl",
		path: "/assets/wallpapers/unsplash-swirl-pink.jpg",
		dominantColor: "#1a0a1e",
		blurDataURL: generateBlurPlaceholder("#1a0a1e"),
	},
	{
		id: "unsplash-heart-blue",
		name: "Azure Heart",
		path: "/assets/wallpapers/unsplash-heart-blue.jpg",
		dominantColor: "#050a1a",
		blurDataURL: generateBlurPlaceholder("#050a1a"),
	},
	{
		id: "unsplash-fish",
		name: "Deep Sea",
		path: "/assets/wallpapers/unsplash-fish.jpg",
		dominantColor: "#0a1520",
		blurDataURL: generateBlurPlaceholder("#0a1520"),
	},
	{
		id: "unsplash-wavy",
		name: "Dark Waves",
		path: "/assets/wallpapers/unsplash-wavy.jpg",
		dominantColor: "#0a0a10",
		blurDataURL: generateBlurPlaceholder("#0a0a10"),
	},
	{
		id: "unsplash-abstract-blue",
		name: "Ocean Flow",
		path: "/assets/wallpapers/unsplash-abstract-blue.jpg",
		dominantColor: "#0a1530",
		blurDataURL: generateBlurPlaceholder("#0a1530"),
	},
];

// CUSTOMIZE: Set your default wallpaper path here
export const DEFAULT_WALLPAPER_PATH = "/assets/wallpapers/wall-4.jpg";

// O(1) lookup map for wallpaper configs by path
export const WALLPAPER_MAP: Map<string, WallpaperConfig> = new Map(
	WALLPAPERS.map((w) => [w.path, w]),
);

export function getWallpaperConfig(path: string): WallpaperConfig | undefined {
	return WALLPAPER_MAP.get(path);
}

// Mobile uses the same wallpapers as desktop
export const MOBILE_WALLPAPERS: WallpaperConfig[] = WALLPAPERS;

export const DEFAULT_MOBILE_WALLPAPER_PATH = DEFAULT_WALLPAPER_PATH;

export const MOBILE_WALLPAPER_MAP: Map<string, WallpaperConfig> = new Map(
	MOBILE_WALLPAPERS.map((w) => [w.path, w]),
);

export function getMobileWallpaperConfig(path: string): WallpaperConfig | undefined {
	return MOBILE_WALLPAPER_MAP.get(path);
}

export function isMobileWallpaper(path: string): boolean {
	return path.startsWith("/assets/mobile-wallpapers/");
}

export function isDesktopWallpaper(path: string): boolean {
	return path.startsWith("/assets/wallpapers/");
}

export function getAnyWallpaperConfig(path: string): WallpaperConfig | undefined {
	return MOBILE_WALLPAPER_MAP.get(path) ?? WALLPAPER_MAP.get(path);
}

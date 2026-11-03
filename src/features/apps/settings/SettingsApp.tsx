"use client";

import { ChevronLeft } from "lucide-react";
import { memo, useState } from "react";

import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import type { AppComponentProps } from "@/os/window/app-registry";

import { AboutPanel } from "./panels/AboutPanel";
import { DockPanel } from "./panels/DockPanel";
import { IconPanel } from "./panels/IconPanel";
import { TerminalPanel } from "./panels/TerminalPanel";
import { WallpaperPanel } from "./panels/WallpaperPanel";
import { type SettingsPanelId, SettingsSidebar } from "./SettingsSidebar";

export interface SettingsAppProps extends AppComponentProps {}

type MobileViewState = "menu" | "panel";

const PANEL_TITLES: Record<SettingsPanelId, string> = {
	about: "About",
	wallpaper: "Wallpaper",
	dock: "Dock",
	icons: "Icons",
	terminal: "Terminal",
};

/** Valid panel IDs for type guard */
const VALID_PANELS: SettingsPanelId[] = ["about", "wallpaper", "dock", "icons", "terminal"];

/** Type guard to validate initialTab value */
function isValidPanel(value: unknown): value is SettingsPanelId {
	return typeof value === "string" && VALID_PANELS.includes(value as SettingsPanelId);
}

export const SettingsApp = memo(function SettingsApp({ windowProps }: SettingsAppProps) {
	// Resolve initial panel from deep-link prop or default to "about"
	const initialPanel = isValidPanel(windowProps?.initialTab) ? windowProps.initialTab : "about";
	const hasDeepLink = isValidPanel(windowProps?.initialTab);

	const [activePanel, setActivePanel] = useState<SettingsPanelId>(initialPanel);
	// On mobile, start in panel view if deep-linked, otherwise show menu
	const [mobileViewState, setMobileViewState] = useState<MobileViewState>(
		hasDeepLink ? "panel" : "menu",
	);
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	const handleNavigate = (panel: SettingsPanelId) => {
		setActivePanel(panel);
		if (isMobile) {
			setMobileViewState("panel");
		}
	};

	const handleBackToMenu = () => {
		setMobileViewState("menu");
	};

	const renderPanelContent = () => (
		<>
			{activePanel === "about" && <AboutPanel />}
			{activePanel === "wallpaper" && <WallpaperPanel />}
			{activePanel === "dock" && <DockPanel />}
			{activePanel === "icons" && <IconPanel />}
			{activePanel === "terminal" && <TerminalPanel />}
		</>
	);

	if (isMobile) {
		return (
			<div className="flex h-full flex-col">
				{mobileViewState === "menu" ? (
					<SettingsSidebar activePanel={activePanel} onNavigate={handleNavigate} />
				) : (
					<>
						<header className="flex h-12 shrink-0 items-center border-b border-white/10">
							<div className="flex w-28 shrink-0 items-center">
								<button
									type="button"
									onClick={handleBackToMenu}
									className="flex items-center gap-0.5 rounded-lg px-2 py-2 text-[15px] text-white/60 transition-colors active:bg-white/10"
									aria-label="Back to settings menu"
								>
									<ChevronLeft className="size-5" aria-hidden="true" />
									<span>Settings</span>
								</button>
							</div>
							<span className="flex-1 text-center text-[15px] font-semibold text-white">
								{PANEL_TITLES[activePanel]}
							</span>
							<div className="w-28 shrink-0" />
						</header>
						<main className="flex-1 overflow-y-auto px-4 py-6">{renderPanelContent()}</main>
					</>
				)}
			</div>
		);
	}

	return (
		<div className="flex h-full">
			<SettingsSidebar activePanel={activePanel} onNavigate={handleNavigate} />
			<main className="flex-1 overflow-y-auto p-6">{renderPanelContent()}</main>
		</div>
	);
});

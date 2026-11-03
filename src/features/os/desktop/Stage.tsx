"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Fragment, memo, useCallback, useEffect, useRef, useState } from "react";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { BOOT_TIMING, UI_REVEAL } from "@/os/boot";
import { NotificationLayer, useNotificationTriggers } from "@/os/notification";
import {
	selectBootPhase,
	selectDesktopRefreshKey,
	selectWallpaper,
	useSystemStore,
} from "@/os/store";
import { useReducedMotion, WindowManager } from "@/os/window";

import { AboutSystemModal } from "./AboutSystemModal";
import { DesktopContextMenu } from "./DesktopContextMenu";
import { DesktopIcon } from "./DesktopIcon";
import { Dock } from "./dock";
import { GridPattern } from "./GridPattern";
import { LockScreen } from "./LockScreen";
import { SelectionBox } from "./SelectionBox";
import { useDesktop } from "./useDesktop";
import { useSelectionBox } from "./useSelectionBox";
import { useWallpaperSync } from "./useWallpaperSync";
import { Vignette } from "./Vignette";
import { getAnyWallpaperConfig } from "./wallpapers";

export interface StageProps {
	children?: React.ReactNode;
}

// Main desktop environment. Layers from bottom to top: wallpaper, grid, vignette,
// desktop icons, windows, system bar, dock, overlays.
// Boot sequence: invisible during boot, fades in at 'welcome', UI appears at 'complete'.
export const Stage = memo(function Stage({ children }: StageProps) {
	const stageRef = useRef<HTMLDivElement>(null);
	const wallpaper = useSystemStore(selectWallpaper);
	const wallpaperConfig = wallpaper ? getAnyWallpaperConfig(wallpaper) : undefined;

	useWallpaperSync();
	useNotificationTriggers();

	const bootPhase = useSystemStore(selectBootPhase);
	const desktopRefreshKey = useSystemStore(selectDesktopRefreshKey);
	const prefersReducedMotion = useReducedMotion();
	const { isSelecting, selectionBox, handlePointerDown, handlePointerMove, handlePointerUp } =
		useSelectionBox(stageRef);
	const {
		items,
		selectedItemIds,
		selectItem,
		clearSelection,
		registerIconRef,
		updateSelectionFromBox,
	} = useDesktop();

	const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; isIconTarget: boolean }>({
		isOpen: false,
		x: 0,
		y: 0,
		isIconTarget: false,
	});
	// When true, next right-click shows browser's native context menu
	const [allowBrowserMenu, setAllowBrowserMenu] = useState(false);

	const isDesktopVisible = bootPhase === "welcome" || bootPhase === "complete";
	// During 'welcome' phase only wallpaper is visible for a clean entrance
	const isUIVisible = bootPhase === "complete";


	const stageFadeDuration = prefersReducedMotion
		? BOOT_TIMING.REDUCED_MOTION_DELAY / 1000
		: BOOT_TIMING.STAGE_FADE_DURATION / 1000;

	const contentAnimation = prefersReducedMotion
		? { duration: 0.05, ease: "linear" as const, delay: 0 }
		: UI_REVEAL.content;

	const handleStagePointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement;
			if (!target.closest("[data-desktop-icon]")) {
				clearSelection();
			}
			handlePointerDown(e);
		},
		[clearSelection, handlePointerDown],
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent<HTMLDivElement>) => {
			if (allowBrowserMenu) {
				setAllowBrowserMenu(false);
				return;
			}

			const target = e.target as HTMLElement;
			const iconElement = target.closest("[data-desktop-icon]") || target.closest("[data-dock-icon]");

			if (iconElement) {
				e.preventDefault();
				setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isIconTarget: true });
				return;
			}

			const isOnBackground =
				target === stageRef.current ||
				target.closest("[data-desktop-background]") ||
				target.tagName === "IMG";

			if (isOnBackground) {
				e.preventDefault();
				setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isIconTarget: false });
				trackEvent(AnalyticsEvent.CONTEXT_MENU_OPENED, {
					trigger_location: "desktop",
				});
			}
		},
		[allowBrowserMenu],
	);

	const closeContextMenu = useCallback(() => {
		setContextMenu((prev) => ({ ...prev, isOpen: false }));
	}, []);

	const requestBrowserMenu = useCallback(() => {
		setAllowBrowserMenu(true);
	}, []);

	useEffect(() => {
		if (isSelecting && selectionBox && stageRef.current) {
			const containerRect = stageRef.current.getBoundingClientRect();
			updateSelectionFromBox(selectionBox, containerRect);
		}
	}, [isSelecting, selectionBox, updateSelectionFromBox]);

	return (
					<motion.div
						ref={stageRef}
						className="relative h-screen w-screen select-none overflow-hidden bg-background"
						initial={{ opacity: 0 }}
						animate={{ opacity: isDesktopVisible ? 1 : 0 }}
						transition={{ duration: stageFadeDuration, ease: "easeOut" }}
						onPointerDown={handleStagePointerDown}
						onPointerMove={handlePointerMove}
						onPointerUp={handlePointerUp}
						onPointerCancel={handlePointerUp}
						onContextMenu={handleContextMenu}
					>
						{wallpaper ? (
							<Image
								src={wallpaper}
								alt=""
								fill
								priority
								fetchPriority="high"
								quality={85}
								sizes="100vw"
								className="pointer-events-none object-cover"
								aria-hidden="true"
								placeholder={wallpaperConfig?.blurDataURL ? "blur" : "empty"}
								blurDataURL={wallpaperConfig?.blurDataURL}
							/>
						) : (
							<GridPattern />
						)}
						<Vignette />

						{/* Keyed by desktopRefreshKey — changing key replays all entrance animations */}
						<Fragment key={desktopRefreshKey}>
							{isUIVisible && (
								<motion.section
									className="pointer-events-none absolute inset-0 pt-4 pr-4"
									aria-label="Desktop"
									style={{
										zIndex: 1,
									}}
									initial={{
										opacity: 0,
										scale:
											contentAnimation === UI_REVEAL.content ? UI_REVEAL.content.scale.from : 1,
									}}
									animate={{ opacity: 1, scale: 1 }}
									transition={{
										duration: contentAnimation.duration,
										ease: contentAnimation.ease,
										delay: contentAnimation.delay,
									}}
								>
									<div className="ml-auto flex flex-col items-end gap-2">
										{items.map((item) => (
											<DesktopIcon
												key={item.id}
												appId={item.appId}
												label={item.label}
												iconType={item.iconType}
												folderId={item.folderId}
												contentUrl={item.contentUrl}
												title={item.title}
												isSelected={selectedItemIds.has(item.id)}
												onSelect={() => selectItem(item.id)}
												onExecute={clearSelection}
												onRegisterRef={(el) => registerIconRef(item.id, el)}
											/>
										))}
									</div>
								</motion.section>
							)}

							{isUIVisible && isSelecting && selectionBox && <SelectionBox box={selectionBox} />}

							{isUIVisible && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{
										duration: UI_REVEAL.windows.duration,
										ease: UI_REVEAL.windows.ease,
										delay: UI_REVEAL.windows.delay,
									}}
								>
									<WindowManager />
								</motion.div>
							)}

							<Dock
								isBooting={!isUIVisible}
							/>

							{isUIVisible && <NotificationLayer />}
						</Fragment>

						<DesktopContextMenu
							isOpen={contextMenu.isOpen}
							position={{ x: contextMenu.x, y: contextMenu.y }}
							isIconTarget={contextMenu.isIconTarget}
							onClose={closeContextMenu}
							onRequestBrowserMenu={requestBrowserMenu}
						/>

						<AboutSystemModal />
						<LockScreen />

						{children && <div className="relative z-10 h-full w-full">{children}</div>}
					</motion.div>
	);
});

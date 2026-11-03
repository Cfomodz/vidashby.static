"use client";

import clsx from "clsx";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { memo, useCallback, useRef, useState } from "react";

import { UI_REVEAL } from "@/os/boot";
import {
	DEFAULT_DOCK_CONFIG,
	DOCK_SIZE_MAP,
	type DockStackID,
	selectDockConfig,
	selectIsAnyWindowFullscreen,
	useHasHydrated,
	useSystemStore,
} from "@/os/store";
import { useReducedMotion } from "@/os/window";

import { DockIcon } from "./DockIcon";
import { DockStack } from "./DockStack";
import { DockStackIcon } from "./DockStackIcon";
import { DOCK_ITEMS, type DockStackItem, isDockStackItem, MOBILE_DOCK_ITEMS } from "./dock-config";
import { useDeviceType } from "./useDeviceType";

export interface DockProps {
	isBooting?: boolean;
}

function handleDockKeyNavigation(
	key: string,
	currentIndex: number,
	itemCount: number,
): number | null {
	switch (key) {
		case "ArrowRight":
		case "ArrowDown":
			return (currentIndex + 1) % itemCount;
		case "ArrowLeft":
		case "ArrowUp":
			return (currentIndex - 1 + itemCount) % itemCount;
		case "Home":
			return 0;
		case "End":
			return itemCount - 1;
		default:
			return null;
	}
}

function getPlatformAnchorClass(position: "bottom" | "left" | "right"): string {
	if (position === "left") return "left-0";
	if (position === "right") return "right-0";
	return "";
}

// Centering transforms handled by Framer Motion to avoid CSS/motion transform conflicts
const POSITION_CLASSES = {
	bottom: "bottom-3 left-1/2",
	left: "left-3 top-1/2",
	right: "right-3 top-1/2",
} as const;

// Slide-in/out variants per dock position. Opacity not animated to prevent backdrop-blur glitching.
const getAnimationVariants = (position: "bottom" | "left" | "right", shouldHide: boolean) => {
	const hiddenOffset = 120;

	switch (position) {
		case "left":
			return {
				initial: { x: -hiddenOffset, y: "-50%" },
				animate: { x: shouldHide ? -hiddenOffset : 0, y: "-50%" },
				exit: { x: -hiddenOffset, y: "-50%" },
			};
		case "right":
			return {
				initial: { x: hiddenOffset, y: "-50%" },
				animate: { x: shouldHide ? hiddenOffset : 0, y: "-50%" },
				exit: { x: hiddenOffset, y: "-50%" },
			};
		default:
			return {
				initial: { x: "-50%", y: hiddenOffset },
				animate: { x: "-50%", y: shouldHide ? hiddenOffset : 0 },
				exit: { x: "-50%", y: hiddenOffset },
			};
	}
};

// macOS-style dock with magnification on hover (desktop) or compact pill nav (mobile).
// Position, size, and magnification are persisted in user preferences.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Dock handles multiple interaction modes
export const Dock = memo(function Dock({
	isBooting = false,
}: DockProps) {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";
	const isFullscreen = useSystemStore(selectIsAnyWindowFullscreen);
	const hasHydrated = useHasHydrated();
	const prefersReducedMotion = useReducedMotion();

	const storedConfig = useSystemStore(selectDockConfig);
	const dockConfig = hasHydrated ? storedConfig : DEFAULT_DOCK_CONFIG;

	const { position, size, magnification } = dockConfig;
	const isVertical = position === "left" || position === "right";
	const baseSize = DOCK_SIZE_MAP[size];

	const dockRef = useRef<HTMLElement>(null);
	const mousePosition = useMotionValue(Infinity);
	// Suspend tracking during bounce animation to prevent magnification sticking
	const isTrackingSuspended = useRef(false);

	const [focusedIndex, setFocusedIndex] = useState<number>(-1);
	const [openStackId, setOpenStackId] = useState<DockStackID | null>(null);
	const stackAnchorRef = useRef<HTMLButtonElement | null>(null);

	const dockItems = isMobile ? MOBILE_DOCK_ITEMS : DOCK_ITEMS;

	const openStack = openStackId
		? (dockItems.find((item) => isDockStackItem(item) && item.id === openStackId) as
				| DockStackItem
				| undefined)
		: null;

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (isMobile || !magnification || isTrackingSuspended.current) return;
			mousePosition.set(isVertical ? e.clientY : e.clientX);
		},
		[isMobile, magnification, isVertical, mousePosition],
	);

	const handleMouseLeave = useCallback(() => {
		mousePosition.set(Infinity);
		setFocusedIndex(-1);
	}, [mousePosition]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape" && openStackId) {
				e.preventDefault();
				setOpenStackId(null);
				return;
			}

			const newIndex = handleDockKeyNavigation(e.key, focusedIndex, dockItems.length);
			if (newIndex !== null) {
				e.preventDefault();
				setFocusedIndex(newIndex);
			}
		},
		[dockItems.length, focusedIndex, openStackId],
	);

	const handleStackToggle = useCallback((stackId: DockStackID) => {
		setOpenStackId((current) => (current === stackId ? null : stackId));
	}, []);

	const handleStackClose = useCallback(() => {
		setOpenStackId(null);
	}, []);

	const handleIconFocus = useCallback((index: number) => {
		setFocusedIndex(index);
	}, []);

	const handleIconClick = useCallback(() => {
		setFocusedIndex(-1);
		mousePosition.set(Infinity);
		isTrackingSuspended.current = true;
		// Resume after bounce animation completes
		setTimeout(() => {
			isTrackingSuspended.current = false;
		}, 500);
	}, [mousePosition]);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		e.stopPropagation();
	}, []);

	const handlePointerUp = useCallback(() => {
		mousePosition.set(Infinity);
	}, [mousePosition]);

	const gap = isMobile ? 8 : 12;
	const padding = isMobile ? 8 : 12;
	const magnifyScale = 1.54; // Must match DockIcon's MAGNIFY_SCALE
	const maxIconSize = Math.round(baseSize * magnifyScale);
	const platformThickness = baseSize + padding * 2;

	const shouldHide = isBooting || isFullscreen;

	const animationConfig = prefersReducedMotion
		? { duration: 0.05, ease: "linear" as const, delay: 0 }
		: isMobile
			? { ...UI_REVEAL.mobile, delay: 0 }
			: UI_REVEAL.dock;

	const { initial, animate, exit } = getAnimationVariants(position, shouldHide);

	return (
		<>
			<AnimatePresence mode="wait">
				<motion.nav
					key={position}
					ref={dockRef}
					role="navigation"
					aria-label="Application dock"
					className={clsx(
						"fixed z-50",
						POSITION_CLASSES[position],
					)}
					initial={initial}
					animate={animate}
					exit={exit}
					transition={{
						duration: animationConfig.duration,
						ease: animationConfig.ease,
						delay: shouldHide ? 0 : animationConfig.delay,
					}}
					onPointerDown={handlePointerDown}
					aria-hidden={shouldHide}
				>
					<div
						role="toolbar"
						aria-label="Application shortcuts"
						className="relative"
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}
						onPointerUp={handlePointerUp}
						onKeyDown={handleKeyDown}
					>
						{/* Frosted glass platform — fixed thickness, icons grow outward */}
						<div
							className={clsx(
								"absolute rounded-2xl",
								isVertical ? "inset-y-0" : "inset-x-0 bottom-0",
								getPlatformAnchorClass(position),
							)}
							style={{
								...(isVertical ? { width: platformThickness } : { height: platformThickness }),
								background: "rgba(50, 50, 50, 0.65)",
								backdropFilter: "blur(20px)",
								WebkitBackdropFilter: "blur(20px)",
								boxShadow: `
							0 0 0 0.5px rgba(255, 255, 255, 0.15),
							0 8px 40px rgba(0, 0, 0, 0.55),
							inset 0 0.5px 0 rgba(255, 255, 255, 0.1)
						`,
							}}
						/>

						<div
							className={clsx(
								"relative flex",
								isVertical ? "flex-col" : "flex-row",
								position === "left" ? "items-start" : "items-end",
							)}
							style={{
								gap: `${gap}px`,
								padding: `${padding}px`,
								...(isVertical &&
									magnification && {
										width: maxIconSize + padding * 2,
									}),
							}}
						>
							{dockItems.map((item, index) =>
								isDockStackItem(item) ? (
									<DockStackIcon
										key={item.id}
										stack={item}
										isOpen={openStackId === item.id}
										onToggle={handleStackToggle}
										mousePosition={mousePosition}
										magnify={!isMobile && magnification}
										baseSize={baseSize}
										dockPosition={position}
										isFocused={focusedIndex === index}
										onFocus={() => handleIconFocus(index)}
										onClick={handleIconClick}
										setAnchorRef={(el) => {
											if (el) stackAnchorRef.current = el;
										}}
									/>
								) : (
									<DockIcon
										key={item.id}
										appId={item.id}
										label={item.label}
										icon={item.icon}
										iconSrc={item.iconSrc}
										gradient={item.gradient}
										backgroundColor={item.backgroundColor}
										iconPadding={item.iconPadding}
										mousePosition={mousePosition}
										magnify={!isMobile && magnification}
										baseSize={baseSize}
										dockPosition={position}
										isFocused={focusedIndex === index}
										onFocus={() => handleIconFocus(index)}
										onClick={handleIconClick}
									/>
								),
							)}
						</div>
					</div>
				</motion.nav>
			</AnimatePresence>

			{/* Rendered outside nav to avoid transform containment from breaking positioning */}
			{openStack && (
				<DockStack
					stack={openStack}
					isOpen={openStackId !== null}
					onClose={handleStackClose}
					anchorRef={stackAnchorRef}
				/>
			)}
		</>
	);
});

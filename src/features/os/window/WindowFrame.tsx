"use client";

import { animate, motion, type PanInfo, useDragControls, useMotionValue } from "framer-motion";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { useDeviceType } from "@/os/desktop/dock/useDeviceType";
import {
	FULL_HEIGHT_MOBILE_APPS,
	MOBILE_MAXIMIZED_APPS,
	selectIsWindowActive,
	selectIsWindowFullscreen,
	useSystemStore,
	type WindowInstance,
} from "@/os/store";

import { WindowControls } from "./WindowControls";

export interface WindowFrameProps {
	window: WindowInstance;
	title: string;
	children: React.ReactNode;
	reducedMotion?: boolean;
}

const MOBILE_PADDING = 8;
const DESKTOP_PADDING = 16;
const SYSTEM_BAR_HEIGHT_MOBILE = 0;
const SYSTEM_BAR_HEIGHT_DESKTOP = 0;
const DOCK_HEIGHT = 80;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: WindowFrame manages drag, resize, and fullscreen states
export const WindowFrame = memo(function WindowFrame({
	window,
	title,
	children,
	reducedMotion = false,
}: WindowFrameProps) {
	const { id, position, size } = window;

	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	const isActive = useSystemStore(selectIsWindowActive(id));
	const isFullscreen = useSystemStore(selectIsWindowFullscreen(id));
	const focusWindow = useSystemStore((s) => s.focusWindow);
	const updateWindowPosition = useSystemStore((s) => s.updateWindowPosition);
	const updateWindowSize = useSystemStore((s) => s.updateWindowSize);
	// Distinguish minimize (still in store) from close (removed) for exit animation
	const isBeingMinimized = useSystemStore((s) =>
		s.windows.some((w) => w.id === id && w.status === "minimized"),
	);

	const constraintsRef = useRef<HTMLDivElement>(null);
	const dragControls = useDragControls();

	const [viewport, setViewport] = useState({ width: 375, height: 667 });

	useEffect(() => {
		const updateViewport = () => {
			setViewport({
				width: globalThis.window.innerWidth,
				height: globalThis.window.innerHeight,
			});
		};

		updateViewport();

		globalThis.window.addEventListener("resize", updateViewport);
		return () => globalThis.window.removeEventListener("resize", updateViewport);
	}, []);

	const isFullHeightMobile = isMobile && FULL_HEIGHT_MOBILE_APPS.has(id);

	const responsiveLayout = (() => {
		if (isFullscreen) {
			return {
				width: viewport.width,
				height: viewport.height,
				x: 0,
				y: 0,
			};
		}

		if (!isMobile) {
			return {
				width: size.width,
				height: size.height,
				x: position.x,
				y: position.y,
			};
		}

		if (isFullHeightMobile) {
			return {
				width: viewport.width,
				height: viewport.height - SYSTEM_BAR_HEIGHT_MOBILE - DOCK_HEIGHT,
				x: 0,
				y: SYSTEM_BAR_HEIGHT_MOBILE,
			};
		}

		const maxWidth = viewport.width - MOBILE_PADDING * 2;
		const maxHeight = viewport.height - SYSTEM_BAR_HEIGHT_MOBILE - DOCK_HEIGHT - MOBILE_PADDING * 2;

		const shouldMaximize = MOBILE_MAXIMIZED_APPS.has(id);
		const constrainedWidth = shouldMaximize ? maxWidth : Math.min(size.width, maxWidth);
		const constrainedHeight = shouldMaximize ? maxHeight : Math.min(size.height, maxHeight);

		const centeredX = (viewport.width - constrainedWidth) / 2;
		const centeredY = SYSTEM_BAR_HEIGHT_MOBILE + MOBILE_PADDING;

		return {
			width: constrainedWidth,
			height: constrainedHeight,
			x: centeredX,
			y: centeredY,
		};
	})();

	const x = useMotionValue(position.x);
	const y = useMotionValue(position.y);

	useEffect(() => {
		x.set(responsiveLayout.x);
		y.set(responsiveLayout.y);
	}, [responsiveLayout.x, responsiveLayout.y, x, y]);

	const handleFocus = useCallback(
		(e: React.PointerEvent) => {
			e.stopPropagation();

			if (!isActive) {
				focusWindow(id);
			}
		},
		[focusWindow, id, isActive],
	);

	const handleDragEnd = useCallback(
		(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
			const newX = position.x + info.offset.x;
			const newY = position.y + info.offset.y;

			const padding = isMobile ? MOBILE_PADDING : DESKTOP_PADDING;
			const topBound = isMobile
				? SYSTEM_BAR_HEIGHT_MOBILE
				: SYSTEM_BAR_HEIGHT_DESKTOP + padding / 2;
			const bottomBound = isMobile ? DOCK_HEIGHT : padding;

			const minX = padding;
			const maxX = viewport.width - responsiveLayout.width - padding;
			const minY = topBound;
			const maxY = viewport.height - responsiveLayout.height - bottomBound;

			updateWindowPosition(id, {
				x: Math.max(minX, Math.min(maxX, newX)),
				y: Math.max(minY, Math.min(maxY, newY)),
			});
		},
		[id, position.x, position.y, updateWindowPosition, viewport, responsiveLayout, isMobile],
	);

	const handleHeaderPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if ((e.target as HTMLElement).closest("fieldset")) {
				return;
			}
			dragControls.start(e);
		},
		[dragControls],
	);

	// Double-click header to snap window to center
	const handleHeaderDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).closest("fieldset")) {
				return;
			}

			const topOffset = isMobile ? SYSTEM_BAR_HEIGHT_MOBILE : SYSTEM_BAR_HEIGHT_DESKTOP;
			const bottomOffset = isMobile ? DOCK_HEIGHT : DESKTOP_PADDING;
			const availableHeight = viewport.height - topOffset - bottomOffset;

			const centeredX = (viewport.width - responsiveLayout.width) / 2;
			const centeredY = topOffset + (availableHeight - responsiveLayout.height) / 2;

			const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };
			animate(x, centeredX, springConfig);
			animate(y, centeredY, springConfig);

			updateWindowPosition(id, { x: centeredX, y: centeredY });
		},
		[
			id,
			viewport,
			responsiveLayout.width,
			responsiveLayout.height,
			isMobile,
			updateWindowPosition,
			x,
			y,
		],
	);

	// Drag edges/corners to resize
	const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number; startPosX: number; startPosY: number; edges: string } | null>(null);

	const handleResizePointerDown = useCallback(
		(edges: string) => (e: React.PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();
			const el = e.currentTarget as HTMLElement;
			el.setPointerCapture(e.pointerId);
			resizeStartRef.current = {
				startX: e.clientX,
				startY: e.clientY,
				startW: responsiveLayout.width,
				startH: responsiveLayout.height,
				startPosX: position.x,
				startPosY: position.y,
				edges,
			};

			const handleMove = (ev: PointerEvent) => {
				const ref = resizeStartRef.current;
				if (!ref) return;
				const dx = ev.clientX - ref.startX;
				const dy = ev.clientY - ref.startY;
				let newW = ref.startW;
				let newH = ref.startH;
				let newX = ref.startPosX;
				let newY = ref.startPosY;

				if (ref.edges.includes("e")) newW = Math.max(300, ref.startW + dx);
				if (ref.edges.includes("s")) newH = Math.max(200, ref.startH + dy);
				if (ref.edges.includes("w")) {
					newW = Math.max(300, ref.startW - dx);
					newX = ref.startPosX + (ref.startW - newW);
				}
				if (ref.edges.includes("n")) {
					newH = Math.max(200, ref.startH - dy);
					newY = ref.startPosY + (ref.startH - newH);
				}

				updateWindowSize(id, { width: newW, height: newH });
				updateWindowPosition(id, { x: newX, y: newY });
				x.set(newX);
				y.set(newY);
			};

			const handleUp = () => {
				resizeStartRef.current = null;
				globalThis.window.removeEventListener("pointermove", handleMove);
				globalThis.window.removeEventListener("pointerup", handleUp);
			};

			globalThis.window.addEventListener("pointermove", handleMove);
			globalThis.window.addEventListener("pointerup", handleUp);
		},
		[id, responsiveLayout.width, responsiveLayout.height, position.x, position.y, updateWindowSize, updateWindowPosition, x, y],
	);

	// Avoid animating opacity with backdrop-blur — causes a visual flash
	const minimizeExit = {
		scale: 0.2,
		opacity: 0,
		y: viewport.height - DOCK_HEIGHT / 2,
		transition: {
			scale: { duration: 0.4, ease: "anticipate" as const },
			y: { duration: 0.4, ease: "anticipate" as const },
			opacity: { duration: 0.25, ease: "easeOut" as const },
		},
	};
	const closeExit = {
		opacity: 0,
		scale: 0.96,
		transition: { duration: 0.15, ease: "easeOut" as const },
	};
	const variants = {
		initial: reducedMotion ? {} : { scale: 0.96 },
		animate: reducedMotion ? {} : { scale: 1 },
		exit: reducedMotion ? {} : isBeingMinimized ? minimizeExit : closeExit,
	};

	const dragConstraintStyle = isMobile
		? {
				top: SYSTEM_BAR_HEIGHT_MOBILE,
				left: MOBILE_PADDING,
				right: MOBILE_PADDING,
				bottom: DOCK_HEIGHT,
			}
		: {
				top: SYSTEM_BAR_HEIGHT_DESKTOP + DESKTOP_PADDING / 2,
				left: DESKTOP_PADDING,
				right: DESKTOP_PADDING,
				bottom: DESKTOP_PADDING,
			};

	return (
		<>
			<div ref={constraintsRef} className="pointer-events-none fixed" style={dragConstraintStyle} />

			<motion.div
				role="dialog"
				aria-label={`${title} window`}
				aria-modal="false"
				tabIndex={-1}
				className="fixed select-none touch-none"
				style={{
					x,
					y,
					width: responsiveLayout.width,
					height: responsiveLayout.height,
					zIndex: isFullscreen
						? 100
						: isActive
							? 50
							: 10,
				}}
				drag={!isFullscreen && !isFullHeightMobile}
				dragControls={dragControls}
				dragListener={false}
				dragConstraints={constraintsRef}
				dragElastic={0}
				dragMomentum={false}
				onDragEnd={handleDragEnd}
				initial="initial"
				animate="animate"
				exit="exit"
				variants={variants}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 30,
				}}
				onPointerDown={handleFocus}
				onContextMenu={(e) => e.preventDefault()}
			>
				{/* Glassmorphism window chrome */}
				<div
					className={`
						flex h-full flex-col overflow-hidden
						border bg-black/60 backdrop-blur-xl
						transition-[border-color,box-shadow,border-radius] duration-200
						${isFullscreen ? "rounded-none border-transparent" : ""}
						${!isFullscreen && isFullHeightMobile ? "rounded-t-xl rounded-b-none border-x-0 border-b-0 shadow-none" : ""}
						${!isFullscreen && !isFullHeightMobile ? "rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]" : ""}
						${!isFullscreen && isActive ? "border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.1)]" : ""}
						${!isFullscreen && !isActive ? "border-white/10" : ""}
						${isFullHeightMobile ? "border-t-white/10" : ""}
					`}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Window chrome header with drag + double-click interactions */}
					<header
						className="flex h-11 shrink-0 items-center gap-3 border-b border-white/5 px-4 cursor-default"
						onPointerDown={isFullscreen || isFullHeightMobile ? undefined : handleHeaderPointerDown}
						onDoubleClick={isFullscreen || isFullHeightMobile ? undefined : handleHeaderDoubleClick}
						style={{
							touchAction: "none",
						}}
					>
						<WindowControls windowId={id} />

						<h2 className="flex-1 truncate text-center font-mono text-xs text-white/50">{title}</h2>

						{/* Spacer to keep title centered against the controls */}
						<div className="w-[52px]" aria-hidden="true" />
					</header>

					<article className="flex-1 overflow-auto">{children}</article>
				</div>

				{/* Resize handles — desktop only, hidden in fullscreen */}
				{!isFullscreen && !isMobile && (
					<>
						<div className="absolute -top-1 left-2 right-2 h-2 cursor-n-resize" onPointerDown={handleResizePointerDown("n")} />
						<div className="absolute -bottom-1 left-2 right-2 h-2 cursor-s-resize" onPointerDown={handleResizePointerDown("s")} />
						<div className="absolute -left-1 top-2 bottom-2 w-2 cursor-w-resize" onPointerDown={handleResizePointerDown("w")} />
						<div className="absolute -right-1 top-2 bottom-2 w-2 cursor-e-resize" onPointerDown={handleResizePointerDown("e")} />
						<div className="absolute -top-1 -left-1 h-3 w-3 cursor-nw-resize" onPointerDown={handleResizePointerDown("nw")} />
						<div className="absolute -top-1 -right-1 h-3 w-3 cursor-ne-resize" onPointerDown={handleResizePointerDown("ne")} />
						<div className="absolute -bottom-1 -left-1 h-3 w-3 cursor-sw-resize" onPointerDown={handleResizePointerDown("sw")} />
						<div className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize" onPointerDown={handleResizePointerDown("se")} />
					</>
				)}
			</motion.div>
		</>
	);
});

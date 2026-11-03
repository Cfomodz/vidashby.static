"use client";

import clsx from "clsx";
import { memo, useCallback } from "react";

import { type AppID, selectIsWindowFullscreen, useSystemStore } from "@/os/store";

// 48x48px touch targets via ::before pseudo-element (WCAG 2.5.5)
const TOUCH_TARGET_CLASSES = [
	"[@media(pointer:coarse)]:before:content-['']",
	"[@media(pointer:coarse)]:before:absolute",
	"[@media(pointer:coarse)]:before:w-10",
	"[@media(pointer:coarse)]:before:h-10",
	"[@media(pointer:coarse)]:before:left-1/2",
	"[@media(pointer:coarse)]:before:top-1/2",
	"[@media(pointer:coarse)]:before:-translate-x-1/2",
	"[@media(pointer:coarse)]:before:-translate-y-1/2",
].join(" ");

// Scale feedback disabled when prefers-reduced-motion is set
const ACTIVE_STATE_CLASSES = [
	"active:opacity-80",
	"[@media(prefers-reduced-motion:no-preference)]:active:scale-90",
].join(" ");

export interface WindowControlsProps {
	windowId: AppID;
}

// CUSTOMIZE: macOS-style traffic light colors — change hex values to retheme
export const WindowControls = memo(function WindowControls({
	windowId,
}: WindowControlsProps) {
	const closeWindow = useSystemStore((s) => s.closeWindow);
	const minimizeWindow = useSystemStore((s) => s.minimizeWindow);
	const toggleFullscreen = useSystemStore((s) => s.toggleFullscreen);
	const isFullscreen = useSystemStore(selectIsWindowFullscreen(windowId));

	const handleClose = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			e.stopPropagation();
			closeWindow(windowId);
		},
		[closeWindow, windowId],
	);

	const handleMinimize = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			e.stopPropagation();
			minimizeWindow(windowId);
		},
		[minimizeWindow, windowId],
	);

	const handleFullscreen = useCallback(
		(e: React.MouseEvent | React.KeyboardEvent) => {
			e.stopPropagation();
			toggleFullscreen(windowId);
		},
		[toggleFullscreen, windowId],
	);

	return (
		<fieldset
			className={clsx(
				"flex items-center gap-2 border-none p-0 rounded-full",
				"[@media(pointer:coarse)]:gap-3.5",
			)}
			aria-label="Window controls"
		>
			<button
				type="button"
				onClick={handleClose}
				onKeyDown={(e) => e.key === "Enter" && handleClose(e)}
				className={clsx(
					"group relative h-3 w-3 rounded-full bg-[#ff5f57] transition-[color,transform,opacity] hover:bg-[#ff3b30] focus:outline-none focus:ring-2 focus:ring-[#ff5f57]/50",
					TOUCH_TARGET_CLASSES,
					ACTIVE_STATE_CLASSES,
				)}
				aria-label="Close window"
			>
				<span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none text-black/0 transition-colors group-hover:text-black/80" style={{ marginTop: "-1px" }}>
					×
				</span>
			</button>

			<button
				type="button"
				onClick={handleMinimize}
				onKeyDown={(e) => e.key === "Enter" && handleMinimize(e)}
				className={clsx(
					"group relative h-3 w-3 rounded-full bg-[#febc2e] transition-[color,transform,opacity] hover:bg-[#f5a623] focus:outline-none focus:ring-2 focus:ring-[#febc2e]/50",
					TOUCH_TARGET_CLASSES,
					ACTIVE_STATE_CLASSES,
				)}
				aria-label="Minimize window"
			>
				<span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold leading-none text-black/0 transition-colors group-hover:text-black/80" style={{ marginTop: "-3px" }}>
					−
				</span>
			</button>

			<button
				type="button"
				onClick={handleFullscreen}
				onKeyDown={(e) => e.key === "Enter" && handleFullscreen(e)}
				className={clsx(
					"group relative h-3 w-3 rounded-full bg-[#28c840] transition-[color,transform,opacity] hover:bg-[#1fb636] focus:outline-none focus:ring-2 focus:ring-[#28c840]/50",
					TOUCH_TARGET_CLASSES,
					ACTIVE_STATE_CLASSES,
				)}
				aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
			>
				<span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold leading-none text-black/0 transition-colors group-hover:text-black/80" style={{ marginTop: "-2px" }}>
					{isFullscreen ? "−" : "+"}
				</span>
			</button>
		</fieldset>
	);
});

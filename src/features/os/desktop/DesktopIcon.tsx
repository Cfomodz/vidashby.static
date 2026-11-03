"use client";

import { motion, useAnimation } from "framer-motion";
import { FileText, Folder } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ELASTIC_DRAG_CONFIG, useElasticDrag } from "@/os/config";
import { useNavigate } from "@/os/hooks";
import { ICON_COLORS, type AppID, useSystemStore } from "@/os/store";

import { useDeviceType } from "./dock/useDeviceType";
import type { DesktopIconType } from "./useDesktop";

interface IconGraphicProps {
	isFile: boolean;
	isSelected: boolean;
	colorRgb: string;
}

function IconGraphic({ isFile, isSelected, colorRgb }: IconGraphicProps) {
	if (isFile) {
		return (
			<FileText
				className="h-10 w-10 transition-colors duration-150"
				style={{ color: `rgba(${colorRgb}, ${isSelected ? 1 : 0.8})` }}
				strokeWidth={1.5}
			/>
		);
	}

	return (
		<Folder
			className="h-14 w-14 transition-colors duration-150"
			style={{ color: `rgba(${colorRgb}, ${isSelected ? 0.9 : 0.7})` }}
			strokeWidth={1.5}
			fill="currentColor"
			fillOpacity={0.2}
		/>
	);
}

export interface DesktopIconProps {
	appId: AppID;
	label: string;
	iconType: DesktopIconType;
	folderId?: string;
	contentUrl?: string;
	title?: string;
	isSelected: boolean;
	onSelect: () => void;
	onExecute: () => void;
	onRegisterRef?: (element: HTMLButtonElement | null) => void;
}

// Clickable desktop icon. Single-click selects, double-click launches the app.
// Supports elastic drag on desktop and keyboard activation.
export const DesktopIcon = memo(function DesktopIcon({
	appId,
	label,
	iconType,
	folderId,
	contentUrl,
	title,
	isSelected,
	onSelect,
	onExecute,
	onRegisterRef,
}: DesktopIconProps) {
	const { navigate, getPath } = useNavigate();
	const isFile = iconType === "file";
	const iconColor = useSystemStore((s) => s.iconColor);
	const colorRgb = ICON_COLORS[iconColor].value;
	const deviceType = useDeviceType();
	const controls = useAnimation();

	const isDraggable = deviceType === "desktop";

	const {
		snapBackTransition,
		handleDragStart,
		handleDragEnd,
		handleContextMenu,
		shouldBlockClick,
	} = useElasticDrag({
		controls,
		enabled: isDraggable,
		springConfig: ELASTIC_DRAG_CONFIG.icon,
	});

	// Remove href after hydration so the browser status bar doesn't show a URL preview.
	// Crawlers still see the initial href for indexing.
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	const href = useMemo(() => {
		if (isFile && contentUrl) {
			return getPath(appId, { url: contentUrl, title });
		}
		if (folderId) {
			return getPath(appId, { folderId });
		}
		return getPath(appId);
	}, [appId, isFile, contentUrl, title, folderId, getPath]);

	const launchWithProps = useCallback(() => {
		if (isFile && contentUrl) {
			navigate(appId, { props: { url: contentUrl, title }, launchMethod: "desktop_icon" });
		} else if (folderId) {
			navigate(appId, { props: { folderId }, launchMethod: "desktop_icon" });
		} else {
			navigate(appId, { launchMethod: "desktop_icon" });
		}
	}, [appId, isFile, contentUrl, title, folderId, navigate]);

	const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const clickCountRef = useRef(0);

	// Cast anchor to button type for backward compat with selection box intersection logic
	const anchorRefCallback = useCallback(
		(element: HTMLAnchorElement | null) => {
			onRegisterRef?.(element as unknown as HTMLButtonElement | null);
		},
		[onRegisterRef],
	);

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement>) => {
			e.preventDefault();
			e.stopPropagation();

			if (shouldBlockClick()) {
				return;
			}

			clickCountRef.current += 1;

			if (clickCountRef.current === 1) {
				onSelect();

				clickTimeoutRef.current = setTimeout(() => {
					clickCountRef.current = 0;
				}, 300);
			} else if (clickCountRef.current === 2) {
				if (clickTimeoutRef.current) {
					clearTimeout(clickTimeoutRef.current);
					clickTimeoutRef.current = null;
				}
				clickCountRef.current = 0;

				onExecute();

				controls.start({
					scale: [1, 0.92, 1.02, 1],
					transition: {
						duration: 0.3,
						times: [0, 0.3, 0.7, 1],
						ease: "easeOut",
					},
				});

				setTimeout(() => {
					launchWithProps();
				}, 100);
			}
		},
		[controls, launchWithProps, onSelect, onExecute, shouldBlockClick],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLAnchorElement>) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onExecute();
				controls.start({
					scale: [1, 0.92, 1.02, 1],
					transition: {
						duration: 0.3,
						times: [0, 0.3, 0.7, 1],
						ease: "easeOut",
					},
				});
				setTimeout(() => {
					launchWithProps();
				}, 100);
			}
		},
		[controls, launchWithProps, onExecute],
	);

	return (
		<motion.a
			ref={anchorRefCallback}
			href={isHydrated ? undefined : href}
			tabIndex={0}
			draggable={false}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onContextMenu={handleContextMenu}
			animate={controls}
			drag={isDraggable}
			dragSnapToOrigin={isDraggable}
			dragElastic={0}
			dragMomentum={false}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			whileDrag={
				isDraggable
					? {
							scale: ELASTIC_DRAG_CONFIG.liftScale,
							boxShadow: ELASTIC_DRAG_CONFIG.liftShadow,
							zIndex: 100,
						}
					: undefined
			}
			transition={snapBackTransition}
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			className="pointer-events-auto group flex w-20 flex-col items-center gap-1.5 rounded-lg p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
			aria-label={`Open ${label} ${isFile ? "file" : "folder"}`}
			aria-pressed={isSelected}
			data-desktop-icon
		>
			<div
				className={`
					flex h-14 w-14 items-center justify-center rounded-lg
					transition-all duration-150
					${isSelected ? "bg-white/10" : "bg-transparent group-hover:bg-white/5"}
				`}
			>
				<IconGraphic isFile={isFile} isSelected={isSelected} colorRgb={colorRgb} />
			</div>

			<span
				className={`
					whitespace-nowrap rounded px-1.5 py-0.5
					font-mono text-xs transition-colors duration-150
					${isSelected ? "text-white" : "text-white/90"}
				`}
				style={{
					backgroundColor: isSelected ? `rgba(${colorRgb}, 0.6)` : undefined,
					textShadow: isSelected ? "none" : "0 1px 2px rgba(0,0,0,0.8)",
				}}
			>
				{label}
			</span>
		</motion.a>
	);
});

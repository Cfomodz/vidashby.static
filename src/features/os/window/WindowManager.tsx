"use client";

import { AnimatePresence } from "framer-motion";
import { memo, Suspense } from "react";
import { useShallow } from "zustand/react/shallow";

import { useSystemStore } from "@/os/store";

import { getAppManifest } from "./app-registry";
import { useReducedMotion } from "./useReducedMotion";
import { WindowFrame } from "./WindowFrame";

function AppLoadingFallback() {
	return (
		<div className="flex h-full min-h-[200px] w-full items-center justify-center">
			<div className="flex flex-col items-center gap-3">
				<div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
				<div className="h-2 w-16 animate-pulse rounded-full bg-white/5" />
			</div>
		</div>
	);
}

export interface WindowManagerProps {}

// Renders all visible (non-minimized) windows.
// useShallow required because .filter() creates new array refs on each call.
export const WindowManager = memo(function WindowManager({}: WindowManagerProps) {
	const visibleWindows = useSystemStore(
		useShallow((state) => state.windows.filter((w) => w.status === "open")),
	);
	const reducedMotion = useReducedMotion();

	return (
		<AnimatePresence mode="popLayout">
			{visibleWindows.map((window) => {
				const manifest = getAppManifest(window.id);
				const AppComponent = manifest.component;
				const displayTitle = window.props?.title ?? manifest.name;

				return (
					<WindowFrame
						key={window.id}
						window={window}
						title={displayTitle}
						reducedMotion={reducedMotion}
					>
						<Suspense fallback={<AppLoadingFallback />}>
							<AppComponent windowProps={window.props} />
						</Suspense>
					</WindowFrame>
				);
			})}
		</AnimatePresence>
	);
});

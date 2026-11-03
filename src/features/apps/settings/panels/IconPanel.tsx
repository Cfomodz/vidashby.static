"use client";

import clsx from "clsx";
import { FileText, Folder } from "lucide-react";
import { memo } from "react";

import {
	ICON_COLORS,
	type IconColor,
	useSystemStore,
} from "@/os/store";

const COLOR_OPTIONS = Object.entries(ICON_COLORS) as [IconColor, { label: string; value: string }][];

export const IconPanel = memo(function IconPanel() {
	const iconColor = useSystemStore((s) => s.iconColor);
	const setIconColor = useSystemStore((s) => s.setIconColor);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="mb-1 text-sm font-medium text-white">Icon Color</h3>
				<p className="mb-4 text-xs text-white/40">
					Choose a color for desktop icons and folders.
				</p>

				<div className="grid grid-cols-5 gap-3">
					{COLOR_OPTIONS.map(([id, { label, value }]) => {
						const isActive = iconColor === id;
						return (
							<button
								key={id}
								type="button"
								onClick={() => setIconColor(id)}
								className={clsx(
									"flex flex-col items-center gap-2 rounded-xl p-3 transition-all",
									isActive
										? "bg-white/15 ring-2 ring-white/30"
										: "bg-white/5 hover:bg-white/10",
								)}
							>
								<div className="flex h-10 w-full items-center justify-center rounded-lg bg-black/40">
									<FileText
										className="h-6 w-6"
										style={{ color: `rgb(${value})` }}
										strokeWidth={1.5}
									/>
								</div>
								<span className="text-xs text-white/60">{label}</span>
							</button>
						);
					})}
				</div>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-medium text-white">Preview</h3>
				<div className="flex gap-8 rounded-lg bg-black/40 p-6">
					<div className="flex flex-col items-center gap-1.5">
						<div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/5">
							<Folder
								className="h-10 w-10"
								style={{ color: `rgba(${ICON_COLORS[iconColor].value}, 0.85)` }}
								strokeWidth={1.5}
								fill="currentColor"
								fillOpacity={0.2}
							/>
						</div>
						<span className="font-mono text-xs text-white/90">Projects</span>
					</div>
					<div className="flex flex-col items-center gap-1.5">
						<div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10">
							<FileText
								className="h-8 w-8"
								style={{ color: `rgb(${ICON_COLORS[iconColor].value})` }}
								strokeWidth={1.5}
							/>
						</div>
						<span
							className="rounded px-1.5 py-0.5 font-mono text-xs text-white"
							style={{ backgroundColor: `rgba(${ICON_COLORS[iconColor].value}, 0.6)` }}
						>
							readme.md
						</span>
					</div>
				</div>
			</div>
		</div>
	);
});

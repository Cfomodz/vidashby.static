"use client";

import clsx from "clsx";
import { memo } from "react";

import { OS_INFO } from "@/lib/profile";
import { TERMINAL_FONT_COLORS, type TerminalFontColor, useSystemStore } from "@/os/store";

// CUSTOMIZE: Add or modify terminal font color presets in store/types.ts
const COLOR_OPTIONS = Object.entries(TERMINAL_FONT_COLORS) as [
	TerminalFontColor,
	{ label: string; value: string },
][];

export const TerminalPanel = memo(function TerminalPanel() {
	const terminalFontColor = useSystemStore((s) => s.terminalFontColor);
	const setTerminalFontColor = useSystemStore((s) => s.setTerminalFontColor);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="mb-1 text-sm font-medium text-white">Font Color</h3>
				<p className="mb-4 text-xs text-white/40">Choose a color for terminal text output.</p>

				<div className="grid grid-cols-5 gap-3">
					{COLOR_OPTIONS.map(([id, { label, value }]) => {
						const isActive = terminalFontColor === id;
						return (
							<button
								key={id}
								type="button"
								onClick={() => setTerminalFontColor(id)}
								className={clsx(
									"flex flex-col items-center gap-2 rounded-xl p-3 transition-all",
									isActive ? "bg-white/15 ring-2 ring-white/30" : "bg-white/5 hover:bg-white/10",
								)}
							>
								<div
									className="flex h-10 w-full items-center justify-center rounded-lg bg-black/40 font-mono text-sm"
									style={{ color: `rgb(${value})` }}
								>
									{">"}_
								</div>
								<span className="text-xs text-white/60">{label}</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Live preview */}
			<div>
				<h3 className="mb-2 text-sm font-medium text-white">Preview</h3>
				<div className="rounded-lg bg-black/40 p-4 font-mono text-sm">
					<div style={{ color: `rgba(${TERMINAL_FONT_COLORS[terminalFontColor].value}, 0.8)` }}>
						Welcome to {OS_INFO.name} Terminal v{OS_INFO.version}
					</div>
					<div style={{ color: `rgba(${TERMINAL_FONT_COLORS[terminalFontColor].value}, 0.4)` }}>
						Type &apos;help&apos; for available commands.
					</div>
					<div className="mt-2 flex items-center gap-1">
						<span style={{ color: `rgba(${TERMINAL_FONT_COLORS[terminalFontColor].value}, 0.5)` }}>
							❯
						</span>
						<span style={{ color: `rgba(${TERMINAL_FONT_COLORS[terminalFontColor].value}, 0.9)` }}>
							ls projects
						</span>
					</div>
					<div style={{ color: `rgba(${TERMINAL_FONT_COLORS[terminalFontColor].value}, 0.7)` }}>
						n8n-workflows.md browser-use.md streamdrop.md
					</div>
				</div>
			</div>
		</div>
	);
});

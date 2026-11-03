// Powerlevel10k-style command prompt

import { Folder, GitBranch } from "lucide-react";
import { memo } from "react";

import { useDeviceType } from "@/os/desktop/dock/useDeviceType";

export interface P10kPromptProps {
	/** Current working directory from VFS (e.g. "/projects") */
	cwd?: string;
	/** Git branch name (null if not in repo) */
	gitBranch?: string;
	/** Current input value */
	value: string;
	/** Input change handler */
	onChange: (value: string) => void;
	/** Enter key submission handler */
	onSubmit: () => void;
	/** Tab key handler for auto-complete */
	onTabComplete?: () => void;
	/** Up arrow handler for history navigation */
	onHistoryUp: () => void;
	/** Down arrow handler for history navigation */
	onHistoryDown: () => void;
	/** Reference to the input element */
	inputRef: React.RefObject<HTMLInputElement | null>;
	/** Focus handler - called when input receives focus (e.g., keyboard opens) */
	onFocus?: () => void;
}

const ARROW_WIDTH = 10;

function SegmentArrow({ color }: { color: string }) {
	return (
		<svg
			className="absolute right-0 top-0 h-full translate-x-full"
			style={{ width: ARROW_WIDTH }}
			viewBox="0 0 10 24"
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			<polygon points="0,0 10,12 0,24" fill={color} />
		</svg>
	);
}

function PathSegment({ path, hasNext }: { path: string; hasNext: boolean }) {
	return (
		<div
			className="relative flex h-6 items-center gap-1.5 bg-white/15 pl-2.5"
			style={{ paddingRight: hasNext ? 8 : 12 }}
		>
			<Folder className="size-3.5 text-white/60" aria-hidden="true" />
			<span className="font-mono text-xs font-medium text-white/80">{path}</span>
			<SegmentArrow color="rgba(255,255,255,0.15)" />
		</div>
	);
}

function GitSegment({ branch }: { branch: string }) {
	return (
		<div
			className="relative flex h-6 items-center gap-1.5 bg-white/10"
			style={{
				paddingLeft: ARROW_WIDTH + 6,
				paddingRight: 8,
				marginLeft: -1,
			}}
		>
			{/* Notch cutout to receive previous arrow */}
			<svg
				className="absolute left-0 top-0 h-full"
				style={{ width: ARROW_WIDTH }}
				viewBox="0 0 10 24"
				preserveAspectRatio="none"
				aria-hidden="true"
			>
				<polygon points="0,0 10,12 0,24 0,0" fill="rgba(255,255,255,0.15)" />
			</svg>
			<GitBranch className="size-3.5 text-white/50" aria-hidden="true" />
			<span className="font-mono text-xs font-medium text-white/60">git:({branch})</span>
			<SegmentArrow color="rgba(255,255,255,0.1)" />
		</div>
	);
}

/** Convert a VFS path like "/projects/2025-2026" to a display string like "~/projects/2025-2026" */
function formatCwd(cwd: string): string {
	if (cwd === "/") return "~";
	return `~${cwd}`;
}

export const P10kPrompt = memo(function P10kPrompt({
	cwd = "/",
	gitBranch = "main",
	value,
	onChange,
	onSubmit,
	onTabComplete,
	onHistoryUp,
	onHistoryDown,
	inputRef,
	onFocus,
}: P10kPromptProps) {
	const deviceType = useDeviceType();
	const isMobile = deviceType === "mobile";

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			onSubmit();
			// Blur input to close mobile keyboard after command submission
			// Desktop: keep focus for continuous typing
			if (isMobile) {
				inputRef.current?.blur();
			}
		} else if (event.key === "Tab") {
			event.preventDefault();
			onTabComplete?.();
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			onHistoryUp();
		} else if (event.key === "ArrowDown") {
			event.preventDefault();
			onHistoryDown();
		}
	};

	return (
		<div className="flex items-center">
			{/* Desktop: Full P10k segments | Mobile: Simplified ~ prompt */}
			{!isMobile && (
				<div className="flex items-center">
					<PathSegment path={formatCwd(cwd)} hasNext={Boolean(gitBranch)} />
					{gitBranch && <GitSegment branch={gitBranch} />}
				</div>
			)}

			{/* Input area */}
			<div className={`flex h-8 flex-1 items-center ${isMobile ? "" : "ml-4"}`}>
				{/* Mobile: Show ~ prefix for context */}
				{isMobile && <span className="mr-1 font-mono text-base leading-none" style={{ color: "rgba(var(--term-rgb), 0.5)" }}>~</span>}
				<span className="mr-1 font-mono text-base leading-none md:text-sm" style={{ color: "rgba(var(--term-rgb), 0.6)" }}>❯</span>
				<input
					ref={inputRef}
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={onFocus}
					style={{ color: "rgba(var(--term-rgb), 0.9)", caretColor: `rgb(var(--term-rgb))` }}
					className="h-8 flex-1 bg-transparent font-mono text-base leading-none outline-none placeholder:text-white/30 md:text-sm"
					placeholder=""
					spellCheck={false}
					autoComplete="off"
					autoCapitalize="off"
					aria-label="Terminal input"
				/>
			</div>
		</div>
	);
});

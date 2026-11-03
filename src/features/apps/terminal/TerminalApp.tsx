"use client";

import clsx from "clsx";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { OS_INFO } from "@/lib/profile";
import {
	AppID,
	NotificationID,
	TERMINAL_FONT_COLORS,
	useNotificationStore,
	useSystemStore,
} from "@/os/store";

import { Game2048 } from "./Game2048";
import { P10kPrompt } from "./P10kPrompt";
import { SnakeGame } from "./SnakeGame";
import { SteamLocomotive } from "./SteamLocomotive";
import { TetrisGame } from "./TetrisGame";
import type { HistoryEntry } from "./types";
import { useTerminalState } from "./use-terminal-state";

function HistoryLine({ entry }: { entry: HistoryEntry }) {
	const baseClass = "font-mono text-sm whitespace-pre-wrap break-words";

	if (entry.type === "command") {
		return (
			<div className={baseClass} style={{ color: "rgba(var(--term-rgb), 0.9)" }}>
				<span style={{ color: "rgba(var(--term-rgb), 0.5)" }}>❯ </span>
				{entry.content}
			</div>
		);
	}

	if (entry.type === "error") {
		return <div className={clsx(baseClass, "text-red-400")}>{entry.content}</div>;
	}

	return (
		<div className={baseClass} style={{ color: "rgba(var(--term-rgb), 0.7)" }}>
			{entry.content}
		</div>
	);
}

function WelcomeBanner() {
	return (
		<div className="mb-4 font-mono text-sm">
			<div style={{ color: "rgba(var(--term-rgb), 0.8)" }}>
				Welcome to {OS_INFO.name} Terminal v{OS_INFO.version}
			</div>
			<div style={{ color: "rgba(var(--term-rgb), 0.4)" }}>
				Type &apos;help&apos; for available commands, or &apos;about&apos; to start.
			</div>
		</div>
	);
}

export const TerminalApp = memo(function TerminalApp() {
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const closeWindow = useSystemStore((s) => s.closeWindow);
	const addNotification = useNotificationStore((s) => s.addNotification);
	const terminalFontColor = useSystemStore((s) => s.terminalFontColor);
	const fontRgb = TERMINAL_FONT_COLORS[terminalFontColor].value;
	const [showSl, setShowSl] = useState(false);
	const [showSnake, setShowSnake] = useState(false);
	const [showTetris, setShowTetris] = useState(false);
	const [show2048, setShow2048] = useState(false);

	useEffect(() => {
		addNotification(NotificationID.TerminalOpened);
	}, [addNotification]);

	const handleExit = useCallback(() => {
		closeWindow(AppID.Terminal);
	}, [closeWindow]);

	const handleSl = useCallback(() => {
		setShowSl(true);
	}, []);

	const handleSnake = useCallback(() => {
		setShowSnake(true);
	}, []);

	const handleTetris = useCallback(() => {
		setShowTetris(true);
	}, []);

	const handle2048 = useCallback(() => {
		setShow2048(true);
	}, []);

	const handleHiddenCommand = useCallback(() => {
		addNotification(NotificationID.HiddenFeature);
	}, [addNotification]);

	const {
		currentInput,
		history,
		cwd,
		setInput,
		executeCommand,
		tabComplete,
		navigateHistoryUp,
		navigateHistoryDown,
		addOutput,
	} = useTerminalState({
		onExit: handleExit,
		onSl: handleSl,
		onSnake: handleSnake,
		onTetris: handleTetris,
		on2048: handle2048,
		onHiddenCommand: handleHiddenCommand,
	});

	const handleSlComplete = useCallback(() => {
		setShowSl(false);
		addOutput("Choo choo! Did you mean 'ls'?");
		setInput("");
		inputRef.current?.focus();
	}, [addOutput, setInput]);

	const handleSnakeComplete = useCallback(
		(score: number) => {
			setShowSnake(false);
			addOutput(`Game over! Final score: ${score}`);
			setInput("");
			inputRef.current?.focus();
		},
		[addOutput, setInput],
	);

	const handleTetrisComplete = useCallback(
		(score: number) => {
			setShowTetris(false);
			addOutput(`Game over! Final score: ${score}`);
			setInput("");
			inputRef.current?.focus();
		},
		[addOutput, setInput],
	);

	const handle2048Complete = useCallback(
		(score: number) => {
			setShow2048(false);
			addOutput(`Game over! Final score: ${score}`);
			setInput("");
			inputRef.current?.focus();
		},
		[addOutput, setInput],
	);

	// Auto-scroll on new content
	const historyLength = history.length;
	// biome-ignore lint/correctness/useExhaustiveDependencies: historyLength intentionally triggers scroll on history change
	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
		}
	}, [historyLength]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const scrollToBottom = useCallback(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
		}
	}, []);

	const handleInputFocus = useCallback(() => {
		// Small delay to allow keyboard to finish opening
		setTimeout(scrollToBottom, 100);
	}, [scrollToBottom]);

	// Scroll to bottom when mobile keyboard opens
	useEffect(() => {
		const viewport = globalThis.window?.visualViewport;
		if (!viewport) return;

		const handleResize = () => {
			// Scroll to bottom when viewport shrinks (keyboard opens)
			scrollToBottom();
		};

		viewport.addEventListener("resize", handleResize);
		return () => viewport.removeEventListener("resize", handleResize);
	}, [scrollToBottom]);

	const handleContainerClick = useCallback(() => {
		inputRef.current?.focus();
	}, []);

	const handleContainerKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			// Ctrl+L to clear
			if (event.key === "l" && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				setInput("");
				return;
			}

			// Auto-focus input when typing printable characters (desktop UX)
			// Skip if already focused on input, or if modifier keys are pressed
			if (
				document.activeElement !== inputRef.current &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.altKey &&
				event.key.length === 1
			) {
				event.preventDefault();
				inputRef.current?.focus();
				setInput(currentInput + event.key);
			}
		},
		[setInput, currentInput],
	);

	return (
		<div
			className="relative flex h-full flex-col bg-transparent text-white focus:outline-none"
			style={{ "--term-rgb": fontRgb } as React.CSSProperties}
			onClick={handleContainerClick}
			onKeyDown={handleContainerKeyDown}
			tabIndex={-1}
			role="application"
			aria-label="Terminal emulator"
		>
			{/* Steam locomotive animation */}
			{showSl && <SteamLocomotive duration={3000} onComplete={handleSlComplete} />}
			{/* Game overlays */}
			{showSnake && <SnakeGame onComplete={handleSnakeComplete} />}
			{showTetris && <TetrisGame onComplete={handleTetrisComplete} />}
			{show2048 && <Game2048 onComplete={handle2048Complete} />}

			<div
				ref={scrollContainerRef}
				className="flex-1 overflow-y-auto overscroll-contain p-4 pb-2 [-webkit-overflow-scrolling:touch] md:[scrollbar-width:thin] md:[scrollbar-color:rgba(255,255,255,0.1)_transparent] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:[&::-webkit-scrollbar]:block md:[&::-webkit-scrollbar]:w-1.5 md:[&::-webkit-scrollbar-track]:transparent md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-white/10"
				role="log"
				aria-live="polite"
				aria-label="Terminal output"
			>
				<WelcomeBanner />
				<div className="space-y-1">
					{history.map((entry) => (
						<HistoryLine key={entry.id} entry={entry} />
					))}
				</div>
			</div>

			<div className="shrink-0 border-t border-white/5 px-4 pb-5 pt-3 md:pb-4">
				<P10kPrompt
					value={currentInput}
					cwd={cwd}
					onChange={setInput}
					onSubmit={executeCommand}
					onTabComplete={tabComplete}
					onHistoryUp={navigateHistoryUp}
					onHistoryDown={navigateHistoryDown}
					inputRef={inputRef}
					onFocus={handleInputFocus}
				/>
			</div>
		</div>
	);
});

import { useCallback, useRef, useState } from "react";

import { type AllowlistedCommand, AnalyticsEvent, trackEvent } from "@/lib/analytics";
import {
	CERT_GROUPS,
	COMMUNITIES,
	EDUCATION,
	EXPERIENCE,
	FEATURED_PROJECTS,
	HIGHLIGHTS,
	OS_INFO,
	PROFILE,
	REPO_CATEGORIES,
	REPOS,
	SKILLS,
} from "@/lib/profile";

import type { CommandDefinition, HistoryEntry, TerminalState } from "./types";

function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(text: string): string {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

interface VFSNode {
	type: "dir" | "file";
	children?: Record<string, VFSNode>;
	content?: string;
}

function file(content: string | string[]): VFSNode {
	return { type: "file", content: Array.isArray(content) ? content.join("\n") : content };
}

function dir(children: Record<string, VFSNode>): VFSNode {
	return { type: "dir", children };
}

// Terminal filesystem — generated from src/lib/profile.ts so it never drifts from the About app
const VFS: VFSNode = dir({
	projects: dir(
		Object.fromEntries(
			FEATURED_PROJECTS.map((project) => [
				`${project.slug}.md`,
				file([
					`${project.title}`,
					`${project.repo}${project.repoMeta ? ` · ${project.repoMeta}` : ""}`,
					"",
					project.description,
					"",
					...(project.highlight ? [`Highlight: ${project.highlight}`] : []),
					`Stack: ${project.tags.join(" · ")}`,
					...project.links.map((link) => `${link.label}: ${link.href}`),
				]),
			]),
		),
	),
	repos: dir(
		Object.fromEntries(
			REPO_CATEGORIES.filter((category) => category.id !== "all").map((category) => [
				`${category.id}.txt`,
				file([
					category.label,
					"",
					...REPOS.filter((repo) => repo.category === category.id).flatMap((repo) => [
						`${repo.name}  (${repo.meta})`,
						`  ${repo.description}`,
						`  ${repo.repo}`,
					]),
				]),
			]),
		),
	),
	certifications: dir({
		...Object.fromEntries(
			CERT_GROUPS.map((group) => [
				`${group.slug}.txt`,
				file([
					group.label,
					"",
					...group.certs.flatMap((cert) => [
						`${cert.name}${cert.expired ? ` (${cert.expired})` : ""}`,
						`  ${cert.issuer} · ${cert.dates}${cert.credentialId ? ` · ID ${cert.credentialId}` : ""}`,
					]),
				]),
			]),
		),
		"education.txt": file([
			"Education",
			"",
			...EDUCATION.flatMap((entry) => [entry.name, `  ${entry.school} · ${entry.dates}`]),
		]),
	}),
	experience: dir({
		"timeline.txt": file(
			EXPERIENCE.flatMap((entry) => [
				`${entry.when.padEnd(20)} ${entry.role} @ ${entry.org}`,
				`${"".padEnd(20)} ${entry.description}`,
				"",
			]).slice(0, -1),
		),
	}),
	about: dir({
		"about.txt": file([PROFILE.lede, "", ...HIGHLIGHTS.map((h) => `* ${h.title}: ${h.detail}`)]),
		"skills.txt": file(SKILLS.map((group) => `${group.label}: ${group.skills.join(", ")}`)),
		"contact.txt": file([
			`Email:    ${PROFILE.email}`,
			`Phone:    ${PROFILE.phone}`,
			`Location: ${PROFILE.location}`,
			`GitHub:   ${PROFILE.github}`,
			`LinkedIn: ${PROFILE.linkedin}`,
			`n8n:      ${PROFILE.n8n}`,
		]),
		"communities.txt": file(
			COMMUNITIES.flatMap((community) => [
				`${community.name} (${community.badge})`,
				`  ${community.description}`,
				`  ${community.href}`,
			]),
		),
	}),
});

let currentPath = "/";

function resolvePath(path: string): string {
	if (path === "/" || path === "~") return "/";

	let parts: string[];
	if (path.startsWith("/")) {
		parts = path.split("/").filter(Boolean);
	} else {
		const currentParts = currentPath.split("/").filter(Boolean);
		parts = [...currentParts, ...path.split("/").filter(Boolean)];
	}

	const resolved: string[] = [];
	for (const part of parts) {
		if (part === "..") {
			resolved.pop();
		} else if (part !== ".") {
			resolved.push(part);
		}
	}
	return "/" + resolved.join("/");
}

function getNode(path: string): VFSNode | null {
	if (path === "/") return VFS;
	const parts = path.split("/").filter(Boolean);
	let node: VFSNode = VFS;
	for (const part of parts) {
		if (!node.children || !node.children[part]) return null;
		node = node.children[part];
	}
	return node;
}

function getCurrentDir(): string {
	return currentPath;
}

function tabCompleteInput(input: string): string | null {
	const trimmed = input.trimStart();
	const parts = trimmed.split(/\s+/);

	// Command completion (one word, no trailing space)
	if (parts.length === 1 && !input.endsWith(" ")) {
		const partial = (parts[0] ?? "").toLowerCase();
		if (!partial) return null;
		const matches = Object.keys(COMMAND_REGISTRY).filter(
			(cmd) => cmd.startsWith(partial) && !COMMAND_REGISTRY[cmd]?.hidden,
		);
		if (matches.length === 1) return `${matches[0]} `;
		return null;
	}

	// Path completion for the last argument
	const pathArg = parts[parts.length - 1] ?? "";
	let searchDir = currentPath;
	let namePartial = pathArg;

	if (pathArg.includes("/")) {
		const lastSlash = pathArg.lastIndexOf("/");
		const dirPart = pathArg.substring(0, lastSlash) || "/";
		namePartial = pathArg.substring(lastSlash + 1);
		searchDir = resolvePath(dirPart);
	}

	const node = getNode(searchDir);
	if (!node?.children) return null;

	const matches = Object.keys(node.children).filter((name) => name.startsWith(namePartial));
	if (matches.length === 1) {
		const match = matches[0]!;
		const isDir = node.children[match]?.type === "dir";
		const prefix = pathArg.includes("/") ? pathArg.substring(0, pathArg.lastIndexOf("/") + 1) : "";
		const completed = `${prefix}${match}${isDir ? "/" : ""}`;
		const newParts = [...parts.slice(0, -1), completed];
		return newParts.join(" ");
	}

	return null;
}

const COMMAND_REGISTRY: Record<string, CommandDefinition> = {
	help: {
		name: "help",
		description: "List available commands",
		handler: () => {
			const commands = Object.values(COMMAND_REGISTRY).filter((cmd) => !cmd.hidden);
			const lines = [
				"Available commands:",
				"",
				...commands.map((cmd) => `  ${cmd.name.padEnd(12)} ${cmd.description}`),
				"",
				"Type a command and press Enter to execute.",
			];
			return lines;
		},
	},
	clear: {
		name: "clear",
		description: "Clear terminal history",
		handler: () => null,
	},
	whoami: {
		name: "whoami",
		description: "Display current user",
		handler: () => `guest@${OS_INFO.host}`,
	},
	ls: {
		name: "ls",
		description: "List directory contents",
		handler: (args) => {
			const target = args[0] ? resolvePath(args[0]) : currentPath;
			const node = getNode(target);
			if (!node) return `ls: cannot access '${args[0]}': No such file or directory`;
			if (node.type === "file") return args[0] ?? "";
			if (!node.children) return ["(empty)"];
			return Object.entries(node.children).map(([name, child]) =>
				child.type === "dir" ? `drwxr-xr-x  ${name}/` : `-rw-r--r--  ${name}`,
			);
		},
	},
	cd: {
		name: "cd",
		description: "Change directory",
		handler: (args) => {
			const target = args[0] ?? "/";
			const resolved = resolvePath(target);
			const node = getNode(resolved);
			if (!node) return `cd: no such file or directory: ${target}`;
			if (node.type !== "dir") return `cd: not a directory: ${target}`;
			currentPath = resolved;
			return null;
		},
	},
	cat: {
		name: "cat",
		description: "Display file contents",
		handler: (args) => {
			if (!args[0]) return "cat: missing operand";
			const resolved = resolvePath(args[0]);
			const node = getNode(resolved);
			if (!node) return `cat: ${args[0]}: No such file or directory`;
			if (node.type === "dir") return `cat: ${args[0]}: Is a directory`;
			return node.content ?? "";
		},
	},
	tree: {
		name: "tree",
		description: "Display directory tree",
		handler: () => {
			const lines: string[] = ["."];
			function walk(node: VFSNode, prefix: string, _isLast: boolean) {
				if (!node.children) return;
				const entries = Object.entries(node.children);
				entries.forEach(([name, child], i) => {
					const last = i === entries.length - 1;
					const connector = last ? "└── " : "├── ";
					lines.push(prefix + connector + (child.type === "dir" ? name + "/" : name));
					if (child.type === "dir") {
						walk(child, prefix + (last ? "    " : "│   "), last);
					}
				});
			}
			walk(getNode(currentPath) ?? VFS, "", true);
			return lines;
		},
	},
	mkdir: {
		name: "mkdir",
		description: "Create directory",
		hidden: true,
		handler: () => "Permission denied. Nice try ;)",
	},
	echo: {
		name: "echo",
		description: "Display a line of text",
		handler: (args) => (args.length > 0 ? args.join(" ") : ""),
	},
	date: {
		name: "date",
		description: "Display current date and time",
		handler: () => new Date().toString(),
	},
	git: {
		name: "git",
		description: "Git commands",
		hidden: true,
		handler: (args) => {
			if (args[0] === "status") {
				return "nothing to commit, working tree clean";
			}
			return `git: '${args[0] ?? ""}' is not a git command`;
		},
	},
	sl: {
		name: "sl",
		description: "Steam locomotive",
		hidden: true,
		handler: () => null,
	},
	coffee: {
		name: "coffee",
		description: "Brew coffee",
		hidden: true,
		handler: () => "☕",
	},
	sudo: {
		name: "sudo",
		description: "Superuser do",
		hidden: true,
		handler: () => "Permission denied. Nice try ;)",
	},
	rm: {
		name: "rm",
		description: "Remove files",
		hidden: true,
		handler: (args) => {
			if (args.some((arg) => arg.startsWith("-") && (arg.includes("r") || arg.includes("f")))) {
				return "Operation blocked.";
			}
			return "Permission denied. Nice try ;)";
		},
	},
	exit: {
		name: "exit",
		description: "Close terminal",
		handler: () => null,
	},
	games: {
		name: "games",
		description: "List available games",
		handler: () => [
			"Available games:",
			"",
			"  snake        Classic Snake (WASD/arrows, Q to quit)",
			"  tetris       Classic Tetris (arrows, up to rotate, Q to quit)",
			"  2048         Number puzzle game (WASD/arrows, Q to quit)",
			"",
			"Type a game name to play.",
		],
	},
	about: {
		name: "about",
		description: `Learn about ${PROFILE.givenName}`,
		handler: () => [
			`${PROFILE.name} — ${PROFILE.title}`,
			`> ${PROFILE.tagline}`,
			"",
			PROFILE.lede,
			"",
			"Try: ls projects · cat certifications/audit-compliance.txt · contact",
		],
	},
	contact: {
		name: "contact",
		description: "How to reach me",
		handler: () => getNode("/about/contact.txt")?.content ?? "",
	},
	resume: {
		name: "resume",
		description: "Experience at a glance",
		handler: () => getNode("/experience/timeline.txt")?.content ?? "",
	},
	fortune: {
		name: "fortune",
		description: "Random wisdom or humor",
		handler: () => {
			const fortunes = [
				"The best way to predict the future is to invent it. — Alan Kay",
				"Talk is cheap. Show me the code. — Linus Torvalds",
				"Any sufficiently advanced technology is indistinguishable from magic. — Arthur C. Clarke",
				"First, solve the problem. Then, write the code. — John Johnson",
				"Simplicity is prerequisite for reliability. — Edsger W. Dijkstra",
				"Programs must be written for people to read, and only incidentally for machines to execute. — Abelson & Sussman",
				"The most dangerous phrase in the English language is: We've always done it this way. — Grace Hopper",
				"It works on my machine. — Every developer, ever.",
				"There are only two hard things in Computer Science: cache invalidation and naming things. — Phil Karlton",
				"The best error message is the one that never shows up. — Thomas Fuchs",
				"Weeks of coding can save you hours of planning.",
				"A user interface is like a joke. If you have to explain it, it's not that good.",
				"In theory, there is no difference between theory and practice. In practice, there is.",
				"The only way to go fast is to go well. — Robert C. Martin",
				"Debugging is twice as hard as writing the code in the first place. — Brian Kernighan",
				"UNIX is user-friendly. It's just picky about who its friends are.",
				"There is no cloud. It's just someone else's computer.",
				"404: Fortune not found. Just kidding.",
			];
			return fortunes[Math.floor(Math.random() * fortunes.length)] ?? fortunes[0]!;
		},
	},
	cowsay: {
		name: "cowsay",
		description: "Make a cow say something",
		hidden: true,
		handler: (args) => {
			const message = args.length > 0 ? args.join(" ") : "Moo!";
			const border = "-".repeat(message.length + 2);
			return [
				` ${border}`,
				`< ${message} >`,
				` ${border}`,
				"        \\   ^__^",
				"         \\  (oo)\\_______",
				"            (__)\\       )\\/\\",
				"                ||----w |",
				"                ||     ||",
			];
		},
	},
	rev: {
		name: "rev",
		description: "Reverse text",
		hidden: true,
		handler: (args) => {
			if (args.length === 0) return "Usage: rev <text>";
			return args.join(" ").split("").reverse().join("");
		},
	},
	apt: {
		name: "apt",
		description: "Package manager",
		hidden: true,
		handler: (args) => {
			if (args[0] === "moo") {
				return [
					"         (__)",
					"         (oo)",
					"   /------\\/",
					"  / |    ||",
					" *  /\\---/\\",
					"    ~~   ~~",
					'...."Have you mooed today?"...',
				];
			}
			if (args[0] === "install") {
				return `E: Could not open lock file - open (13: Permission denied)`;
			}
			return `apt: command '${args[0] ?? ""}' not recognized`;
		},
	},
	snake: {
		name: "snake",
		description: "Play Snake",
		hidden: true,
		handler: () => null,
	},
	tetris: {
		name: "tetris",
		description: "Play Tetris",
		hidden: true,
		handler: () => null,
	},
	"2048": {
		name: "2048",
		description: "Play 2048",
		hidden: true,
		handler: () => null,
	},
	neofetch: {
		name: "neofetch",
		description: "System information",
		handler: () => {
			return [
				`  ____    _      guest@${OS_INFO.host}`,
				" |  _ \\  / \\     ──────────────────",
				` | | | |/ _ \\    OS: ${OS_INFO.name} v${OS_INFO.version}`,
				` | |_| / ___ \\   Kernel: ${OS_INFO.kernel}`,
				" |____/_/   \\_\\  Shell: vidash",
				`                 User: ${PROFILE.name}`,
				`                 Location: ${PROFILE.location}`,
				"                 Uptime: since page load",
				"                 Theme: Glassmorphism",
				"                 Defects: 0 (target)",
			];
		},
	},
	ping: {
		name: "ping",
		description: "Ping a host",
		hidden: true,
		handler: (args) => {
			const host = args[0] ?? "localhost";
			return [
				`PING ${host} (127.0.0.1): 56 data bytes`,
				`64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.042 ms`,
				`64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.038 ms`,
				`64 bytes from 127.0.0.1: icmp_seq=2 ttl=64 time=0.041 ms`,
				"",
				`--- ${host} ping statistics ---`,
				"3 packets transmitted, 3 packets received, 0.0% packet loss",
			];
		},
	},
};

const ALLOWLISTED_COMMANDS = new Set<AllowlistedCommand>([
	// Visible commands
	"help",
	"clear",
	"whoami",
	"ls",
	"cd",
	"cat",
	"tree",
	"echo",
	"date",
	"exit",
	"about",
	// Hidden commands (easter eggs)
	"git",
	"coffee",
	"sudo",
	"rm",
	"mkdir",
]);

function toAllowlistedCommand(commandName: string): AllowlistedCommand {
	const normalized = commandName.toLowerCase();
	if (ALLOWLISTED_COMMANDS.has(normalized as AllowlistedCommand)) {
		return normalized as AllowlistedCommand;
	}
	return "unknown";
}

const INITIAL_STATE: TerminalState = {
	currentInput: "",
	history: [],
	historyIndex: -1,
	savedInput: "",
};

function createOutputEntries(output: string | string[]): HistoryEntry[] {
	const outputLines = Array.isArray(output) ? output : [output];
	return outputLines.map((line) => ({
		id: generateId(),
		type: "output" as const,
		content: line,
		timestamp: Date.now(),
	}));
}

function createErrorEntry(escapedInput: string): HistoryEntry {
	return {
		id: generateId(),
		type: "error" as const,
		content: `command not found: ${escapedInput}`,
		timestamp: Date.now(),
	};
}

function processCommand(commandName: string, args: string[], escapedInput: string): HistoryEntry[] {
	const command = COMMAND_REGISTRY[commandName.toLowerCase()];

	if (!command) {
		return [createErrorEntry(escapedInput)];
	}

	const output = command.handler(args);
	if (output === null) {
		return [];
	}

	return createOutputEntries(output);
}

export interface UseTerminalStateOptions {
	/** Callback when exit command is executed */
	onExit?: () => void;
	/** Callback when sl command is executed */
	onSl?: () => void;
	/** Callback when snake command is executed */
	onSnake?: () => void;
	/** Callback when tetris command is executed */
	onTetris?: () => void;
	/** Callback when 2048 command is executed */
	on2048?: () => void;
	/** Callback when a hidden easter egg command is executed (not in help) */
	onHiddenCommand?: () => void;
}

export function useTerminalState(options: UseTerminalStateOptions = {}) {
	const { onExit, onSl, onSnake, onTetris, on2048, onHiddenCommand } = options;
	const [state, setState] = useState<TerminalState>(INITIAL_STATE);
	const [cwd, setCwd] = useState<string>("/");
	const cwdRef = useRef<string>("/");

	const setInput = useCallback((value: string) => {
		setState((prev) => ({
			...prev,
			currentInput: value,
			historyIndex: -1,
		}));
	}, []);

	const addOutput = useCallback((content: string, isError = false) => {
		const entry: HistoryEntry = {
			id: generateId(),
			type: isError ? "error" : "output",
			content,
			timestamp: Date.now(),
		};
		setState((prev) => ({
			...prev,
			history: [...prev.history, entry],
		}));
	}, []);

	const clearHistory = useCallback(() => {
		setState((prev) => ({
			...prev,
			history: [],
			historyIndex: -1,
		}));
	}, []);

	const executeCommand = useCallback(() => {
		const currentInput = state.currentInput.trim();
		if (!currentInput) {
			return;
		}

		const parts = currentInput.split(/\s+/);
		const commandName = (parts[0] ?? "").toLowerCase();

		// Track command execution for analytics
		trackEvent(AnalyticsEvent.TERMINAL_COMMAND_EXECUTED, {
			command: toAllowlistedCommand(commandName),
		});

		// Handle exit command - close window
		if (commandName === "exit") {
			onExit?.();
			return;
		}

		// Handle sl command - trigger train animation
		if (commandName === "sl") {
			onSl?.();
			return;
		}

		// Handle snake command - launch game
		if (commandName === "snake") {
			onSnake?.();
			return;
		}

		// Handle tetris command - launch game
		if (commandName === "tetris") {
			onTetris?.();
			return;
		}

		// Handle 2048 command - launch game
		if (commandName === "2048") {
			on2048?.();
			return;
		}

		// Check if this is a hidden easter egg command (not in help menu)
		const command = COMMAND_REGISTRY[commandName];
		if (command?.hidden) {
			onHiddenCommand?.();
		}

		setState((prev) => {
			const trimmedInput = prev.currentInput.trim();
			if (!trimmedInput) {
				return prev;
			}

			// Reset module-level currentPath to the known cwd before processing.
			// React StrictMode double-invokes setState updaters; without this,
			// the second invocation sees currentPath already mutated by the first
			// (e.g. cd into /projects, then second run resolves "projects" from
			// /projects → /projects/projects → "no such file or directory").
			currentPath = cwdRef.current;

			const escapedInput = escapeHtml(trimmedInput);
			const inputParts = trimmedInput.split(/\s+/);
			const cmdName = inputParts[0] ?? "";
			const args = inputParts.slice(1);

			// Handle clear command specially (clears history)
			if (cmdName.toLowerCase() === "clear") {
				return { ...INITIAL_STATE };
			}

			const commandEntry: HistoryEntry = {
				id: generateId(),
				type: "command",
				content: escapedInput,
				timestamp: Date.now(),
			};

			const outputEntries = processCommand(cmdName, args, escapedInput);
			const newHistory = [...prev.history, commandEntry, ...outputEntries];

			return {
				...prev,
				currentInput: "",
				history: newHistory,
				historyIndex: -1,
				savedInput: "",
			};
		});

		// Sync cwd after command runs (cd updates the module-level currentPath)
		const newPath = getCurrentDir();
		if (newPath !== cwdRef.current) {
			cwdRef.current = newPath;
			setCwd(newPath);
		}
	}, [state.currentInput, onExit, onSl, onHiddenCommand]);

	const tabComplete = useCallback(() => {
		const completed = tabCompleteInput(state.currentInput);
		if (completed !== null) {
			setState((prev) => ({ ...prev, currentInput: completed, historyIndex: -1 }));
		}
	}, [state.currentInput]);

	const navigateHistoryUp = useCallback(() => {
		setState((prev) => {
			const commandHistory = prev.history.filter((e) => e.type === "command");
			if (commandHistory.length === 0) {
				return prev;
			}

			const newIndex =
				prev.historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, prev.historyIndex - 1);

			const savedInput = prev.historyIndex === -1 ? prev.currentInput : prev.savedInput;

			const targetEntry = commandHistory[newIndex];
			if (!targetEntry) {
				return prev;
			}

			return {
				...prev,
				currentInput: targetEntry.content,
				historyIndex: newIndex,
				savedInput,
			};
		});
	}, []);

	const navigateHistoryDown = useCallback(() => {
		setState((prev) => {
			if (prev.historyIndex === -1) {
				return prev;
			}

			const commandHistory = prev.history.filter((e) => e.type === "command");
			const newIndex = prev.historyIndex + 1;

			if (newIndex >= commandHistory.length) {
				return {
					...prev,
					currentInput: prev.savedInput,
					historyIndex: -1,
				};
			}

			const targetEntry = commandHistory[newIndex];
			if (!targetEntry) {
				return prev;
			}

			return {
				...prev,
				currentInput: targetEntry.content,
				historyIndex: newIndex,
			};
		});
	}, []);

	return {
		...state,
		cwd,
		setInput,
		executeCommand,
		tabComplete,
		navigateHistoryUp,
		navigateHistoryDown,
		clearHistory,
		addOutput,
	};
}

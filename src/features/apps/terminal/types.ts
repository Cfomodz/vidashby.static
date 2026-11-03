export type HistoryEntryType = "command" | "output" | "error";

export interface HistoryEntry {
	/** Unique identifier for React keys */
	id: string;
	/** Entry classification */
	type: HistoryEntryType;
	/** Display content (command text or output) */
	content: string;
	/** Timestamp for ordering (milliseconds since epoch) */
	timestamp: number;
}

export interface TerminalState {
	/** Current user input before submission */
	currentInput: string;
	/** All previous commands and outputs */
	history: HistoryEntry[];
	/** Index into history for up/down navigation (-1 = current input) */
	historyIndex: number;
	/** Cached current input when navigating history */
	savedInput: string;
}

export interface TerminalActions {
	/** Update current input text */
	setInput: (value: string) => void;
	/** Submit command and process it */
	executeCommand: () => void;
	/** Navigate to previous command in history */
	navigateHistoryUp: () => void;
	/** Navigate to next command in history */
	navigateHistoryDown: () => void;
	/** Clear all history entries */
	clearHistory: () => void;
	/** Add output entry to history */
	addOutput: (content: string, isError?: boolean) => void;
}

export type TerminalStore = TerminalState & TerminalActions;

export type CommandHandler = (args: string[]) => string | string[] | null;

export interface CommandDefinition {
	/** Display name for help listing */
	name: string;
	/** Brief description of what the command does */
	description: string;
	/** Handler function that processes the command */
	handler: CommandHandler;
	/** If true, command is hidden from help listing (easter eggs) */
	hidden?: boolean;
}

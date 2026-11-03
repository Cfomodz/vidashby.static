"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

const SIZE = 4;
type Board = number[][];

function createBoard(): Board {
	const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0) as number[]);
	addRandom(board);
	addRandom(board);
	return board;
}

function addRandom(board: Board) {
	const empty: [number, number][] = [];
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (!board[r]![c]) empty.push([r, c]);
		}
	}
	if (empty.length === 0) return;
	const [r, c] = empty[Math.floor(Math.random() * empty.length)]!;
	board[r]![c] = Math.random() < 0.9 ? 2 : 4;
}

function clone(board: Board): Board {
	return board.map((row) => [...row]);
}

function slideRow(row: number[]): { row: number[]; score: number } {
	const filtered = row.filter(Boolean);
	let score = 0;
	const merged: number[] = [];

	for (let i = 0; i < filtered.length; i++) {
		if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
			const val = filtered[i]! * 2;
			merged.push(val);
			score += val;
			i++;
		} else {
			merged.push(filtered[i]!);
		}
	}

	while (merged.length < SIZE) merged.push(0);
	return { row: merged, score };
}

function move(board: Board, dir: "left" | "right" | "up" | "down"): { board: Board; score: number; moved: boolean } {
	const b = clone(board);
	let totalScore = 0;
	let moved = false;

	if (dir === "left" || dir === "right") {
		for (let r = 0; r < SIZE; r++) {
			const row = dir === "right" ? [...b[r]!].reverse() : [...b[r]!];
			const { row: slid, score } = slideRow(row);
			const final = dir === "right" ? slid.reverse() : slid;
			totalScore += score;
			if (final.some((v, i) => v !== b[r]![i])) moved = true;
			b[r] = final;
		}
	} else {
		for (let c = 0; c < SIZE; c++) {
			const col = Array.from({ length: SIZE }, (_, r) => b[r]![c]!);
			const row = dir === "down" ? [...col].reverse() : col;
			const { row: slid, score } = slideRow(row);
			const final = dir === "down" ? slid.reverse() : slid;
			totalScore += score;
			if (final.some((v, i) => v !== b[i]![c])) moved = true;
			for (let r = 0; r < SIZE; r++) b[r]![c] = final[r]!;
		}
	}

	return { board: b, score: totalScore, moved };
}

function canMove(board: Board): boolean {
	for (let r = 0; r < SIZE; r++) {
		for (let c = 0; c < SIZE; c++) {
			if (!board[r]![c]) return true;
			if (c + 1 < SIZE && board[r]![c] === board[r]![c + 1]) return true;
			if (r + 1 < SIZE && board[r]![c] === board[r + 1]![c]) return true;
		}
	}
	return false;
}

function hasWon(board: Board): boolean {
	return board.some((row) => row.some((cell) => cell >= 2048));
}

function padCell(val: number): string {
	const s = val ? String(val) : ".";
	return s.padStart(5).padEnd(6);
}

interface Game2048Props {
	onComplete: (score: number) => void;
}

export const Game2048 = memo(function Game2048({ onComplete }: Game2048Props) {
	const [board, setBoard] = useState<Board>(createBoard);
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const [won, setWon] = useState(false);
	const scoreRef = useRef(0);
	const gameOverRef = useRef(false);
	scoreRef.current = score;

	const doMove = useCallback((dir: "left" | "right" | "up" | "down") => {
		setBoard((prev) => {
			const { board: next, score: pts, moved } = move(prev, dir);
			if (!moved) return prev;
			addRandom(next);
			setScore((s) => s + pts);
			if (hasWon(next) && !won) setWon(true);
			if (!canMove(next)) {
				gameOverRef.current = true;
				setGameOver(true);
			}
			return next;
		});
	}, [won]);

	useEffect(() => {
		const handle = (e: KeyboardEvent) => {
			if (gameOverRef.current) {
				if (e.key === "q" || e.key === "Escape") onComplete(scoreRef.current);
				return;
			}

			switch (e.key) {
				case "ArrowLeft": case "a": e.preventDefault(); doMove("left"); break;
				case "ArrowRight": case "d": e.preventDefault(); doMove("right"); break;
				case "ArrowUp": case "w": e.preventDefault(); doMove("up"); break;
				case "ArrowDown": case "s": e.preventDefault(); doMove("down"); break;
				case "q": case "Escape": onComplete(scoreRef.current); break;
			}
		};

		window.addEventListener("keydown", handle);
		return () => window.removeEventListener("keydown", handle);
	}, [onComplete, doMove]);

	const border = "+" + "-".repeat(SIZE * 6 + 1) + "+";

	return (
		<div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-black/80">
			<div className="font-mono text-xs leading-tight" style={{ color: "rgba(var(--term-rgb), 0.9)" }}>
				<div className="mb-1 text-center" style={{ color: "rgba(var(--term-rgb), 0.5)" }}>
					Score: {score} | WASD/Arrows to move | Q to quit
				</div>
				{won && !gameOver && (
					<div className="mb-1 text-center text-yellow-400">You reached 2048! Keep going or Q to quit</div>
				)}
				<div className="whitespace-pre">{border}</div>
				{board.map((row, r) => (
					<div key={r} className="whitespace-pre">
						|{row.map((cell) => padCell(cell)).join("")} |
					</div>
				))}
				<div className="whitespace-pre">{border}</div>
				{gameOver && (
					<div className="mt-2 text-center text-red-400">
						No more moves! Score: {score} | Press Q or Esc to exit
					</div>
				)}
			</div>
		</div>
	);
});

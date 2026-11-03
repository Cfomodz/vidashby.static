"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

const COLS = 10;
const ROWS = 20;
const TICK_MS = 500;

type Grid = number[][];

// Tetromino shapes: each is an array of rotations, each rotation is [row][col]
const PIECES = [
	// I
	[[[1,1,1,1]], [[1],[1],[1],[1]]],
	// O
	[[[1,1],[1,1]]],
	// T
	[[[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[1,1,1],[0,1,0]], [[0,1],[1,1],[0,1]]],
	// S
	[[[0,1,1],[1,1,0]], [[1,0],[1,1],[0,1]]],
	// Z
	[[[1,1,0],[0,1,1]], [[0,1],[1,1],[1,0]]],
	// L
	[[[1,0],[1,0],[1,1]], [[1,1,1],[1,0,0]], [[1,1],[0,1],[0,1]], [[0,0,1],[1,1,1]]],
	// J
	[[[0,1],[0,1],[1,1]], [[1,0,0],[1,1,1]], [[1,1],[1,0],[1,0]], [[1,1,1],[0,0,1]]],
];

function createGrid(): Grid {
	return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
	const idx = Math.floor(Math.random() * PIECES.length);
	return { shape: PIECES[idx]!, rotation: 0, x: 3, y: 0 };
}

function getShape(piece: { shape: number[][][]; rotation: number }) {
	return piece.shape[piece.rotation % piece.shape.length]!;
}

function collides(grid: Grid, piece: ReturnType<typeof randomPiece>) {
	const shape = getShape(piece);
	for (let r = 0; r < shape.length; r++) {
		for (let c = 0; c < shape[r]!.length; c++) {
			if (shape[r]![c]) {
				const ny = piece.y + r;
				const nx = piece.x + c;
				if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
				if (ny >= 0 && grid[ny]![nx]) return true;
			}
		}
	}
	return false;
}

function merge(grid: Grid, piece: ReturnType<typeof randomPiece>): Grid {
	const newGrid = grid.map((row) => [...row]);
	const shape = getShape(piece);
	for (let r = 0; r < shape.length; r++) {
		for (let c = 0; c < shape[r]!.length; c++) {
			if (shape[r]![c]) {
				const ny = piece.y + r;
				const nx = piece.x + c;
				if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
					newGrid[ny]![nx] = 1;
				}
			}
		}
	}
	return newGrid;
}

function clearRows(grid: Grid): { grid: Grid; cleared: number } {
	const remaining = grid.filter((row) => row.some((cell) => !cell));
	const cleared = ROWS - remaining.length;
	const empty = Array.from({ length: cleared }, () => Array(COLS).fill(0) as number[]);
	return { grid: [...empty, ...remaining], cleared };
}

interface TetrisGameProps {
	onComplete: (score: number) => void;
}

export const TetrisGame = memo(function TetrisGame({ onComplete }: TetrisGameProps) {
	const [grid, setGrid] = useState<Grid>(createGrid);
	const [piece, setPiece] = useState(() => randomPiece());
	const [score, setScore] = useState(0);
	const [gameOver, setGameOver] = useState(false);
	const gridRef = useRef(grid);
	const pieceRef = useRef(piece);
	const gameOverRef = useRef(false);
	const scoreRef = useRef(0);

	gridRef.current = grid;
	pieceRef.current = piece;
	scoreRef.current = score;

	const drop = useCallback(() => {
		if (gameOverRef.current) return;
		const g = gridRef.current;
		const p = pieceRef.current;
		const moved = { ...p, y: p.y + 1 };

		if (!collides(g, moved)) {
			setPiece(moved);
		} else {
			// Lock piece
			const merged = merge(g, p);
			const { grid: cleared, cleared: lines } = clearRows(merged);
			const points = [0, 100, 300, 500, 800][lines] ?? 0;
			setScore((s) => s + points);
			setGrid(cleared);

			// Spawn new piece
			const next = randomPiece();
			if (collides(cleared, next)) {
				gameOverRef.current = true;
				setGameOver(true);
			} else {
				setPiece(next);
			}
		}
	}, []);

	// Keyboard
	useEffect(() => {
		const handle = (e: KeyboardEvent) => {
			if (gameOverRef.current) {
				if (e.key === "q" || e.key === "Escape") onComplete(scoreRef.current);
				return;
			}

			const g = gridRef.current;
			const p = pieceRef.current;

			switch (e.key) {
				case "ArrowLeft":
				case "a": {
					e.preventDefault();
					const moved = { ...p, x: p.x - 1 };
					if (!collides(g, moved)) setPiece(moved);
					break;
				}
				case "ArrowRight":
				case "d": {
					e.preventDefault();
					const moved = { ...p, x: p.x + 1 };
					if (!collides(g, moved)) setPiece(moved);
					break;
				}
				case "ArrowDown":
				case "s": {
					e.preventDefault();
					drop();
					break;
				}
				case "ArrowUp":
				case "w": {
					e.preventDefault();
					const rotated = { ...p, rotation: p.rotation + 1 };
					if (!collides(g, rotated)) setPiece(rotated);
					break;
				}
				case " ": {
					e.preventDefault();
					// Hard drop
					let d = { ...p };
					while (!collides(g, { ...d, y: d.y + 1 })) d = { ...d, y: d.y + 1 };
					setPiece(d);
					break;
				}
				case "q":
				case "Escape":
					onComplete(scoreRef.current);
					break;
			}
		};

		window.addEventListener("keydown", handle);
		return () => window.removeEventListener("keydown", handle);
	}, [onComplete, drop]);

	// Game tick
	useEffect(() => {
		if (gameOver) return;
		const id = setInterval(drop, TICK_MS);
		return () => clearInterval(id);
	}, [gameOver, drop]);

	// Render
	const display = merge(grid, piece);

	return (
		<div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-black/80">
			<div className="font-mono text-xs leading-tight" style={{ color: "rgba(var(--term-rgb), 0.9)" }}>
				<div className="mb-1 text-center" style={{ color: "rgba(var(--term-rgb), 0.5)" }}>
					Score: {score} | Arrows/WASD | Space=drop | Q=quit
				</div>
				<div className="whitespace-pre">{"+" + "-".repeat(COLS * 2) + "+"}</div>
				{display.map((row, r) => (
					<div key={r} className="whitespace-pre">
						|{row.map((cell) => (cell ? "[]" : "  ")).join("")}|
					</div>
				))}
				<div className="whitespace-pre">{"+" + "-".repeat(COLS * 2) + "+"}</div>
				{gameOver && (
					<div className="mt-2 text-center text-red-400">
						Game Over! Score: {score} | Press Q or Esc to exit
					</div>
				)}
			</div>
		</div>
	);
});

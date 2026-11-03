"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

interface Point {
	x: number;
	y: number;
}

type Direction = "up" | "down" | "left" | "right";

const GRID_W = 30;
const GRID_H = 20;
const TICK_MS = 120;

function randomFood(snake: Point[]): Point {
	let food: Point;
	do {
		food = {
			x: Math.floor(Math.random() * GRID_W),
			y: Math.floor(Math.random() * GRID_H),
		};
	} while (snake.some((s) => s.x === food.x && s.y === food.y));
	return food;
}

interface SnakeGameProps {
	onComplete: (score: number) => void;
}

export const SnakeGame = memo(function SnakeGame({ onComplete }: SnakeGameProps) {
	const [snake, setSnake] = useState<Point[]>([
		{ x: 15, y: 10 },
		{ x: 14, y: 10 },
		{ x: 13, y: 10 },
	]);
	const [food, setFood] = useState<Point>({ x: 20, y: 10 });
	const [, setDirection] = useState<Direction>("right");
	const [gameOver, setGameOver] = useState(false);
	const [score, setScore] = useState(0);
	const dirRef = useRef<Direction>("right");
	const gameOverRef = useRef(false);

	// Handle keyboard input
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (gameOverRef.current) {
				if (e.key === "q" || e.key === "Escape") {
					onComplete(score);
				}
				return;
			}

			const dir = dirRef.current;
			switch (e.key) {
				case "ArrowUp":
				case "w":
					e.preventDefault();
					if (dir !== "down") { dirRef.current = "up"; setDirection("up"); }
					break;
				case "ArrowDown":
				case "s":
					e.preventDefault();
					if (dir !== "up") { dirRef.current = "down"; setDirection("down"); }
					break;
				case "ArrowLeft":
				case "a":
					e.preventDefault();
					if (dir !== "right") { dirRef.current = "left"; setDirection("left"); }
					break;
				case "ArrowRight":
				case "d":
					e.preventDefault();
					if (dir !== "left") { dirRef.current = "right"; setDirection("right"); }
					break;
				case "q":
				case "Escape":
					onComplete(score);
					break;
			}
		};

		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [onComplete, score]);

	// Game loop
	useEffect(() => {
		if (gameOver) return;

		const interval = setInterval(() => {
			setSnake((prev) => {
				const head = prev[0];
				if (!head) return prev;

				const dir = dirRef.current;
				const newHead: Point = {
					x: head.x + (dir === "right" ? 1 : dir === "left" ? -1 : 0),
					y: head.y + (dir === "down" ? 1 : dir === "up" ? -1 : 0),
				};

				// Wall collision
				if (newHead.x < 0 || newHead.x >= GRID_W || newHead.y < 0 || newHead.y >= GRID_H) {
					gameOverRef.current = true;
					setGameOver(true);
					return prev;
				}

				// Self collision
				if (prev.some((s) => s.x === newHead.x && s.y === newHead.y)) {
					gameOverRef.current = true;
					setGameOver(true);
					return prev;
				}

				const newSnake = [newHead, ...prev];

				// Eat food
				if (newHead.x === food.x && newHead.y === food.y) {
					setScore((s) => s + 1);
					setFood(randomFood(newSnake));
				} else {
					newSnake.pop();
				}

				return newSnake;
			});
		}, TICK_MS);

		return () => clearInterval(interval);
	}, [gameOver, food]);

	// Render grid as text
	const renderGrid = useCallback(() => {
		const lines: string[] = [];
		const border = "+" + "-".repeat(GRID_W) + "+";
		lines.push(border);

		for (let y = 0; y < GRID_H; y++) {
			let row = "|";
			for (let x = 0; x < GRID_W; x++) {
				if (snake[0]?.x === x && snake[0]?.y === y) {
					row += "@";
				} else if (snake.some((s) => s.x === x && s.y === y)) {
					row += "o";
				} else if (food.x === x && food.y === y) {
					row += "*";
				} else {
					row += " ";
				}
			}
			row += "|";
			lines.push(row);
		}

		lines.push(border);
		return lines;
	}, [snake, food]);

	return (
		<div className="absolute inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-black/80">
			<div className="font-mono text-xs leading-tight" style={{ color: "rgba(var(--term-rgb), 0.9)" }}>
				<div className="mb-1 text-center" style={{ color: "rgba(var(--term-rgb), 0.5)" }}>
					Score: {score} | WASD/Arrows to move | Q to quit
				</div>
				{renderGrid().map((line, i) => (
					<div key={i} className="whitespace-pre">{line}</div>
				))}
				{gameOver && (
					<div className="mt-2 text-center text-red-400">
						Game Over! Score: {score} | Press Q or Esc to exit
					</div>
				)}
			</div>
		</div>
	);
});

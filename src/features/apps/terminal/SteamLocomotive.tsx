"use client";

import { memo, useEffect, useState } from "react";

export interface SteamLocomotiveProps {
	duration?: number;
	onComplete: () => void;
}

const TRAIN = [
	"      ====        ________                ___________",
	"  _D _|  |_______/        \\__I_I_____===__|_________|",
	"   |(_)---  |   H\\________/ |   |        =|___ ___|",
	"   /     |  |   H  |  |     |   |         ||_| |_||",
	"  |      |  |   H  |__--------------------| [___] |",
	"  | ________|___H__/__|_____/[][]~\\_______|       |",
	"  |/ |   |-----------I_____I [][] []  D   |=======|__",
	"__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__",
	" |/-=|___|=    ||    ||    ||    |_____/~\\___/",
	"  \\_/      \\O=====O=====O=====O_/      \\_/",
];

const SMOKE_FRAMES = [
	["                            (  ) (@@) ( )  (@)  ()    @@    O     @"],
	["                       (@@@@)  (  ) (@@@) ( ) @@   O    ()  @     "],
	["                         (@)  (@@)   (  )  (@) ()   @@   O    @   "],
];

export const SteamLocomotive = memo(function SteamLocomotive({
	duration = 3000,
	onComplete,
}: SteamLocomotiveProps) {
	const [offset, setOffset] = useState(100);
	const [smokeFrame, setSmokeFrame] = useState(0);

	useEffect(() => {
		const startTime = Date.now();
		const interval = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			// Move from 100% (off-screen right) to -60% (off-screen left)
			setOffset(100 - progress * 160);
			setSmokeFrame((prev) => (prev + 1) % SMOKE_FRAMES.length);

			if (progress >= 1) {
				clearInterval(interval);
				onComplete();
			}
		}, 50);

		return () => clearInterval(interval);
	}, [duration, onComplete]);

	const smoke = SMOKE_FRAMES[smokeFrame];

	return (
		<div className="absolute inset-0 z-10 overflow-hidden bg-black/80 font-mono text-[10px] leading-tight" style={{ color: "rgb(var(--term-rgb))" }}>
			<div
				className="absolute top-1/2 -translate-y-1/2 whitespace-pre"
				style={{ left: `${offset}%` }}
			>
				{smoke?.map((line, i) => (
					<div key={`s${i}`} className="text-white/40">{line}</div>
				))}
				{TRAIN.map((line, i) => (
					<div key={`t${i}`}>{line}</div>
				))}
			</div>
		</div>
	);
});

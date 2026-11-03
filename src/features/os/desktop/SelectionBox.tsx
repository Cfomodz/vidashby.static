"use client";

import { memo } from "react";

import type { SelectionBox as SelectionBoxCoords } from "./useSelectionBox";

export interface SelectionBoxProps {
	/** Selection box coordinates from useSelectionBox hook */
	box: SelectionBoxCoords;
}

export const SelectionBox = memo(function SelectionBox({ box }: SelectionBoxProps) {
	return (
		<div
			className="pointer-events-none absolute z-0 rounded-sm border border-white/15 bg-white/5"
			style={{
				left: box.x,
				top: box.y,
				width: box.width,
				height: box.height,
			}}
			aria-hidden="true"
			data-testid="selection-box"
		/>
	);
});

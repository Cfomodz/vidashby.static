"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { memo, useCallback } from "react";

export type AboutTabId = "overview" | "projects" | "certifications" | "experience" | "manual";

interface TabConfig {
	id: AboutTabId;
	label: string;
}

const TABS: TabConfig[] = [
	{ id: "overview", label: "Overview" },
	{ id: "projects", label: "Projects" },
	{ id: "certifications", label: "Certifications" },
	{ id: "experience", label: "Experience" },
	{ id: "manual", label: "System Manual" },
];

export interface TabNavigationProps {
	activeTab: AboutTabId;
	onTabChange: (tab: AboutTabId) => void;
}

export const TabNavigation = memo(function TabNavigation({
	activeTab,
	onTabChange,
}: TabNavigationProps) {
	return (
		<div
			role="tablist"
			aria-label="About sections"
			className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/5 px-3 md:px-5"
		>
			{TABS.map((tab) => (
				<TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={onTabChange} />
			))}
		</div>
	);
});

interface TabButtonProps {
	tab: TabConfig;
	isActive: boolean;
	onClick: (id: AboutTabId) => void;
}

function TabButton({ tab, isActive, onClick }: TabButtonProps) {
	const handleClick = useCallback(() => {
		onClick(tab.id);
	}, [onClick, tab.id]);

	return (
		<button
			type="button"
			role="tab"
			aria-selected={isActive}
			aria-controls={`panel-${tab.id}`}
			id={`tab-${tab.id}`}
			onClick={handleClick}
			className={clsx(
				"relative shrink-0 whitespace-nowrap px-3 py-3 text-xs font-medium transition-colors md:px-4",
				isActive ? "text-white" : "text-white/40 hover:text-white/60",
			)}
		>
			{tab.label}
			{isActive && (
				<motion.div
					layoutId="about-tab-indicator"
					className="absolute inset-x-0 bottom-0 h-px bg-emerald-400/80"
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 35,
					}}
				/>
			)}
		</button>
	);
}

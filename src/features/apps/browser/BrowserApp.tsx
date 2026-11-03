"use client";

import { ArrowLeft, ArrowRight, Lock, Plus, X } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useMemo, useState } from "react";

import { RepoIndex } from "@/apps/about/TabContent";
import { FEATURED_PROJECTS, type FeaturedProject, openExternal, PROFILE } from "@/lib/profile";
import { AppID, useSystemStore } from "@/os/store";

const HOME_URL = `${PROFILE.siteUrl.replace(/^https?:\/\//, "")}/portfolio`;
const HOME_LABEL = "Portfolio";

interface Tab {
	id: string;
	slug: string | null;
	label: string;
}

function createTab(slug: string | null, label: string): Tab {
	return { id: `tab-${crypto.randomUUID()}`, slug, label };
}

function findProject(slug: string | null): FeaturedProject | null {
	if (!slug) return null;
	return FEATURED_PROJECTS.find((project) => project.slug === slug) ?? null;
}

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string;
	onSelectTab: (id: string) => void;
	onCloseTab: (id: string) => void;
	onNewTab: () => void;
}

function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }: TabBarProps) {
	return (
		<div className="flex h-9 shrink-0 items-end bg-[#202124] px-2 pt-1">
			{tabs.map((tab) => {
				const isActive = tab.id === activeTabId;
				return (
					<div
						key={tab.id}
						className={`flex h-8 max-w-[180px] items-center gap-2 rounded-t-lg px-3 cursor-pointer ${
							isActive ? "bg-[#323639]" : "bg-[#202124] hover:bg-[#2a2a2e]"
						}`}
						onClick={() => onSelectTab(tab.id)}
						onKeyDown={() => {}}
						role="tab"
						aria-selected={isActive}
						tabIndex={0}
					>
						<span className="min-w-0 flex-1 truncate text-xs text-white/80">{tab.label}</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onCloseTab(tab.id);
							}}
							className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white/60"
							aria-label={`Close ${tab.label}`}
						>
							<X size={10} />
						</button>
					</div>
				);
			})}
			<button
				type="button"
				onClick={onNewTab}
				className="ml-1 mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/10"
				aria-label="New tab"
			>
				<Plus size={14} />
			</button>
		</div>
	);
}

interface AddressBarProps {
	url: string;
	canGoBack: boolean;
	onBack: () => void;
}

function AddressBar({ url, canGoBack, onBack }: AddressBarProps) {
	return (
		<div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/5 bg-[#323639] px-3">
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onBack}
					disabled={!canGoBack}
					className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 disabled:opacity-30"
					aria-label="Back"
				>
					<ArrowLeft size={16} />
				</button>
				<button
					type="button"
					disabled
					className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 opacity-30"
					aria-label="Forward"
				>
					<ArrowRight size={16} />
				</button>
			</div>

			<div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#202124] px-3 py-1.5">
				<Lock size={12} className="shrink-0 text-white/40" />
				<span className="truncate font-mono text-xs text-white/60">https://{url}</span>
			</div>
		</div>
	);
}

function ProjectImage({ project, sizes }: { project: FeaturedProject; sizes: string }) {
	if (!project.image) {
		return (
			<div className="flex h-full w-full items-center justify-center p-6">
				<span className="text-center font-mono text-sm text-emerald-400">{project.thumbText}</span>
			</div>
		);
	}
	return (
		<Image
			src={project.image}
			alt=""
			fill
			sizes={sizes}
			className="object-cover"
			unoptimized={project.image.endsWith(".gif")}
		/>
	);
}

function TagList({ project }: { project: FeaturedProject }) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{project.highlight && (
				<span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
					{project.highlight}
				</span>
			)}
			{project.tags.map((tag) => (
				<span
					key={tag}
					className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-white/50"
				>
					{tag}
				</span>
			))}
		</div>
	);
}

interface PortfolioHomeProps {
	onSelectProject: (slug: string) => void;
}

function PortfolioHome({ onSelectProject }: PortfolioHomeProps) {
	return (
		<div className="mx-auto max-w-4xl px-6 py-8">
			<div className="mb-8">
				<p className="font-mono text-xs text-emerald-400">&gt; {PROFILE.tagline}</p>
				<h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
					Things I&apos;ve built
				</h1>
				<p className="mt-2 text-sm text-white/50">
					Selected open-source work across automation, security and hardware, with an index of more
					repos below.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{FEATURED_PROJECTS.map((project) => (
					<button
						key={project.slug}
						type="button"
						onClick={() => onSelectProject(project.slug)}
						className="group flex flex-col overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] text-left transition-all hover:border-emerald-400/30 hover:bg-white/[0.05]"
					>
						<div className="relative aspect-video w-full border-b border-white/5 bg-black/40">
							<ProjectImage project={project} sizes="(max-width: 640px) 90vw, 300px" />
						</div>
						<div className="flex flex-1 flex-col gap-2 p-4">
							<h2 className="text-sm font-semibold text-white group-hover:text-emerald-400">
								{project.title}
							</h2>
							<p className="line-clamp-3 text-xs leading-relaxed text-white/50">
								{project.description}
							</p>
							<span className="mt-auto pt-1 text-xs font-medium text-emerald-400">Read more</span>
						</div>
					</button>
				))}
			</div>

			<div className="mt-10">
				<h2 className="mb-3 text-lg font-semibold text-white">More from GitHub</h2>
				<RepoIndex compact />
			</div>
		</div>
	);
}

function ProjectView({ project }: { project: FeaturedProject }) {
	return (
		<article className="mx-auto max-w-3xl px-6 py-8">
			<p className="break-words font-mono text-xs text-white/40">
				{project.repo}
				{project.repoMeta ? ` · ${project.repoMeta}` : ""}
			</p>
			<h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{project.title}</h1>
			<div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
				<ProjectImage project={project} sizes="(max-width: 768px) 90vw, 720px" />
			</div>
			<p className="mt-6 leading-relaxed text-white/70">{project.description}</p>
			<div className="mt-6">
				<TagList project={project} />
			</div>
			<hr className="my-6 border-white/10" />
			<div className="flex flex-wrap gap-3">
				{project.links.map((link) => (
					<a
						key={link.href}
						href={link.href}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => openExternal(e, link.href)}
						className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-emerald-400/50 hover:text-emerald-400"
					>
						{link.label} ↗
					</a>
				))}
			</div>
		</article>
	);
}

export const BrowserApp = memo(function BrowserApp() {
	const closeWindow = useSystemStore((s) => s.closeWindow);

	const [tabs, setTabs] = useState<Tab[]>([createTab(null, HOME_LABEL)]);
	const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");

	const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId), [tabs, activeTabId]);
	const activeProject = useMemo(() => findProject(activeTab?.slug ?? null), [activeTab]);

	const currentUrl = useMemo(() => {
		if (activeTab?.slug) return `${HOME_URL}/${activeTab.slug}`;
		return HOME_URL;
	}, [activeTab]);

	const handleSelectProject = useCallback((slug: string) => {
		const project = findProject(slug);
		if (!project) return;

		setTabs((prev) => {
			const existing = prev.find((t) => t.slug === slug);
			if (existing) {
				setActiveTabId(existing.id);
				return prev;
			}

			const newTab = createTab(slug, project.title);
			setActiveTabId(newTab.id);
			return [...prev, newTab];
		});
	}, []);

	const handleCloseTab = useCallback(
		(id: string) => {
			if (tabs.length === 1) {
				closeWindow(AppID.Browser);
				return;
			}

			const idx = tabs.findIndex((t) => t.id === id);
			const remaining = tabs.filter((t) => t.id !== id);
			setTabs(remaining);

			if (activeTabId === id) {
				const next = remaining[Math.min(idx, remaining.length - 1)];
				if (next) setActiveTabId(next.id);
			}
		},
		[tabs, activeTabId, closeWindow],
	);

	const handleNewTab = useCallback(() => {
		const newTab = createTab(null, HOME_LABEL);
		setTabs((prev) => [...prev, newTab]);
		setActiveTabId(newTab.id);
	}, []);

	const handleBack = useCallback(() => {
		if (!activeTab) return;
		setTabs((prev) =>
			prev.map((t) => (t.id === activeTab.id ? { ...t, slug: null, label: HOME_LABEL } : t)),
		);
	}, [activeTab]);

	return (
		<div className="flex h-full flex-col bg-[#1a1a1e]">
			<TabBar
				tabs={tabs}
				activeTabId={activeTabId}
				onSelectTab={setActiveTabId}
				onCloseTab={handleCloseTab}
				onNewTab={handleNewTab}
			/>
			<AddressBar url={currentUrl} canGoBack={!!activeTab?.slug} onBack={handleBack} />
			<div className="flex-1 overflow-y-auto">
				{activeTab && !activeTab.slug && <PortfolioHome onSelectProject={handleSelectProject} />}
				{activeTab?.slug && activeProject && <ProjectView project={activeProject} />}
			</div>
		</div>
	);
});

"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { memo, useMemo, useState } from "react";

import {
	ALL_REPOS_URL,
	CERT_GROUPS,
	COMMUNITIES,
	EDUCATION,
	EXPERIENCE,
	FEATURED_PROJECTS,
	type FeaturedProject,
	HIGHLIGHTS,
	OS_INFO,
	openExternal,
	PROFILE,
	REPO_CATEGORIES,
	REPOS,
	type RepoCategory,
	SKILLS,
	STATS,
} from "@/lib/profile";

import type { AboutTabId } from "./TabNavigation";

export interface TabContentProps {
	activeTab: AboutTabId;
}

const contentVariants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
};

export const TabContent = memo(function TabContent({ activeTab }: TabContentProps) {
	return (
		<div className="flex-1 overflow-auto p-5">
			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					variants={contentVariants}
					initial="initial"
					animate="animate"
					exit="exit"
					transition={{ duration: 0.15, ease: "easeOut" }}
				>
					{activeTab === "overview" && <OverviewPanel />}
					{activeTab === "projects" && <ProjectsPanel />}
					{activeTab === "certifications" && <CertificationsPanel />}
					{activeTab === "experience" && <ExperiencePanel />}
					{activeTab === "manual" && <ManualPanel />}
				</motion.div>
			</AnimatePresence>
		</div>
	);
});

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: string }) {
	return <h2 className="font-mono text-sm font-medium text-white/70">{`// ${children}`}</h2>;
}

function Tag({ children, highlight }: { children: string; highlight?: boolean }) {
	return (
		<span
			className={clsx(
				"rounded-full px-2 py-0.5 font-mono text-[10px]",
				highlight ? "bg-emerald-400/15 text-emerald-300" : "bg-white/[0.06] text-white/50",
			)}
		>
			{children}
		</span>
	);
}

function ExternalLink({
	href,
	children,
	className,
}: {
	href: string;
	children: React.ReactNode;
	className?: string;
}) {
	const isExternal = !href.startsWith("mailto:") && !href.startsWith("tel:");
	return (
		<a
			href={href}
			target={isExternal ? "_blank" : undefined}
			rel={isExternal ? "noopener noreferrer" : undefined}
			onClick={(e) => openExternal(e, href)}
			className={clsx(
				"pointer-events-auto relative z-10",
				className ?? "text-xs font-medium text-emerald-400 hover:underline",
			)}
		>
			{children}
		</a>
	);
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

function OverviewPanel() {
	return (
		<div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="space-y-6">
			<div className="space-y-3">
				<p className="font-mono text-xs text-emerald-400">&gt; {PROFILE.tagline}</p>
				<p className="text-sm leading-relaxed text-white/70">{PROFILE.lede}</p>
				<div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-white/40">
					<ExternalLink
						href={`mailto:${PROFILE.email}`}
						className="text-white/50 hover:text-emerald-400"
					>
						{PROFILE.email}
					</ExternalLink>
					<ExternalLink href={PROFILE.phoneHref} className="text-white/50 hover:text-emerald-400">
						{PROFILE.phone}
					</ExternalLink>
					<span>{PROFILE.location}</span>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
				{STATS.map((stat) => (
					<div key={stat.label} className="bg-black/40 px-3 py-3">
						<p className="text-xl font-semibold leading-tight text-white">{stat.value}</p>
						<p className="mt-0.5 text-[11px] leading-snug text-white/40">{stat.label}</p>
					</div>
				))}
			</div>

			<div className="space-y-3">
				<SectionHeading>Skills</SectionHeading>
				<div className="space-y-3">
					{SKILLS.map((group) => (
						<div key={group.label}>
							<h3 className="mb-1.5 text-xs font-medium text-white/60">{group.label}</h3>
							<div className="flex flex-wrap gap-1.5">
								{group.skills.map((skill) => (
									<Tag key={skill}>{skill}</Tag>
								))}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="space-y-3">
				<SectionHeading>Highlights</SectionHeading>
				<ul className="grid gap-2 sm:grid-cols-2">
					{HIGHLIGHTS.map((item) => (
						<li key={item.title} className="rounded-lg border border-white/[0.06] px-4 py-3">
							<p className="text-xs font-medium text-white/80">{item.title}</p>
							<p className="mt-1 text-xs leading-relaxed text-white/40">{item.detail}</p>
						</li>
					))}
				</ul>
			</div>

			<div className="space-y-3">
				<SectionHeading>Communities I run</SectionHeading>
				<div className="grid gap-2 sm:grid-cols-2">
					{COMMUNITIES.map((community) => (
						<div
							key={community.name}
							className="flex flex-col gap-2 rounded-lg border border-white/[0.06] px-4 py-3"
						>
							<div className="self-start">
								<Tag highlight={community.featured}>{community.badge}</Tag>
							</div>
							<p className="text-sm font-medium text-white/80">{community.name}</p>
							<p className="flex-1 text-xs leading-relaxed text-white/40">
								{community.description}
							</p>
							<ExternalLink href={community.href}>{community.cta} →</ExternalLink>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function ProjectsPanel() {
	return (
		<div role="tabpanel" id="panel-projects" aria-labelledby="tab-projects" className="space-y-6">
			<div className="space-y-3">
				<SectionHeading>Things I've built</SectionHeading>
				<div className="grid gap-3 lg:grid-cols-2">
					{FEATURED_PROJECTS.map((project) => (
						<ProjectCard key={project.slug} project={project} />
					))}
				</div>
			</div>
			<RepoIndex />
		</div>
	);
}

function ProjectThumb({ project }: { project: FeaturedProject }) {
	if (!project.image) {
		return (
			<div className="flex aspect-video items-center justify-center border-b border-white/[0.06] bg-black/40 p-4">
				<span className="text-center font-mono text-xs text-emerald-400">{project.thumbText}</span>
			</div>
		);
	}
	return (
		<div className="relative aspect-video border-b border-white/[0.06] bg-black/40">
			<Image
				src={project.image}
				alt=""
				fill
				sizes="(max-width: 1024px) 90vw, 340px"
				className="object-cover"
				loading="lazy"
				unoptimized={project.image.endsWith(".gif")}
			/>
		</div>
	);
}

function ProjectCard({ project }: { project: FeaturedProject }) {
	return (
		<article className="flex flex-col overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]">
			<ProjectThumb project={project} />
			<div className="flex flex-1 flex-col gap-2 px-4 py-3">
				<p className="break-words font-mono text-[10px] text-white/35">
					{project.repo}
					{project.repoMeta ? ` · ${project.repoMeta}` : ""}
				</p>
				<h3 className="text-sm font-medium text-white/85">{project.title}</h3>
				<p className="text-xs leading-relaxed text-white/45">{project.description}</p>
				<div className="mt-auto flex flex-wrap gap-1.5 pt-1">
					{project.highlight && <Tag highlight>{project.highlight}</Tag>}
					{project.tags.map((tag) => (
						<Tag key={tag}>{tag}</Tag>
					))}
				</div>
				<div className="flex flex-wrap gap-3 pt-1">
					{project.links.map((link) => (
						<ExternalLink key={link.href} href={link.href}>
							{link.label}
						</ExternalLink>
					))}
				</div>
			</div>
		</article>
	);
}

export function RepoIndex({ compact = false }: { compact?: boolean }) {
	const [filter, setFilter] = useState<RepoCategory | "all">("all");
	const visible = useMemo(
		() => (filter === "all" ? REPOS : REPOS.filter((repo) => repo.category === filter)),
		[filter],
	);

	return (
		<div className="space-y-3">
			{!compact && <SectionHeading>More from GitHub</SectionHeading>}
			<fieldset className="m-0 flex flex-wrap gap-1.5 border-0 p-0">
				<legend className="sr-only">Filter repositories</legend>
				{REPO_CATEGORIES.map((category) => {
					const active = filter === category.id;
					return (
						<button
							key={category.id}
							type="button"
							aria-pressed={active}
							onClick={() => setFilter(category.id)}
							className={clsx(
								"rounded-full border px-3 py-1 text-[11px] transition-colors",
								active
									? "border-white/80 bg-white text-black"
									: "border-white/10 text-white/50 hover:border-white/25 hover:text-white/80",
							)}
						>
							{category.label}
						</button>
					);
				})}
			</fieldset>
			<ul className="grid gap-2 sm:grid-cols-2">
				{visible.map((repo) => (
					<li key={repo.repo}>
						<a
							href={repo.repo}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => openExternal(e, repo.repo)}
							className="pointer-events-auto relative z-10 block h-full rounded-lg border border-white/[0.06] px-3 py-2.5 transition-colors hover:border-emerald-400/40 hover:bg-white/[0.03]"
						>
							<p className="break-words font-mono text-xs font-medium text-white/80">{repo.name}</p>
							<p className="mt-1 text-[11px] leading-relaxed text-white/45">{repo.description}</p>
							<p className="mt-1.5 font-mono text-[10px] text-white/30">{repo.meta}</p>
						</a>
					</li>
				))}
			</ul>
			<ExternalLink href={ALL_REPOS_URL}>
				All {STATS[0]?.value} repositories on GitHub →
			</ExternalLink>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

function CertificationsPanel() {
	return (
		<div
			role="tabpanel"
			id="panel-certifications"
			aria-labelledby="tab-certifications"
			className="space-y-6"
		>
			<p className="text-xs text-white/40">
				Each credential lists its issuer, dates and credential ID so you can verify it.
			</p>
			{CERT_GROUPS.map((group) => (
				<div key={group.slug} className="space-y-2">
					<SectionHeading>{group.label}</SectionHeading>
					<ul className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.06]">
						{group.certs.map((cert) => (
							<li key={cert.name} className="px-4 py-2.5">
								<p
									className={clsx(
										"text-xs font-medium",
										cert.expired ? "text-white/45" : "text-white/80",
									)}
								>
									{cert.name}
								</p>
								<p className="mt-0.5 text-[11px] text-white/40">
									{cert.issuer} · {cert.dates}
									{cert.expired && <span className="text-amber-300/80"> · {cert.expired}</span>}
								</p>
								{cert.credentialId && (
									<p className="mt-0.5 break-all font-mono text-[10px] text-white/30">
										ID {cert.credentialId}
									</p>
								)}
							</li>
						))}
					</ul>
				</div>
			))}
			<div className="space-y-2">
				<SectionHeading>Education</SectionHeading>
				<ul className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.06]">
					{EDUCATION.map((entry) => (
						<li key={entry.name} className="px-4 py-2.5">
							<p className="text-xs font-medium text-white/80">{entry.name}</p>
							<p className="mt-0.5 text-[11px] text-white/40">
								{entry.school} · {entry.dates}
							</p>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Experience
// ---------------------------------------------------------------------------

function ExperiencePanel() {
	return (
		<div
			role="tabpanel"
			id="panel-experience"
			aria-labelledby="tab-experience"
			className="space-y-4"
		>
			<SectionHeading>Where I've worked</SectionHeading>
			<ol className="ml-1 border-l border-white/10">
				{EXPERIENCE.map((entry) => (
					<li key={`${entry.org}-${entry.when}`} className="relative pb-5 pl-5 last:pb-0">
						<span
							className={clsx(
								"absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-emerald-400",
								entry.current ? "bg-emerald-400" : "bg-black",
							)}
						/>
						<p className="font-mono text-[10px] text-white/35">{entry.when}</p>
						<h3 className="text-sm text-white/85">
							{entry.role} · <span className="text-emerald-400">{entry.org}</span>
						</h3>
						<p className="mt-1 text-xs leading-relaxed text-white/45">{entry.description}</p>
					</li>
				))}
			</ol>
		</div>
	);
}

// ---------------------------------------------------------------------------
// System Manual
// ---------------------------------------------------------------------------

const SITE_HOST = PROFILE.siteUrl.replace(/^https?:\/\//, "");

function ManualPanel() {
	return (
		<div role="tabpanel" id="panel-manual" aria-labelledby="tab-manual" className="space-y-5">
			{/* Quick Info Cards */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<ManualCard
					label={`What is ${OS_INFO.name}?`}
					value="A portfolio that runs like an operating system. Open apps, explore folders, use the terminal."
				/>
				<ManualCard label="Easter eggs?" value="A few... try the terminal. :)" />
				<ManualCard
					label="Built with"
					value="Next.js, TypeScript, Tailwind CSS, Framer Motion, Zustand"
				/>
				<ManualCard
					label="Source code"
					value="github.com/Cfomodz/vidashby.static"
					href={PROFILE.sourceUrl}
				/>
				<ManualCard
					label="Credits"
					value="Based on JSOS by Jackson Stephens, CC BY-NC 4.0. Content and branding changed for vidashby."
					href="https://github.com/JKSNS/JKSNS.github.io"
				/>
				<ManualCard label="Contact" value={PROFILE.email} href={`mailto:${PROFILE.email}`} />
			</div>

			{/* Collapsible Legal Sections */}
			<ManualCollapsible title="Privacy Policy" subtitle="Effective November 3, 2026">
				<ManualParagraph
					title="Overview"
					text={`This Privacy Policy explains how ${SITE_HOST} handles information. This is a personal portfolio with no commercial data collection, and it collects as little as possible.`}
				/>
				<ManualParagraph
					title="Automatically Collected"
					text="This site does not use third-party analytics or tracking scripts. No cookies are set for tracking or advertising purposes."
				/>
				<ManualParagraph
					title="Browser Local Storage"
					text="Your interface preferences (such as wallpaper selection) are stored in your browser's Local Storage. This data never leaves your device, is not transmitted to any server, and is used only to preserve your UI settings between visits. You can delete it at any time by clearing your browser's site data for this domain."
				/>
				<ManualParagraph
					title="No Personal Data Collection"
					text="This site does not collect, store, or process personally identifiable information such as names, email addresses, or IP addresses unless you choose to make contact."
				/>
				<ManualParagraph title="Cookies" text="This site does not use cookies." />
				<ManualParagraph
					title="Third-Party Services"
					text="The site's static hosting provider may keep standard server-side access logs (IP address, request timestamp, browser user agent) as part of its infrastructure. No advertising networks, analytics platforms, or data brokers are used on this site."
				/>
				<ManualParagraph
					title="Children's Privacy"
					text="This site is not directed at children under 13 and does not knowingly collect information from them."
				/>
				<ManualParagraph
					title="Your Rights"
					text={`Since no personal data is collected, there is generally nothing to access, correct, or delete. You can clear Local Storage at any time in your browser settings. For any questions, contact ${PROFILE.email}.`}
				/>
				<ManualParagraph
					title="Changes to This Policy"
					text="This policy may be updated to reflect changes to the site. Any updates will be posted here with a revised effective date."
				/>
			</ManualCollapsible>

			<ManualCollapsible title="Terms of Use" subtitle="Effective November 3, 2026">
				<ManualParagraph
					title="Overview"
					text={`This website (${SITE_HOST}) is a personal portfolio operated by ${PROFILE.name}. By accessing this site you agree to these terms. If you do not agree, do not use the site.`}
				/>
				<ManualParagraph
					title="Permitted Use"
					text="You may access this site for personal, non-commercial purposes. You may view content, interact with the interface, and browse project documentation."
				/>
				<div className="space-y-1">
					<h4 className="text-xs font-medium text-white/50">Prohibited Conduct</h4>
					<ul className="space-y-0.5 pl-3">
						{[
							"Use the site for any unlawful purpose.",
							"Attempt to probe, scan, or test vulnerabilities in the site or its infrastructure without permission.",
							"Scrape, crawl, or otherwise extract content using automated means without prior written consent.",
							"Transmit spam, malware, or any malicious code through any interactive feature.",
							"Interfere with or disrupt the site or servers connected to it.",
						].map((item) => (
							<li key={item} className="text-xs leading-relaxed text-white/40">
								<span className="mr-1.5 text-white/20">-</span>
								{item}
							</li>
						))}
					</ul>
				</div>
				<ManualParagraph
					title="Intellectual Property"
					text={`Site content is owned by ${PROFILE.name}. The OS interface is adapted from JSOS by Jackson Stephens under CC BY-NC 4.0, and the source code is available publicly under that license.`}
				/>
				<ManualParagraph
					title="Third-Party Links"
					text="This site links to third-party services (GitHub, LinkedIn, n8n, Skool and others). Those sites are outside this site's control, and this site is not responsible for their content or practices."
				/>
				<ManualParagraph
					title="Disclaimer of Warranties"
					text='This site is provided "as is" and "as available" without any warranty of any kind, express or implied.'
				/>
				<ManualParagraph
					title="Governing Law"
					text="These terms are governed by the laws of the State of Utah, United States, without regard to conflict of law provisions."
				/>
				<ManualParagraph title="Contact" text={PROFILE.email} />
			</ManualCollapsible>
		</div>
	);
}

function ManualCard({ label, value, href }: { label: string; value: string; href?: string }) {
	return (
		<div className="rounded-lg bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.06]">
			<p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-white/30">
				{label}
			</p>
			{href ? (
				<ExternalLink
					href={href}
					className="text-sm text-emerald-400/80 underline underline-offset-2 hover:text-emerald-400"
				>
					{value}
				</ExternalLink>
			) : (
				<p className="text-sm leading-relaxed text-white/60">{value}</p>
			)}
		</div>
	);
}

function ManualCollapsible({
	title,
	subtitle,
	children,
}: {
	title: string;
	subtitle: string;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	return (
		<div className="overflow-hidden rounded-lg border border-white/[0.06]">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
				className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
			>
				<div>
					<h3 className="text-xs font-medium text-white/70">{title}</h3>
					<p className="text-[10px] text-white/30">{subtitle}</p>
				</div>
				<span
					className="text-xs text-white/30 transition-transform"
					style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
				>
					&#9654;
				</span>
			</button>
			{open && <div className="space-y-3 border-t border-white/[0.06] px-4 py-3">{children}</div>}
		</div>
	);
}

function ManualParagraph({ title, text }: { title: string; text: string }) {
	return (
		<div className="space-y-1">
			<h4 className="text-sm font-medium text-white/50">{title}</h4>
			<p className="text-xs leading-relaxed text-white/40">{text}</p>
		</div>
	);
}

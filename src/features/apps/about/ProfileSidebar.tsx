"use client";

import clsx from "clsx";
import { Github, Linkedin, Mail, MapPin, Workflow } from "lucide-react";
import Image from "next/image";
import { memo, useCallback } from "react";

import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { PROFILE } from "@/lib/profile";

interface ProfileAction {
	label: string;
	icon: typeof Mail;
	href: string;
	ariaLabel: string;
}

const PROFILE_ACTIONS: ProfileAction[] = [
	{
		label: "Email",
		icon: Mail,
		href: `mailto:${PROFILE.email}`,
		ariaLabel: `Send email to ${PROFILE.givenName}`,
	},
	{
		label: "GitHub",
		icon: Github,
		href: PROFILE.github,
		ariaLabel: "View GitHub profile",
	},
	{
		label: "LinkedIn",
		icon: Linkedin,
		href: PROFILE.linkedin,
		ariaLabel: "View LinkedIn profile",
	},
	{
		label: "n8n",
		icon: Workflow,
		href: PROFILE.n8n,
		ariaLabel: "View n8n creator profile",
	},
];

function OnlineIndicator() {
	return (
		<span className="relative flex h-3 w-3">
			<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
			<span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
		</span>
	);
}

function Avatar() {
	return (
		<div className="relative shrink-0">
			{/* Profile picture */}
			<div
				className={clsx(
					"relative h-16 w-16 overflow-hidden rounded-full md:h-20 md:w-20",
					"ring-2 ring-white/10 ring-offset-2 ring-offset-black/40",
				)}
			>
				<Image
					src="/assets/profile_picture/pfp.svg"
					alt={PROFILE.name}
					fill
					sizes="(max-width: 768px) 64px, 80px"
					className="object-cover"
					priority
				/>
			</div>
			{/* Online status badge */}
			<div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-black/60 p-1">
				<OnlineIndicator />
			</div>
		</div>
	);
}

interface ActionButtonProps {
	action: ProfileAction;
}

function ActionButton({ action }: ActionButtonProps) {
	const Icon = action.icon;
	const isMail = action.href.startsWith("mailto:");

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement>) => {
			trackEvent(AnalyticsEvent.PROFILE_LINK_CLICKED, {
				platform: action.label.toLowerCase(),
			});

			// Framer-drag windows can swallow default <a> navigation; force external opens.
			if (!isMail) {
				e.preventDefault();
				window.open(action.href, "_blank", "noopener,noreferrer");
			}
		},
		[action.href, action.label, isMail],
	);

	return (
		<a
			href={action.href}
			target={isMail ? undefined : "_blank"}
			rel={isMail ? undefined : "noopener noreferrer"}
			aria-label={action.ariaLabel}
			onClick={handleClick}
			className={clsx(
				"flex min-h-[44px] items-center justify-center gap-2 rounded-md",
				"h-11 w-11 md:h-auto md:w-full md:px-4 md:py-2",
				"bg-white/5 text-white/70",
				"transition-colors duration-150",
				"hover:bg-white/10 hover:text-white",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
				"relative z-10 pointer-events-auto",
			)}
		>
			<Icon className="h-4 w-4" />
			<span className="hidden text-xs font-medium md:inline">{action.label}</span>
		</a>
	);
}

export interface ProfileSidebarProps {
	className?: string;
}

export const ProfileSidebar = memo(function ProfileSidebar({ className }: ProfileSidebarProps) {
	return (
		<aside
			className={clsx(
				"flex flex-col gap-4 p-4 md:items-center md:p-5",
				"border-b border-white/5 md:border-b-0 md:border-r",
				"bg-white/[0.02]",
				className,
			)}
		>
			{/* Identity Section - Horizontal on mobile, vertical on desktop */}
			<div className="flex items-center gap-4 md:flex-col md:gap-4">
				<Avatar />

				{/* Name, Title & Metadata */}
				<div className="flex flex-col gap-1.5 md:items-center md:gap-2">
					{/* Identity */}
					<div className="md:text-center">
						<h2 className="text-base font-semibold text-white">{PROFILE.name}</h2>
						<p className="mt-0.5 text-xs text-white/50">{PROFILE.title}</p>
					</div>

					{/* Metadata - Single row on mobile, stacked on desktop */}
					<div className="flex flex-row gap-3 text-xs text-white/40 md:flex-col md:gap-1.5">
						<div className="flex items-center gap-1.5">
							<MapPin className="h-3 w-3" />
							<span>{PROFILE.location}</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="font-mono text-[10px] uppercase tracking-wider text-white/30">
								TZ
							</span>
							<span className="font-mono">{PROFILE.timezone}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Divider */}
			<div className="h-px w-full bg-white/5" />

			{/* Action Buttons - Icon row on mobile, vertical stack on desktop */}
			<div className="flex w-full flex-row justify-center gap-2 md:flex-col">
				{PROFILE_ACTIONS.map((action) => (
					<ActionButton key={action.label} action={action} />
				))}
			</div>
		</aside>
	);
});

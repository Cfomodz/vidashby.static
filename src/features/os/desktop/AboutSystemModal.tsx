"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useEffect, useState } from "react";

import { OS_INFO, PROFILE } from "@/lib/profile";
import { selectBootTime, selectIsAboutModalOpen, useSystemStore } from "@/os/store";
import { useReducedMotion } from "@/os/window";

function formatUptime(bootTime: number): string {
	const now = Date.now();
	const diffMs = now - bootTime;
	const diffMinutes = Math.floor(diffMs / 60000);

	if (diffMinutes < 60) {
		return `${diffMinutes}m`;
	}

	const hours = Math.floor(diffMinutes / 60);
	const minutes = diffMinutes % 60;
	return `${hours}h ${minutes}m`;
}

// "About This System" modal with profile info and live uptime counter.
export const AboutSystemModal = memo(function AboutSystemModal() {
	const isOpen = useSystemStore(selectIsAboutModalOpen);
	const bootTime = useSystemStore(selectBootTime);
	const toggleAboutModal = useSystemStore((s) => s.toggleAboutModal);
	const prefersReducedMotion = useReducedMotion();

	const [uptime, setUptime] = useState(() => formatUptime(bootTime));

	useEffect(() => {
		if (!isOpen) return;

		setUptime(formatUptime(bootTime));

		const interval = setInterval(() => {
			setUptime(formatUptime(bootTime));
		}, 60000);

		return () => clearInterval(interval);
	}, [isOpen, bootTime]);

	const handleClose = useCallback(() => {
		toggleAboutModal(false);
	}, [toggleAboutModal]);

	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				handleClose();
			}
		},
		[handleClose],
	);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, handleClose]);

	const springConfig = prefersReducedMotion
		? { duration: 0.1 }
		: { type: "spring" as const, stiffness: 400, damping: 30 };

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					onClick={handleBackdropClick}
					role="dialog"
					aria-modal="true"
					aria-labelledby="about-system-title"
				>
					<motion.div
						className="relative w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-8 shadow-2xl backdrop-blur-xl"
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.98, opacity: 0, y: 10 }}
						transition={springConfig}
					>
						<button
							type="button"
							onClick={handleClose}
							className="absolute top-3 right-3 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
							aria-label="Close modal"
						>
							<X size={16} />
						</button>

						<div className="flex flex-col items-center text-center">
							{/* CUSTOMIZE: Replace with your profile picture */}
							<div className="relative mb-4 size-20 overflow-hidden rounded-full border-2 border-white/20 shadow-lg">
								<Image
									src="/assets/profile_picture/pfp.svg"
									alt={`${PROFILE.name} profile`}
									fill
									className="object-cover"
									sizes="80px"
								/>
							</div>

							{/* CUSTOMIZE: Replace with your name */}
							<h2
								id="about-system-title"
								className="text-xl font-semibold tracking-tight text-white"
							>
								{PROFILE.name}
							</h2>

							{/* CUSTOMIZE: Replace with your role/title */}
							<p className="mt-1 font-mono text-sm text-white/60">{PROFILE.title}</p>

							<div className="my-6 h-px w-full bg-white/10" />

							<div className="w-full space-y-3">
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs text-white/40">Uptime</span>
									<span className="font-mono text-sm text-white/80">{uptime}</span>
								</div>

								{/* CUSTOMIZE: Update version number */}
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs text-white/40">Version</span>
									<span className="font-mono text-sm text-white/80">{OS_INFO.version}</span>
								</div>

								{/* CUSTOMIZE: Replace kernel name with your own */}
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs text-white/40">Kernel</span>
									<span className="font-mono text-sm text-white/80">{OS_INFO.kernel}</span>
								</div>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
});

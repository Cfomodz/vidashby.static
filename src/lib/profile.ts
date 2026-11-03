/**
 * vidashby profile content — single source of truth.
 *
 * Everything personal on the site (About app, terminal, browser, SEO entity)
 * reads from this file. Edit here first; the markdown documents in
 * /public/readmes hold the long-form versions opened from desktop folders.
 */

export const PROFILE = {
	name: "David Ashby",
	givenName: "David",
	familyName: "Ashby",
	handle: "Cfomodz",
	title: "Quality, Security & Automation Engineer",
	tagline: "hacker by nature, programmer by trade",
	lede: "Quality engineer, ISO 27001 & 27701 lead auditor, and open-source developer. I build automation that drives defects out of systems, whether that's code, a compliance program or a production line. My work is public on GitHub.",
	location: "Salt Lake City, UT",
	timezone: "MT (UTC-7)",
	email: "d@vidashby.com",
	phone: "801.857.9474",
	phoneHref: "tel:8018579474",
	github: "https://github.com/Cfomodz",
	linkedin: "https://www.linkedin.com/in/david-ashby/",
	n8n: "https://n8n.io/creators/",
	siteUrl: "https://vidashby.com",
	sourceUrl: "https://github.com/Cfomodz/vidashby.static",
	updated: "November 2026",
} as const;

// OS branding
export const OS_INFO = {
	name: "vidashbyOS",
	monogram: "DA",
	version: "1.0.0",
	kernel: "poka-yoke v9001",
	host: "vidashby",
} as const;

export interface Stat {
	value: string;
	label: string;
}

export const STATS: Stat[] = [
	{ value: "58", label: "public repositories" },
	{ value: "128", label: "GitHub followers" },
	{ value: "#1", label: "Verified n8n creator, 204 templates" },
	{ value: "10", label: "active certifications" },
];

export interface ProjectLink {
	label: string;
	href: string;
}

export interface FeaturedProject {
	slug: string;
	title: string;
	repo: string;
	repoMeta?: string;
	description: string;
	/** Image under /public, or null for a text thumbnail */
	image: string | null;
	/** Shown when image is null */
	thumbText?: string;
	highlight?: string;
	tags: string[];
	links: ProjectLink[];
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
	{
		slug: "n8n-workflows",
		title: "n8n Workflows: Automated Automation",
		repo: "Cfomodz/community-use",
		repoMeta: "★ 27 · 24 forks",
		description:
			"The #1 Verified Creator on n8n.io, with 204 workflow templates. I wrote Python that generates n8n workflows from API specs, then reverse-engineered the creator dashboard API so uploads ran automatically too. The paid workflows are free here for community use.",
		image: "/assets/projects/n8n.png",
		highlight: "164 sold · $5,389",
		tags: ["Python", "n8n", "API reverse engineering"],
		links: [
			{ label: "Repository", href: "https://github.com/Cfomodz/community-use" },
			{ label: "n8n profile", href: "https://n8n.io/creators/" },
		],
	},
	{
		slug: "browser-use",
		title: "Browser Use: AI Web Automation",
		repo: "browser-use/browser-use",
		repoMeta: "contributor",
		description:
			"Contributor to an open-source AI browser agent with 70k+ stars. I closed 50 issues in 48 hours and worked with the founders on security hardening, bot-detection bypass and keeping credentials out of LLM contexts.",
		image: "/assets/projects/browser.gif",
		highlight: "71.9k ★",
		tags: ["Python", "Playwright", "Security"],
		links: [
			{ label: "Repository", href: "https://github.com/browser-use/browser-use" },
			{ label: "Website", href: "https://browser-use.com/" },
		],
	},
	{
		slug: "obs-websocket-proxy",
		title: "Chrome WebSocket Proxy for OBS",
		repo: "Patch-Code-Prosperity/Chrome-WebSocket-Proxy-for-OBS",
		description:
			"A Chrome extension that watches a page's WebSocket traffic and forwards it to OBS. Paired with generative voice, it runs a fully automated livestream that reacts to browser events such as scores, votes and purchases.",
		image: "/assets/projects/OBS-WS.png",
		tags: ["JavaScript", "WebSocket", "Chrome extension"],
		links: [
			{
				label: "Repository",
				href: "https://github.com/Patch-Code-Prosperity/Chrome-WebSocket-Proxy-for-OBS",
			},
		],
	},
	{
		slug: "pythonic-schwab-api",
		title: "Pythonic Schwab API",
		repo: "Patch-Code-Prosperity/Pythonic-Schwab-API",
		description:
			"A Python wrapper for the Charles Schwab trading API. I released it publicly to help developers move over during the TD Ameritrade to Schwab migration.",
		image: "/assets/projects/schwabpy.png",
		tags: ["Python", "REST APIs", "Trading"],
		links: [
			{
				label: "Repository",
				href: "https://github.com/Patch-Code-Prosperity/Pythonic-Schwab-API",
			},
		],
	},
	{
		slug: "label-printing",
		title: "Event-Driven Label Printing",
		repo: "Cfomodz/Brother-QL-710W_Incrementing-Label-Creator",
		description:
			"Conditional printing for Brother QL label printers: when X happens, print a label carrying X's details. I've used it for incrementing inventory stickers, buyer tags and event badges.",
		image: "/assets/projects/labels.png",
		tags: ["Python", "Hardware", "Automation"],
		links: [
			{
				label: "Repository",
				href: "https://github.com/Cfomodz/Brother-QL-710W_Incrementing-Label-Creator",
			},
		],
	},
	{
		slug: "streamdrop",
		title: "StreamDrop: 24/7 Streaming on a $4 Server",
		repo: "Cfomodz/StreamDrop",
		repoMeta: "★ 7 · 5 forks",
		description:
			"Streams any website, PyGame app or local HTML file to YouTube around the clock from a cheap Ubuntu droplet.",
		image: null,
		thumbText: "$ streamdrop --target youtube --uptime 24/7",
		tags: ["Python", "YouTube Live", "Linux"],
		links: [{ label: "Repository", href: "https://github.com/Cfomodz/StreamDrop" }],
	},
];

export type RepoCategory = "security" | "automation" | "hardware" | "tools";

export const REPO_CATEGORIES: { id: RepoCategory | "all"; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "security", label: "Security & OSINT" },
	{ id: "automation", label: "Automation & streaming" },
	{ id: "hardware", label: "Hardware & operations" },
	{ id: "tools", label: "Tools & utilities" },
];

export interface RepoEntry {
	name: string;
	repo: string;
	description: string;
	meta: string;
	category: RepoCategory;
}

const gh = (repo: string) => `https://github.com/Cfomodz/${repo}`;

export const REPOS: RepoEntry[] = [
	{
		name: "spam-baiter",
		repo: gh("spam-baiter"),
		description: "A bot that fights back against spammers and scammers, sometimes using AI.",
		meta: "Python · ★ 6",
		category: "security",
	},
	{
		name: "browser-osint",
		repo: gh("browser-osint"),
		description: "Browser-driven open-source intelligence gathering.",
		meta: "Python",
		category: "security",
	},
	{
		name: "passcode-pattern-recognition",
		repo: gh("passcode-pattern-recognition"),
		description:
			"Educational proof of concept that infers 4-digit PINs from pin-pad movement patterns.",
		meta: "TypeScript",
		category: "security",
	},
	{
		name: "if-a-user-account-is-found",
		repo: gh("if-a-user-account-is-found"),
		description: "Checks whether an email has an account by reading password-reset responses.",
		meta: "Python",
		category: "security",
	},
	{
		name: "privacy-please",
		repo: gh("privacy-please"),
		description: "A two-sided, hotel-style door shim, with print files and vector artwork.",
		meta: "3D print",
		category: "security",
	},
	{
		name: "DTMF-tone-cleaner",
		repo: gh("Dual-Tone-Multi-Frequency-DTMF-tone-cleaner"),
		description: "Strips DTMF keypad tones out of call recordings.",
		meta: "Audio",
		category: "security",
	},
	{
		name: "Open-Demand-Letter",
		repo: gh("Open-Demand-Letter"),
		description: "Demand-letter templates for do-not-call and TCPA violations.",
		meta: "Templates",
		category: "security",
	},
	{
		name: "unity-livechat",
		repo: gh("unity-livechat"),
		description: "Twitch chat integration for Unity games.",
		meta: "C#",
		category: "automation",
	},
	{
		name: "Interactive-Livestream-Chaos-League",
		repo: gh("Interactive-Livestream-Chaos-League"),
		description: "A fork of an open-source interactive Twitch livestream game.",
		meta: "C# · ★ 2 · fork",
		category: "automation",
	},
	{
		name: "auto-browse-screen-recording",
		repo: gh("auto-browse-screen-recording-video-for-voiceover"),
		description: "Scripted browsing that records screen video, ready for a voiceover.",
		meta: "TypeScript",
		category: "automation",
	},
	{
		name: "Zoom-Video-Auto-Editor",
		repo: gh("Zoom-Video-Auto-Editor-for-vertical-video-participants"),
		description: "Automatically edits Zoom recordings into vertical, participant-focused video.",
		meta: "Python",
		category: "automation",
	},
	{
		name: "Sales-Goal-Thermometer",
		repo: gh("Sales-Goal-Thermometer"),
		description: "A live sales-goal thermometer that deploys as a serverless function.",
		meta: "TypeScript · ★ 1",
		category: "automation",
	},
	{
		name: "github-use",
		repo: gh("github-use"),
		description: "Keeps watch on other GitHub repositories.",
		meta: "Python",
		category: "automation",
	},
	{
		name: "object-scanning-frontend",
		repo: gh("object-scanning-frontend"),
		description: "A Flask and WebSocket app for semi-automated image and barcode capture.",
		meta: "JavaScript · ★ 1",
		category: "hardware",
	},
	{
		name: "accessibility-board",
		repo: gh("accessibility-board"),
		description: "A DIY, 3D-printable three-key macro keyboard.",
		meta: "HTML",
		category: "hardware",
	},
	{
		name: "dmarket_bot",
		repo: gh("dmarket_bot"),
		description: "An English translation of a DMarket trading bot, updated for the 2024 API.",
		meta: "Python · ★ 3",
		category: "tools",
	},
	{
		name: "audible-to-yoto",
		repo: gh("audible-to-yoto"),
		description: "Converts Audible audiobooks to Yoto format, split by chapter.",
		meta: "Python · ★ 3",
		category: "tools",
	},
	{
		name: "Plane-Eisenhower-Matrix-Wallpaper",
		repo: gh("Plane-Eisenhower-Matrix-Desktop-Wallpaper-for-KDE-Plasma"),
		description: "Draws Plane issues as an Eisenhower matrix on your KDE Plasma wallpaper.",
		meta: "Python · ★ 1",
		category: "tools",
	},
	{
		name: "Open-edX-Accessibility-Reader",
		repo: gh("Open-edX-Accessibility-Reader"),
		description: "A client-side reader and navigation aid for Open edX courses.",
		meta: "JavaScript",
		category: "tools",
	},
	{
		name: "Impossible-Invoice",
		repo: gh("Impossible-Invoice"),
		description: "Self-erasing, Mission: Impossible-style invoices that support rescheduling.",
		meta: "JavaScript · ★ 1",
		category: "tools",
	},
	{
		name: "FDG-ZUI",
		repo: gh("FDG-ZUI"),
		description: "A force-directed graph inside a zoomable interface.",
		meta: "HTML",
		category: "tools",
	},
	{
		name: "Walgreen-Photo-Library-Downloader",
		repo: gh("Walgreen-Photo-Library-Downloader"),
		description: "Bulk-downloads a Walgreens photo library.",
		meta: "JavaScript · ★ 1",
		category: "tools",
	},
];

export const ALL_REPOS_URL = "https://github.com/Cfomodz?tab=repositories";

export interface Certification {
	name: string;
	issuer: string;
	dates: string;
	credentialId?: string;
	expired?: string;
}

export interface CertGroup {
	slug: string;
	label: string;
	certs: Certification[];
}

export const CERT_GROUPS: CertGroup[] = [
	{
		slug: "audit-compliance",
		label: "Audit & compliance",
		certs: [
			{
				name: "ISO/IEC 27001:2022 Lead Auditor",
				issuer: "Mastermind",
				dates: "Sep 2026 – Sep 2029",
				credentialId: "c4pfewfprz",
			},
			{
				name: "ISO/IEC 27701:2025 Lead Auditor",
				issuer: "Mastermind",
				dates: "Sep 2026 – Sep 2029",
				credentialId: "u0hi549mnf",
			},
			{
				name: "Certified ISO 9001:2015 Lead Auditor Trained",
				issuer: "Perry Johnson Registrars",
				dates: "Sep 2026 – Sep 2031",
				credentialId: "210724262",
			},
			{
				name: "Greenhouse Gas Accounting for IT",
				issuer: "Cisco Networking Academy",
				dates: "Sep 2026",
				credentialId: "8a0f94a7-0e17-412a-92b0-c159096efcca",
			},
		],
	},
	{
		slug: "quality-process",
		label: "Quality & process",
		certs: [
			{
				name: "Six Sigma Lean Green Belt Certified (LGBC)",
				issuer: "Management & Strategy Institute",
				dates: "Jan 2026",
				credentialId: "305360089",
			},
			{
				name: "Six Sigma Lean Professional (SSLP)",
				issuer: "Management & Strategy Institute",
				dates: "Jan 2026",
				credentialId: "305336944",
			},
			{
				name: "Certification in Error Proofing Techniques",
				issuer: "Management & Strategy Institute",
				dates: "Jan 2026",
				credentialId: "351870014",
			},
		],
	},
	{
		slug: "security-it",
		label: "Security & IT",
		certs: [
			{ name: "CompTIA Security+", issuer: "CompTIA", dates: "Nov 2024 – Nov 2027" },
			{ name: "Computer Programmer", issuer: "Brigham Young University–Idaho", dates: "Dec 2020" },
			{
				name: "Certified PC Pro",
				issuer: "TestOut Corporation",
				dates: "Dec 2020",
				credentialId: "6-U6-3QJB, 6-2C6-6K38G",
			},
			{
				name: "FAA Small Unmanned Aircraft System (Part 107)",
				issuer: "Federal Aviation Administration",
				dates: "Sep 2020",
				expired: "expired Jan 2021",
			},
		],
	},
];

export interface EducationEntry {
	name: string;
	school: string;
	dates: string;
}

export const EDUCATION: EducationEntry[] = [
	{
		name: "Certificate, Computer Programming",
		school: "Brigham Young University–Idaho",
		dates: "2017 – 2020",
	},
	{
		name: "Logistics, Materials & Supply Chain Management",
		school: "BYU Marriott School of Business",
		dates: "2017",
	},
];

export interface ExperienceEntry {
	when: string;
	role: string;
	org: string;
	description: string;
	current?: boolean;
}

export const EXPERIENCE: ExperienceEntry[] = [
	{
		when: "Mar 2026 – present",
		role: "Quality Engineer",
		org: "Quality Electrical Systems",
		current: true,
		description:
			"Bringing AI into the physical world and automating data intelligence to drive defects out of systems.",
	},
	{
		when: "Mar 2025 – Mar 2026",
		role: "AI Automation Workflow Creator",
		org: "n8n",
		description:
			"Ranked among n8n's top Verified Creators, with the most workflow templates published on the platform.",
	},
	{
		when: "Feb 2025 – Aug 2025",
		role: "Web Automation Engineer & Developer",
		org: "Browser Use",
		description:
			"Worked with the founders on security and reliability. I triaged security reports, managed the Discord community and issue tracker, wrote Python bot-detection bypasses and contributed code that keeps credentials confidential in LLM contexts.",
	},
	{
		when: "Jan 2025 – Aug 2025",
		role: "Artificial Intelligence Engineer",
		org: "METR",
		description:
			"Built AI-assisted workflows with secure coding practices, so automated outputs added no vulnerabilities or regulatory risk.",
	},
	{
		when: "Jan 2021 – Apr 2024",
		role: "Software Developer, previously IT Support Specialist",
		org: "Hughes Real Estate Group",
		description:
			"Automated internal processes, built tools for programmatic compliance analysis and reporting, and secured web apps and back-end systems. Also maintained Linux servers, domain controllers and Ubiquiti networks.",
	},
	{
		when: "Oct 2020 – Aug 2022",
		role: "Operations & Marketing Consultant",
		org: "SureSite LLC",
		description:
			"Automated manufacturing systems and tightened compliance in data-driven marketing.",
	},
	{
		when: "2017 – present",
		role: "Open Source Developer",
		org: "GitHub",
		current: true,
		description:
			"Years of public work with hundreds of forks, stars and follows. Projects span algorithmic trading, scam detection, data-in-use protection and physical bypass tooling.",
	},
	{
		when: "Aug 2017 – Sep 2020",
		role: "Founder",
		org: "BisTreck",
		description: "Built productivity tools for clients, with secure handling of their data.",
	},
];

export interface SkillGroup {
	label: string;
	skills: string[];
}

export const SKILLS: SkillGroup[] = [
	{
		label: "Quality & compliance",
		skills: [
			"ISO 27001 / 27701 / 9001 auditing",
			"Lean Six Sigma",
			"Error proofing",
			"Root cause analysis",
			"GDPR",
		],
	},
	{
		label: "Security",
		skills: [
			"Reverse engineering",
			"API security",
			"Web app security",
			"OSINT",
			"Social engineering",
			"NFC / RFID",
			"Physical security",
		],
	},
	{
		label: "Development",
		skills: ["Python", "JavaScript / TypeScript", "SQL", "Flask", "REST APIs", "Playwright", "n8n"],
	},
	{
		label: "Tools & infrastructure",
		skills: [
			"Burp Suite",
			"Wireshark",
			"Kali Linux",
			"Docker",
			"Linux admin",
			"Active Directory",
			"AWS / GCP",
		],
	},
	{
		label: "Hardware",
		skills: ["Raspberry Pi", "Arduino", "3D printing", "Laser engraving", "HID devices"],
	},
];

export interface Highlight {
	title: string;
	detail: string;
}

export const HIGHLIGHTS: Highlight[] = [
	{
		title: "YC Agents Hackathon Judge",
		detail:
			"Aug 2025: judged AI-driven security automation entries and gave teams technical feedback.",
	},
	{
		title: "550,000+ content views in 90 days",
		detail:
			"300k+ YouTube Shorts views and 250k+ TikTok views, with distribution handled by automation.",
	},
	{
		title: "4,700+ items sold on Whatnot",
		detail:
			"Reached 10,000+ followers using AI-powered sourcing automation, which funded a first home.",
	},
	{
		title: "DEF CON, multiple years",
		detail: "Hundreds of hours of training on exploits, system architectures and protocols.",
	},
];

export interface Community {
	name: string;
	badge: string;
	description: string;
	href: string;
	cta: string;
	featured?: boolean;
}

export const COMMUNITIES: Community[] = [
	{
		name: "(n8n) Nodes Automation Lab",
		badge: "Free · 500+ members",
		description:
			"Learn automation principles, collaborate with other builders and use a shared workflow library.",
		href: "https://www.skool.com/n8n-nodes-automation-lab-1570",
		cta: "Join the community",
		featured: true,
	},
	{
		name: "Beyond Nodes Automation Lab",
		badge: "Paid · ~100 members",
		description: "Learn to earn with n8n and AI automation.",
		href: "https://www.skool.com/beyond-nodes-automation-lab-2006",
		cta: "Learn more",
	},
];

/** Open an external link from inside a draggable window (framer-drag can swallow <a> clicks). */
export function openExternal(e: { preventDefault: () => void }, href: string): void {
	if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
	e.preventDefault();
	window.open(href, "_blank", "noopener,noreferrer");
}

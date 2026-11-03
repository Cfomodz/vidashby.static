// Only allows same-origin images and data URIs

export type ImageValidationResult = { allowed: true } | { allowed: false; reason: string };

export function validateImageSource(
	src: string | undefined,
	currentOrigin: string,
): ImageValidationResult {
	if (!src || typeof src !== "string") {
		return { allowed: false, reason: "No image source provided" };
	}

	const trimmedSrc = src.trim();

	if (trimmedSrc === "") {
		return { allowed: false, reason: "Empty image source" };
	}

	// Allow data URIs for base64 embedded images
	if (isDataUri(trimmedSrc)) {
		return validateDataUri(trimmedSrc);
	}

	// Check for dangerous protocols
	const protocolCheck = checkDangerousProtocol(trimmedSrc);
	if (!protocolCheck.allowed) {
		return protocolCheck;
	}

	// Allow relative paths (same-origin by definition)
	if (isRelativePath(trimmedSrc)) {
		return { allowed: true };
	}

	// For absolute URLs, validate origin and protocol
	return validateAbsoluteUrl(trimmedSrc, currentOrigin);
}

function isDataUri(src: string): boolean {
	return src.toLowerCase().startsWith("data:");
}

function validateDataUri(src: string): ImageValidationResult {
	const dataUriPattern = /^data:image\/[a-zA-Z0-9.+-]+(?:;[a-zA-Z0-9=]+)*(?:;base64)?,/i;

	if (dataUriPattern.test(src)) {
		return { allowed: true };
	}

	return {
		allowed: false,
		reason: "Data URI must be an image type (data:image/*)",
	};
}

function checkDangerousProtocol(src: string): ImageValidationResult {
	const lowerSrc = src.toLowerCase();

	const dangerousProtocols = ["javascript:", "vbscript:", "data:text/html", "data:application/"];

	for (const protocol of dangerousProtocols) {
		if (lowerSrc.startsWith(protocol)) {
			return {
				allowed: false,
				reason: `Dangerous protocol not allowed: ${protocol}`,
			};
		}
	}

	return { allowed: true };
}

function isRelativePath(src: string): boolean {
	// Relative paths start with:
	// - "./" (current directory)
	// - "../" (parent directory)
	// - "/" (root-relative)
	// - alphanumeric (implicit relative)

	// But NOT protocol-relative URLs starting with "//"
	if (src.startsWith("//")) {
		return false;
	}

	// Check for absolute URL patterns
	const absoluteUrlPattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
	return !absoluteUrlPattern.test(src);
}

function validateAbsoluteUrl(src: string, currentOrigin: string): ImageValidationResult {
	let url: URL;

	try {
		// Handle protocol-relative URLs
		if (src.startsWith("//")) {
			url = new URL(`https:${src}`);
		} else {
			url = new URL(src);
		}
	} catch {
		// If URL parsing fails, treat as invalid
		return {
			allowed: false,
			reason: "Invalid URL format",
		};
	}

	// Block HTTP (non-secure) URLs to prevent mixed content
	if (url.protocol === "http:") {
		return {
			allowed: false,
			reason: "HTTP images blocked (use HTTPS)",
		};
	}

	// Only allow HTTPS
	if (url.protocol !== "https:") {
		return {
			allowed: false,
			reason: `Protocol not allowed: ${url.protocol}`,
		};
	}

	// Check if the URL is same-origin
	if (url.origin === currentOrigin) {
		return { allowed: true };
	}

	// External domain - blocked
	return {
		allowed: false,
		reason: "External images are not allowed",
	};
}

export function isImageAllowed(src: string | undefined, currentOrigin: string): boolean {
	return validateImageSource(src, currentOrigin).allowed;
}

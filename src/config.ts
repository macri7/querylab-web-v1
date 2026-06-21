// Lonetrail — site config loaded from YAML
// Edit src/site.yml to customize your site.
import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";
import { makeUrl } from "./utils/url-utils";
import yaml from "./site.yml";

const cfg = yaml as {
	site: {
		title: string;
		subtitle: string;
		url: string;
		lang: string;
		author: string;
		email: string;
		favicon: string;
		banner: string;
		og_image: string;
	};
	profile: {
		avatar: string;
		name: string;
		bio: string;
		links: { name: string; icon: string; url: string }[];
	};
	nav: Record<string, string>[];
	features: {
		breadcrumb: boolean;
		comments: boolean;
		search: boolean;
		donate: boolean;
		rss_feed: boolean;
		sitemap: boolean;
		related_posts: boolean;
		series: boolean;
		license: boolean;
	};
	seo: {
		enable_json_ld: boolean;
		breadcrumb: boolean;
		keywords: string;
		same_as: string[];
	};
	services: {
		posthog: { api_key: string; api_host: string };
		webmention: { url: string };
		blogsclub: { badge_url: string };
		issue_tracker: { url: string };
	};
	trusted_domains: string[];
	copyright: {
		text: string;
		site_name: string;
		license: string;
		license_url: string;
	};
};

export const siteConfig: SiteConfig = {
	title: cfg.site.title,
	subtitle: cfg.site.subtitle,
	url: cfg.site.url,
	lang: cfg.site.lang as SiteConfig["lang"],
	banner: {
		enable: true,
		src: cfg.site.banner,
		position: "center",
		credit: { enable: false, text: "", url: "" },
	},
	toc: { enable: true, depth: 3 },
	showPageViews: false,
	favicon: [{ src: cfg.site.favicon, sizes: "32x32" }],
};

function normalizeSiteUrl(url: string): string {
	if (!url) return url;
	if (/^https?:\/\//.test(url) || /^\/\//.test(url)) {
		return url;
	}
	if (url.startsWith("/")) {
		return makeUrl(url);
	}
	return url;
}

export const navBarConfig: NavBarConfig = {
	links: cfg.nav.map((item) => {
		const [name, url] = Object.entries(item)[0];
		return { name, url: normalizeSiteUrl(url) };
	}),
};

export const profileConfig: ProfileConfig = {
	avatar: normalizeSiteUrl(cfg.profile.avatar),
	name: cfg.profile.name,
	bio: cfg.profile.bio,
	links: cfg.profile.links.map((link) => ({
		name: link.name,
		icon: link.icon,
		url: normalizeSiteUrl(link.url),
	})),
};

export const licenseConfig: LicenseConfig = {
	enable: cfg.features.license,
	name: cfg.copyright.license,
	url: cfg.copyright.license_url,
};

export const copyrightConfig = {
	enable: false,
	siteName: cfg.copyright.site_name || cfg.site.title,
	startYear: 2025,
	endYear: 2026,
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};

// Template-wide exports for YAML-driven injection
export const siteYaml = cfg;

import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightDocSearch from "@astrojs/starlight-docsearch";
import starlightImageZoom from "starlight-image-zoom";
import liveCode from "astro-live-code";
import starlightLinksValidator from "starlight-links-validator";
import starlightScrollToTop from "starlight-scroll-to-top";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

import { readdir } from "fs/promises";
import { fileURLToPath } from "url";

import remarkValidateImages from "./src/plugins/remark/validate-images";

import rehypeTitleFigure from "rehype-title-figure";
import rehypeMermaid from "./src/plugins/rehype/mermaid.ts";
import rehypeAutolinkHeadings from "./src/plugins/rehype/autolink-headings.ts";
import rehypeExternalLinks from "./src/plugins/rehype/external-links.ts";
import rehypeHeadingSlugs from "./src/plugins/rehype/heading-slugs.ts";
import rehypeShiftHeadings from "./src/plugins/rehype/shift-headings.ts";
import { createSitemapLastmodSerializer } from "./sitemap.serializer.ts";

import skills from "astro-skills";

async function autogenSections() {
	const sections = (
		await readdir("./src/content/docs/", {
			withFileTypes: true,
		})
	)
		.filter((x) => x.isDirectory())
		.map((x) => x.name)
		.sort(); // Сортируем для предсказуемого порядка
	
	// Маппинг названий разделов
	const labelMap: Record<string, string> = {
		"adquest-widget": "AdQuest Widget",
		"crm": "AdQuest CRM",
	};
	
	// Определяем порядок разделов
	const sectionOrder = ["adquest-widget", "crm"];
	
	// Сортируем секции по заданному порядку
	const sortedSections = sections.sort((a, b) => {
		const indexA = sectionOrder.indexOf(a);
		const indexB = sectionOrder.indexOf(b);
		
		// Если оба в списке, сортируем по порядку
		if (indexA !== -1 && indexB !== -1) {
			return indexA - indexB;
		}
		// Если только один в списке, он идет первым
		if (indexA !== -1) return -1;
		if (indexB !== -1) return 1;
		// Иначе алфавитный порядок
		return a.localeCompare(b);
	});
	
	return sortedSections.map((x) => {
		return {
			label: labelMap[x] || x,
			autogenerate: {
				directory: x,
				collapsed: false, // Все разделы развернуты
			},
		};
	});
}

async function autogenStyles() {
	const styles = (
		await readdir("./src/styles/", {
			withFileTypes: true,
			recursive: true,
		})
	)
		.filter((x) => x.isFile())
		.map((x) => x.parentPath + x.name)
		.sort((a) => (a === "./src/styles/tailwind.css" ? -1 : 1));

	return styles;
}

const sidebar = await autogenSections();
const customCss = await autogenStyles();

const RUN_LINK_CHECK =
	process.env.RUN_LINK_CHECK?.toLowerCase() === "true" || false;

// https://astro.build/config
export default defineConfig({
	site: "https://ad-quest.ru",
	markdown: {
		smartypants: false,
		remarkPlugins: [remarkValidateImages],
		rehypePlugins: [
			rehypeMermaid,
			rehypeExternalLinks,
			rehypeHeadingSlugs,
			rehypeAutolinkHeadings,
			// @ts-expect-error plugins types are outdated but functional
			rehypeTitleFigure,
			rehypeShiftHeadings,
		],
	},
	image: {
		service: {
			entrypoint: "astro/assets/services/sharp",
			config: {
				limitInputPixels: false,
			},
		},
	},
	experimental: {
		contentIntellisense: true,
	},
	server: {
		port: 1111,
	},
	preview: {
		host: true,
		allowedHosts: ["docs.ad-quest.ru"],
	},
	integrations: [
		starlight({
			title: "AdQuest",
			logo: {
				light: "~/assets/logo_dark.svg",
				dark: "~/assets/logo_white.svg",
				replacesTitle: true,
			},
			favicon: "/favicon.png",
			defaultLocale: "root",
			locales: {
				root: {
					label: "Русский",
					lang: "ru",
				},
			},
			social: [
				{
					label: "GitHub",
					icon: "github",
					href: "https://github.com/adquest",
				},
			],
			editLink: undefined, // Отключаем кнопку "Редактировать страницу"
			components: {
				Banner: "./src/components/overrides/Banner.astro",
				Footer: "./src/components/overrides/Footer.astro",
				Head: "./src/components/overrides/Head.astro",
				Header: "./src/components/overrides/Header.astro",
				Hero: "./src/components/overrides/Hero.astro",
				MarkdownContent: "./src/components/overrides/MarkdownContent.astro",
				Sidebar: "./src/components/overrides/Sidebar.astro",
				PageTitle: "./src/components/overrides/PageTitle.astro",
				TableOfContents: "./src/components/overrides/TableOfContents.astro",
			},
			sidebar,
			customCss,
			pagination: false,
			plugins: [
				...(RUN_LINK_CHECK
					? [
							starlightLinksValidator({
								errorOnInvalidHashes: false,
								errorOnLocalLinks: false,
								exclude: [
									"/api/",
									"/api/**",
									"/changelog/**",
									"/http/resources/**",
									"/llms.txt",
									"/llms-full.txt",
									"{props.*}",
									"/",
									"/glossary/",
									"/directory/",
									"/rules/snippets/examples/?operation=*",
									"/rules/transform/examples/?operation=*",
									"/ruleset-engine/rules-language/fields/reference/**",
									"/workers/examples/?languages=*",
									"/workers/examples/?tags=*",
									"/workers/llms-full.txt",
									"/workers-ai/models/**",
									"**index.md",
									"/markdown.zip",
									"/style-guide/index.md",
									"/style-guide/fixtures/markdown/index.md",
								],
							}),
						]
					: []),
				starlightDocSearch({
					clientOptionsModule: "./src/plugins/docsearch/index.ts",
				}),
				starlightImageZoom(),
				starlightScrollToTop({
					tooltipText: "Наверх",
					showTooltip: true,
					svgPath: "M12 6L6 12M12 6L18 12M12 12L6 18M12 12L18 18",
					showProgressRing: true,
					progressRingColor: "white",
					showOnHomepage: false,
				}),
			],
			lastUpdated: true,
			markdown: {
				headingLinks: false,
			},
			routeMiddleware: "./src/plugins/starlight/route-data.ts",
			disable404Route: true,
		}),
		liveCode({}),
		icon({
			include: {
				mdi: ["*"], // Material Design Icons
			},
		}),
		sitemap({
			filter(page) {
				if (page.includes("/style-guide/")) {
					return false;
				}

				if (page.endsWith("/404/")) {
					return false;
				}

				return true;
			},
			serialize: createSitemapLastmodSerializer(),
		}),
		react(),
		skills(),
	],
	vite: {
		resolve: {
			alias: {
				"./Page.astro": fileURLToPath(
					new URL("./src/components/overrides/Page.astro", import.meta.url),
				),
				"../components/Page.astro": fileURLToPath(
					new URL("./src/components/overrides/Page.astro", import.meta.url),
				),
			},
		},
	},
});

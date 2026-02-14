// @ts-check
import { defineEcConfig } from "astro-expressive-code";

import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

export default defineEcConfig({
	plugins: [
		pluginCollapsibleSections(),
		pluginLineNumbers(),
	],
	defaultProps: {
		showLineNumbers: false,
	},
	themes: ['github-dark', 'github-light'],
	styleOverrides: {
		borderWidth: "1px",
		borderRadius: "0.25rem",
		textMarkers: {
			defaultLuminance: ["32%", "88%"],
		},
	},
	frames: {
		extractFileNameFromCode: false,
	},
	shiki: {
		langAlias: {
			curl: "sh",
		},
	},
});

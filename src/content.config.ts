import { defineCollection } from "astro:content";
import { docsLoader, i18nLoader } from "@astrojs/starlight/loaders";
import { docsSchema, i18nSchema } from "@astrojs/starlight/schema";
import { skillsLoader } from "astro-skills";
import { glob } from "astro/loaders";
import { baseSchema } from "~/schemas";

function dataLoader(name: string) {
	return glob({
		pattern: "**/*.(json|yml|yaml)",
		base: "./src/content/" + name,
	});
}

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: baseSchema,
		}),
	}),
	i18n: defineCollection({
		loader: i18nLoader(),
		schema: i18nSchema(),
	}),
	directory: defineCollection({
		loader: dataLoader("directory"),
	}),
	skills: defineCollection({
		loader: skillsLoader({ base: "./skills" }),
	}),
};

import { getCollection } from "astro:content";

let directory: Awaited<ReturnType<typeof getCollection<"directory">>> = [];

try {
	directory = await getCollection("directory");
} catch (error) {
	console.warn("Directory collection not found or empty");
}

export { directory };

export const directoryByGroup = Object.entries(
	directory
		.filter((entry) => Boolean(entry.data.entry.group))
		.reduce(
			(groups, entry) => {
				const primaryGroup = entry.data.entry.group;
				const additionalGroups = entry.data.entry.additional_groups ?? [];
				const allGroups = [primaryGroup, ...additionalGroups];

				for (const group of allGroups) {
					if (!groups[group]) {
						groups[group] = [];
					}
					groups[group].push(entry);
				}

				return groups;
			},
			{} as Record<string, typeof directory>,
		),
);

export const groups = [
	...new Set(
		directory.flatMap((entry) =>
			[
				entry.data.entry.group,
				...(entry.data.entry.additional_groups ?? []),
			].filter(Boolean),
		),
	),
].sort();

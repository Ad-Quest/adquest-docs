// Starlight built-ins (includes Tabs, TabItem, and other core components)
export * from "@astrojs/starlight/components";
export { Icon as StarlightIcon } from "@astrojs/starlight/components";

// Community packages
export { Icon as AstroIcon } from "astro-icon/components";

// Custom components - only those actually used in documentation
export { default as Details } from "./Details.astro";
export { default as InlineBadge } from "./InlineBadge.astro";
export { default as LinkTitleCard } from "./LinkTitleCard.astro";
export { default as TypeScriptExample } from "./TypeScriptExample.astro";

// Additional components that exist and may be useful
export { default as CopyPageButton } from "./CopyPageButton.tsx";
export { default as DirectoryCatalog } from "./DirectoryCatalog.tsx";
export { Dismissible, Dismisser, useDismissible } from "./Dismissible.tsx";
export { default as FeedbackPrompt } from "./FeedbackPrompt.tsx";
export { default as FourCardGrid } from "./FourCardGrid.astro";
export { default as HeaderDropdowns } from "./HeaderDropdowns.tsx";
export { default as ReactSelect } from "./ReactSelect.tsx";
export { default as SubtractIPCalculator } from "./SubtractIPCalculator.tsx";

// Taken from Astro
export { default as ListCard } from "./astro/ListCard.astro";

// Search
export { default as InstantSearch } from "./search/InstantSearch.tsx";

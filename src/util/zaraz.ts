export function track(eventName: string, properties?: Record<string, unknown>): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		if (typeof (window as any).zaraz !== "undefined") {
			(window as any).zaraz.track(eventName, properties);
		}
	} catch (error) {
		console.error("Zaraz tracking error:", error);
	}
}

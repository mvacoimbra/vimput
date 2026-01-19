import { create } from "zustand";

export type Theme = "dark" | "light" | "system";

export interface ConfigState {
	theme: Theme;
	fontSize: number;
	setTheme: (theme: Theme) => void;
	setFontSize: (size: number) => void;
	loadFromStorage: () => Promise<void>;
	saveToStorage: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
	theme: "dark",
	fontSize: 14,

	setTheme: (theme: Theme) => {
		set({ theme });
		get().saveToStorage();
	},

	setFontSize: (size: number) => {
		set({ fontSize: size });
		get().saveToStorage();
	},

	loadFromStorage: async () => {
		try {
			const result = await browser.storage.sync.get(["theme", "fontSize"]);
			set({
				theme: (result.theme as Theme) || "dark",
				fontSize: result.fontSize || 14,
			});
		} catch (error) {
			console.error("Failed to load config from storage:", error);
		}
	},

	saveToStorage: async () => {
		try {
			const { theme, fontSize } = get();
			await browser.storage.sync.set({ theme, fontSize });
		} catch (error) {
			console.error("Failed to save config to storage:", error);
		}
	},
}));

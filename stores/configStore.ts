import { create } from "zustand";
import {
	type Theme,
	type ThemeColors,
	defaultDarkTheme,
	getThemeById,
} from "@/lib/themes";

export interface ConfigState {
	themeId: string;
	customColors: Partial<ThemeColors>;
	fontSize: number;
	openOnClick: boolean;
	syntaxLanguage: string;
	setThemeId: (themeId: string) => void;
	setCustomColors: (colors: Partial<ThemeColors>) => void;
	resetCustomColors: () => void;
	setFontSize: (size: number) => void;
	setOpenOnClick: (enabled: boolean) => void;
	setSyntaxLanguage: (language: string) => void;
	getActiveTheme: () => Theme;
	loadFromStorage: () => Promise<void>;
	saveToStorage: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
	themeId: "default-dark",
	customColors: {},
	fontSize: 14,
	openOnClick: false,
	syntaxLanguage: "plaintext",

	setThemeId: (themeId: string) => {
		set({ themeId, customColors: {} });
		get().saveToStorage();
	},

	setCustomColors: (colors: Partial<ThemeColors>) => {
		set({ customColors: colors });
		get().saveToStorage();
	},

	resetCustomColors: () => {
		set({ customColors: {} });
		get().saveToStorage();
	},

	setFontSize: (size: number) => {
		set({ fontSize: size });
		get().saveToStorage();
	},

	setOpenOnClick: (enabled: boolean) => {
		set({ openOnClick: enabled });
		get().saveToStorage();
	},

	setSyntaxLanguage: (language: string) => {
		set({ syntaxLanguage: language });
		get().saveToStorage();
	},

	getActiveTheme: () => {
		const { themeId, customColors } = get();
		const baseTheme = getThemeById(themeId) || defaultDarkTheme;

		if (Object.keys(customColors).length === 0) {
			return baseTheme;
		}

		return {
			...baseTheme,
			id: "custom",
			name: `${baseTheme.name} (Custom)`,
			colors: {
				...baseTheme.colors,
				...customColors,
			},
		};
	},

	loadFromStorage: async () => {
		try {
			const result = await browser.storage.sync.get([
				"themeId",
				"customColors",
				"fontSize",
				"openOnClick",
				"syntaxLanguage",
			]);
			set({
				themeId: (result.themeId as string) || "default-dark",
				customColors: (result.customColors as Partial<ThemeColors>) || {},
				fontSize: (result.fontSize as number) || 14,
				openOnClick: (result.openOnClick as boolean) ?? false,
				syntaxLanguage: (result.syntaxLanguage as string) || "plaintext",
			});
		} catch (error) {
			console.error("Failed to load config from storage:", error);
		}
	},

	saveToStorage: async () => {
		try {
			const { themeId, customColors, fontSize, openOnClick, syntaxLanguage } = get();
			await browser.storage.sync.set({
				themeId,
				customColors,
				fontSize,
				openOnClick,
				syntaxLanguage,
			});
		} catch (error) {
			console.error("Failed to save config to storage:", error);
		}
	},
}));

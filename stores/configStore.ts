import { create } from "zustand";
import {
	defaultDarkTheme,
	getThemeById,
	type Theme,
	type ThemeColors,
} from "@/lib/themes";

export type IndentType = "tabs" | "spaces";
export type IndentSize = 2 | 4 | 8;

export interface ConfigState {
	themeId: string;
	customColors: Partial<ThemeColors>;
	fontSize: number;
	openOnClick: boolean;
	enterToSaveAndExit: boolean;
	confirmOnBackdropClick: boolean;
	syntaxLanguage: string;
	indentType: IndentType;
	indentSize: IndentSize;
	setThemeId: (themeId: string) => void;
	setCustomColors: (colors: Partial<ThemeColors>) => void;
	resetCustomColors: () => void;
	setFontSize: (size: number) => void;
	setOpenOnClick: (enabled: boolean) => void;
	setEnterToSaveAndExit: (enabled: boolean) => void;
	setConfirmOnBackdropClick: (enabled: boolean) => void;
	setSyntaxLanguage: (language: string) => void;
	setIndentType: (type: IndentType) => void;
	setIndentSize: (size: IndentSize) => void;
	getActiveTheme: () => Theme;
	loadFromStorage: () => Promise<void>;
	saveToStorage: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
	themeId: "default-dark",
	customColors: {},
	fontSize: 14,
	openOnClick: false,
	enterToSaveAndExit: true,
	confirmOnBackdropClick: false,
	syntaxLanguage: "plaintext",
	indentType: "spaces",
	indentSize: 2,

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

	setEnterToSaveAndExit: (enabled: boolean) => {
		set({ enterToSaveAndExit: enabled });
		get().saveToStorage();
	},

	setConfirmOnBackdropClick: (enabled: boolean) => {
		set({ confirmOnBackdropClick: enabled });
		get().saveToStorage();
	},

	setSyntaxLanguage: (language: string) => {
		set({ syntaxLanguage: language });
		get().saveToStorage();
	},

	setIndentType: (type: IndentType) => {
		set({ indentType: type });
		get().saveToStorage();
	},

	setIndentSize: (size: IndentSize) => {
		set({ indentSize: size });
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
				"enterToSaveAndExit",
				"confirmOnBackdropClick",
				"syntaxLanguage",
				"indentType",
				"indentSize",
			]);
			set({
				themeId: (result.themeId as string) || "default-dark",
				customColors: (result.customColors as Partial<ThemeColors>) || {},
				fontSize: (result.fontSize as number) || 14,
				openOnClick: (result.openOnClick as boolean) ?? false,
				enterToSaveAndExit: (result.enterToSaveAndExit as boolean) ?? true,
				confirmOnBackdropClick:
					(result.confirmOnBackdropClick as boolean) ?? false,
				syntaxLanguage: (result.syntaxLanguage as string) || "plaintext",
				indentType: (result.indentType as IndentType) || "spaces",
				indentSize: (result.indentSize as IndentSize) || 2,
			});
		} catch (error) {
			console.error("Failed to load config from storage:", error);
		}
	},

	saveToStorage: async () => {
		try {
			const {
				themeId,
				customColors,
				fontSize,
				openOnClick,
				enterToSaveAndExit,
				confirmOnBackdropClick,
				syntaxLanguage,
				indentType,
				indentSize,
			} = get();
			await browser.storage.sync.set({
				themeId,
				customColors,
				fontSize,
				openOnClick,
				enterToSaveAndExit,
				confirmOnBackdropClick,
				syntaxLanguage,
				indentType,
				indentSize,
			});
		} catch (error) {
			console.error("Failed to save config to storage:", error);
		}
	},
}));

export interface ThemeColors {
	// Editor container
	background: string;
	border: string;

	// Header/Status bar
	headerBackground: string;
	headerText: string;
	headerMutedText: string;

	// Editor content
	editorBackground: string;
	editorText: string;

	// Line numbers
	lineNumberBackground: string;
	lineNumberText: string;
	lineNumberBorder: string;

	// Cursor
	cursorBackground: string;
	cursorText: string;
	cursorInsertBorder: string;

	// Visual selection
	visualSelection: string;

	// Status bar
	statusBackground: string;
	statusText: string;
	commandText: string;

	// Buttons
	buttonHover: string;
	closeButtonHover: string;
}

export interface Theme {
	id: string;
	name: string;
	baseTheme: "dark" | "light";
	colors: ThemeColors;
}

export const defaultDarkTheme: Theme = {
	id: "default-dark",
	name: "Default Dark",
	baseTheme: "dark",
	colors: {
		background: "#18181b", // zinc-900
		border: "#3f3f46", // zinc-700
		headerBackground: "#27272a", // zinc-800
		headerText: "#f4f4f5", // zinc-100
		headerMutedText: "#71717a", // zinc-500
		editorBackground: "#09090b", // zinc-950
		editorText: "#f4f4f5", // zinc-100
		lineNumberBackground: "#18181b", // zinc-900
		lineNumberText: "#71717a", // zinc-500
		lineNumberBorder: "#3f3f46", // zinc-700
		cursorBackground: "#f4f4f5", // zinc-100
		cursorText: "#18181b", // zinc-900
		cursorInsertBorder: "#f4f4f5", // zinc-100
		visualSelection: "rgba(168, 85, 247, 0.4)", // purple-500/40
		statusBackground: "#27272a", // zinc-800
		statusText: "#d4d4d8", // zinc-300
		commandText: "#eab308", // yellow-500
		buttonHover: "#3f3f46", // zinc-700
		closeButtonHover: "#ef4444", // red-500
	},
};

export const defaultLightTheme: Theme = {
	id: "default-light",
	name: "Default Light",
	baseTheme: "light",
	colors: {
		background: "#ffffff", // white
		border: "#d4d4d8", // zinc-300
		headerBackground: "#f4f4f5", // zinc-100
		headerText: "#18181b", // zinc-900
		headerMutedText: "#a1a1aa", // zinc-400
		editorBackground: "#fafafa", // zinc-50
		editorText: "#18181b", // zinc-900
		lineNumberBackground: "#f4f4f5", // zinc-100
		lineNumberText: "#a1a1aa", // zinc-400
		lineNumberBorder: "#d4d4d8", // zinc-300
		cursorBackground: "#27272a", // zinc-800
		cursorText: "#f4f4f5", // zinc-100
		cursorInsertBorder: "#27272a", // zinc-800
		visualSelection: "rgba(168, 85, 247, 0.4)", // purple-500/40
		statusBackground: "#f4f4f5", // zinc-100
		statusText: "#3f3f46", // zinc-700
		commandText: "#ca8a04", // yellow-600
		buttonHover: "#e4e4e7", // zinc-200
		closeButtonHover: "#ef4444", // red-500
	},
};

export const monokaiTheme: Theme = {
	id: "monokai",
	name: "Monokai",
	baseTheme: "dark",
	colors: {
		background: "#272822",
		border: "#49483e",
		headerBackground: "#1e1f1c",
		headerText: "#f8f8f2",
		headerMutedText: "#75715e",
		editorBackground: "#272822",
		editorText: "#f8f8f2",
		lineNumberBackground: "#1e1f1c",
		lineNumberText: "#75715e",
		lineNumberBorder: "#49483e",
		cursorBackground: "#f8f8f2",
		cursorText: "#272822",
		cursorInsertBorder: "#f92672",
		visualSelection: "rgba(73, 72, 62, 0.8)",
		statusBackground: "#1e1f1c",
		statusText: "#a6e22e",
		commandText: "#e6db74",
		buttonHover: "#49483e",
		closeButtonHover: "#f92672",
	},
};

export const draculaTheme: Theme = {
	id: "dracula",
	name: "Dracula",
	baseTheme: "dark",
	colors: {
		background: "#282a36",
		border: "#44475a",
		headerBackground: "#21222c",
		headerText: "#f8f8f2",
		headerMutedText: "#6272a4",
		editorBackground: "#282a36",
		editorText: "#f8f8f2",
		lineNumberBackground: "#21222c",
		lineNumberText: "#6272a4",
		lineNumberBorder: "#44475a",
		cursorBackground: "#f8f8f2",
		cursorText: "#282a36",
		cursorInsertBorder: "#ff79c6",
		visualSelection: "rgba(68, 71, 90, 0.8)",
		statusBackground: "#21222c",
		statusText: "#bd93f9",
		commandText: "#f1fa8c",
		buttonHover: "#44475a",
		closeButtonHover: "#ff5555",
	},
};

export const nordTheme: Theme = {
	id: "nord",
	name: "Nord",
	baseTheme: "dark",
	colors: {
		background: "#2e3440",
		border: "#3b4252",
		headerBackground: "#242933",
		headerText: "#eceff4",
		headerMutedText: "#4c566a",
		editorBackground: "#2e3440",
		editorText: "#eceff4",
		lineNumberBackground: "#242933",
		lineNumberText: "#4c566a",
		lineNumberBorder: "#3b4252",
		cursorBackground: "#eceff4",
		cursorText: "#2e3440",
		cursorInsertBorder: "#88c0d0",
		visualSelection: "rgba(67, 76, 94, 0.8)",
		statusBackground: "#242933",
		statusText: "#81a1c1",
		commandText: "#ebcb8b",
		buttonHover: "#3b4252",
		closeButtonHover: "#bf616a",
	},
};

export const gruvboxTheme: Theme = {
	id: "gruvbox",
	name: "Gruvbox",
	baseTheme: "dark",
	colors: {
		background: "#282828",
		border: "#3c3836",
		headerBackground: "#1d2021",
		headerText: "#ebdbb2",
		headerMutedText: "#a89984",
		editorBackground: "#282828",
		editorText: "#ebdbb2",
		lineNumberBackground: "#1d2021",
		lineNumberText: "#7c6f64",
		lineNumberBorder: "#3c3836",
		cursorBackground: "#ebdbb2",
		cursorText: "#282828",
		cursorInsertBorder: "#fe8019",
		visualSelection: "rgba(69, 133, 136, 0.5)",
		statusBackground: "#1d2021",
		statusText: "#b8bb26",
		commandText: "#fabd2f",
		buttonHover: "#504945",
		closeButtonHover: "#fb4934",
	},
};

export const builtInThemes: Theme[] = [
	defaultDarkTheme,
	defaultLightTheme,
	monokaiTheme,
	draculaTheme,
	nordTheme,
	gruvboxTheme,
];

export function getThemeById(id: string): Theme | undefined {
	return builtInThemes.find((t) => t.id === id);
}

export function createCustomTheme(
	baseTheme: Theme,
	customColors: Partial<ThemeColors>,
	name?: string,
): Theme {
	return {
		id: "custom",
		name: name || "Custom",
		baseTheme: baseTheme.baseTheme,
		colors: {
			...baseTheme.colors,
			...customColors,
		},
	};
}

export function themeColorsToCSS(colors: ThemeColors): Record<string, string> {
	return {
		"--vimput-background": colors.background,
		"--vimput-border": colors.border,
		"--vimput-header-bg": colors.headerBackground,
		"--vimput-header-text": colors.headerText,
		"--vimput-header-muted": colors.headerMutedText,
		"--vimput-editor-bg": colors.editorBackground,
		"--vimput-editor-text": colors.editorText,
		"--vimput-line-number-bg": colors.lineNumberBackground,
		"--vimput-line-number-text": colors.lineNumberText,
		"--vimput-line-number-border": colors.lineNumberBorder,
		"--vimput-cursor-bg": colors.cursorBackground,
		"--vimput-cursor-text": colors.cursorText,
		"--vimput-cursor-insert-border": colors.cursorInsertBorder,
		"--vimput-visual-selection": colors.visualSelection,
		"--vimput-status-bg": colors.statusBackground,
		"--vimput-status-text": colors.statusText,
		"--vimput-command-text": colors.commandText,
		"--vimput-button-hover": colors.buttonHover,
		"--vimput-close-button-hover": colors.closeButtonHover,
	};
}

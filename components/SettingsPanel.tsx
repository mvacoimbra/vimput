import {
	CheckCircle,
	CornerDownLeft,
	Download,
	HelpCircle,
	IndentIncrease,
	MessageCircleWarning,
	MousePointerClick,
	RefreshCw,
	RotateCcw,
	Sparkles,
	Type,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	checkWorkerStatus,
	getWorkerDownloadUrl,
	type WorkerStatus,
} from "@/lib/formatter";
import { builtInThemes, getThemeById, type ThemeColors } from "@/lib/themes";
import { useConfigStore } from "@/stores/configStore";

interface KeybindItem {
	keys: string[];
	description: string;
}

interface KeybindCategory {
	title: string;
	items: KeybindItem[];
}

const keybindCategories: KeybindCategory[] = [
	{
		title: "Mode Switching",
		items: [
			{ keys: ["i"], description: "Insert mode (before cursor)" },
			{ keys: ["a"], description: "Insert mode (after cursor)" },
			{ keys: ["I"], description: "Insert at line start" },
			{ keys: ["A"], description: "Insert at line end" },
			{ keys: ["o"], description: "Open line below" },
			{ keys: ["O"], description: "Open line above" },
			{ keys: ["v"], description: "Visual mode" },
			{ keys: ["V"], description: "Visual line mode" },
			{ keys: [":"], description: "Command mode" },
			{ keys: ["Esc"], description: "Back to Normal mode" },
		],
	},
	{
		title: "Navigation",
		items: [
			{ keys: ["h", "←"], description: "Move left" },
			{ keys: ["j", "↓"], description: "Move down" },
			{ keys: ["k", "↑"], description: "Move up" },
			{ keys: ["l", "→"], description: "Move right" },
			{ keys: ["w"], description: "Next word" },
			{ keys: ["e"], description: "End of word" },
			{ keys: ["b"], description: "Previous word" },
			{ keys: ["0"], description: "Start of line" },
			{ keys: ["$"], description: "End of line" },
			{ keys: ["gg"], description: "First line" },
			{ keys: ["G"], description: "Last line" },
			{ keys: ["{"], description: "Previous paragraph" },
			{ keys: ["}"], description: "Next paragraph" },
		],
	},
	{
		title: "Editing",
		items: [
			{ keys: ["x"], description: "Delete character" },
			{ keys: ["r"], description: "Replace character" },
			{ keys: ["dd"], description: "Delete line" },
			{ keys: ["cc"], description: "Change line" },
			{ keys: ["cw"], description: "Change word" },
			{ keys: ["ce"], description: "Change to end of word" },
			{ keys: ["c$"], description: "Change to end of line" },
			{ keys: ["c0"], description: "Change to line start" },
		],
	},
	{
		title: "Text Objects",
		items: [
			{ keys: ["ciw"], description: "Change inner word" },
			{ keys: ["ci("], description: "Change inside parentheses" },
			{ keys: ["ci{"], description: "Change inside braces" },
			{ keys: ["ci["], description: "Change inside brackets" },
			{ keys: ['ci"'], description: "Change inside double quotes" },
			{ keys: ["ci'"], description: "Change inside single quotes" },
			{ keys: ["ca("], description: "Change around parentheses" },
		],
	},
	{
		title: "Yank & Paste",
		items: [
			{ keys: ["yy"], description: "Yank (copy) line" },
			{ keys: ["y"], description: "Yank selection (visual)" },
			{ keys: ["p"], description: "Paste after" },
			{ keys: ["P"], description: "Paste before" },
			{ keys: ["d"], description: "Delete selection (visual)" },
		],
	},
	{
		title: "Commands",
		items: [
			{ keys: [":w"], description: "Save changes" },
			{ keys: [":q"], description: "Quit/Close editor" },
			{ keys: [":wq"], description: "Save and quit" },
			{ keys: [":q!"], description: "Quit without saving" },
		],
	},
];

const colorLabels: Record<keyof ThemeColors, string> = {
	background: "Background",
	border: "Border",
	headerBackground: "Header Background",
	headerText: "Header Text",
	headerMutedText: "Header Muted Text",
	editorBackground: "Editor Background",
	editorText: "Editor Text",
	lineNumberBackground: "Line Number Background",
	lineNumberText: "Line Number Text",
	lineNumberBorder: "Line Number Border",
	cursorBackground: "Cursor Background",
	cursorText: "Cursor Text",
	cursorInsertBorder: "Cursor Insert Border",
	visualSelection: "Visual Selection",
	statusBackground: "Status Bar Background",
	statusText: "Status Bar Text",
	commandText: "Command Text",
	buttonHover: "Button Hover",
	closeButtonHover: "Close Button Hover",
};

export function SettingsPanel() {
	const {
		themeId,
		customColors,
		fontSize,
		openOnClick,
		enterToSaveAndExit,
		confirmOnBackdropClick,
		indentType,
		indentSize,
		formatterEnabled,
		setThemeId,
		setCustomColors,
		resetCustomColors,
		setFontSize,
		setOpenOnClick,
		setEnterToSaveAndExit,
		setConfirmOnBackdropClick,
		setIndentType,
		setIndentSize,
		setFormatterEnabled,
		loadFromStorage,
	} = useConfigStore();

	const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
	const [checkingWorker, setCheckingWorker] = useState(false);

	useEffect(() => {
		loadFromStorage();
	}, [loadFromStorage]);

	const refreshWorkerStatus = useCallback(async () => {
		setCheckingWorker(true);
		try {
			const status = await checkWorkerStatus();
			setWorkerStatus(status);
		} finally {
			setCheckingWorker(false);
		}
	}, []);

	useEffect(() => {
		if (formatterEnabled) {
			refreshWorkerStatus();
		}
	}, [formatterEnabled, refreshWorkerStatus]);

	const handleDownloadScript = useCallback(() => {
		const url = getWorkerDownloadUrl();
		const a = document.createElement("a");
		a.href = url;
		a.download = "vimput-formatter.py";
		a.click();
	}, []);

	const currentTheme = getThemeById(themeId);
	const hasCustomColors = Object.keys(customColors).length > 0;

	const colors = useMemo(() => {
		if (!currentTheme) return null;
		return {
			...currentTheme.colors,
			...customColors,
		};
	}, [currentTheme, customColors]);

	const handleColorChange = (key: keyof ThemeColors, value: string) => {
		setCustomColors({ ...customColors, [key]: value });
	};

	const getColorValue = (key: keyof ThemeColors): string => {
		return customColors[key] || currentTheme?.colors[key] || "";
	};

	const inputStyle: React.CSSProperties = {
		backgroundColor: colors?.editorBackground,
		borderColor: colors?.border,
		color: colors?.editorText,
	};

	const tabTriggerStyle: React.CSSProperties = {
		color: colors?.headerMutedText,
	};

	const tabTriggerActiveStyle: React.CSSProperties = {
		backgroundColor: colors?.headerBackground,
		color: colors?.headerText,
	};

	return (
		<Tabs defaultValue="theme" className="w-full">
			<TabsList
				className="grid w-full grid-cols-4"
				style={{ backgroundColor: colors?.lineNumberBackground }}
			>
				<TabsTrigger
					value="theme"
					style={tabTriggerStyle}
					className="data-[state=active]:shadow-none"
					data-style-active={JSON.stringify(tabTriggerActiveStyle)}
				>
					Theme
				</TabsTrigger>
				<TabsTrigger
					value="editor"
					style={tabTriggerStyle}
					className="data-[state=active]:shadow-none"
				>
					Editor
				</TabsTrigger>
				<TabsTrigger
					value="misc"
					style={tabTriggerStyle}
					className="data-[state=active]:shadow-none"
				>
					Misc
				</TabsTrigger>
				<TabsTrigger
					value="help"
					style={tabTriggerStyle}
					className="data-[state=active]:shadow-none"
				>
					<HelpCircle className="h-3 w-3 mr-1" />
					Help
				</TabsTrigger>
			</TabsList>

			{/* Theme Tab */}
			<TabsContent value="theme" className="space-y-4 mt-4">
				<div className="space-y-2">
					<Label style={{ color: colors?.headerText }}>Theme</Label>
					<select
						id="theme"
						value={themeId}
						onChange={(e) => setThemeId(e.target.value)}
						className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
						style={inputStyle}
					>
						{builtInThemes.map((theme) => (
							<option
								key={theme.id}
								value={theme.id}
								style={{
									backgroundColor: colors?.editorBackground,
									color: colors?.editorText,
								}}
							>
								{theme.name}
							</option>
						))}
					</select>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label style={{ color: colors?.headerText }}>Custom Colors</Label>
						{hasCustomColors && (
							<Button
								variant="ghost"
								size="sm"
								onClick={resetCustomColors}
								className="h-7 px-2 text-xs"
								style={{ color: colors?.statusText }}
							>
								<RotateCcw className="h-3 w-3 mr-1" />
								Reset
							</Button>
						)}
					</div>
					<div
						className="h-48 rounded-md border p-3 overflow-y-auto"
						style={{
							borderColor: colors?.border,
							backgroundColor: colors?.lineNumberBackground,
						}}
					>
						<div className="space-y-3">
							{(Object.keys(colorLabels) as (keyof ThemeColors)[]).map(
								(key) => (
									<div key={key} className="flex items-center gap-2">
										<div
											className="w-5 h-5 rounded flex-shrink-0"
											style={{
												backgroundColor: getColorValue(key),
												borderWidth: "1px",
												borderStyle: "solid",
												borderColor: colors?.border,
											}}
										/>
										<Label
											className="text-xs flex-1 min-w-0 truncate"
											style={{ color: colors?.headerMutedText }}
										>
											{colorLabels[key]}
										</Label>
										<input
											type="text"
											value={customColors[key] || ""}
											onChange={(e) => handleColorChange(key, e.target.value)}
											placeholder={currentTheme?.colors[key]}
											className="h-7 w-20 text-xs font-mono rounded-md border px-2"
											style={inputStyle}
										/>
									</div>
								),
							)}
						</div>
					</div>
				</div>
			</TabsContent>

			{/* Editor Tab */}
			<TabsContent value="editor" className="space-y-4 mt-4">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Type
								className="h-4 w-4"
								style={{ color: colors?.headerMutedText }}
							/>
							<Label style={{ color: colors?.headerText }}>Font Size</Label>
						</div>
						<span
							className="text-sm"
							style={{ color: colors?.headerMutedText }}
						>
							{fontSize}px
						</span>
					</div>
					<Slider
						value={[fontSize]}
						onValueChange={([value]) => setFontSize(value)}
						min={10}
						max={24}
						step={1}
						className="w-full"
						trackStyle={{ backgroundColor: colors?.lineNumberBackground }}
						rangeStyle={{ backgroundColor: colors?.statusText }}
						thumbStyle={{
							backgroundColor: colors?.background,
							borderColor: colors?.statusText,
						}}
					/>
					<div
						className="flex justify-between text-xs"
						style={{ color: colors?.headerMutedText }}
					>
						<span>10px</span>
						<span>24px</span>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<IndentIncrease
							className="h-4 w-4"
							style={{ color: colors?.headerMutedText }}
						/>
						<Label style={{ color: colors?.headerText }}>Indentation</Label>
					</div>
					<div className="flex gap-3">
						<select
							value={indentType}
							onChange={(e) =>
								setIndentType(e.target.value as "tabs" | "spaces")
							}
							className="flex h-9 flex-1 items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
							style={inputStyle}
						>
							<option
								value="spaces"
								style={{
									backgroundColor: colors?.editorBackground,
									color: colors?.editorText,
								}}
							>
								Spaces
							</option>
							<option
								value="tabs"
								style={{
									backgroundColor: colors?.editorBackground,
									color: colors?.editorText,
								}}
							>
								Tab
							</option>
						</select>
						{indentType === "spaces" && (
							<select
								value={indentSize}
								onChange={(e) =>
									setIndentSize(Number(e.target.value) as 2 | 4 | 8)
								}
								className="flex h-9 w-20 items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
								style={inputStyle}
							>
								<option
									value={2}
									style={{
										backgroundColor: colors?.editorBackground,
										color: colors?.editorText,
									}}
								>
									2
								</option>
								<option
									value={4}
									style={{
										backgroundColor: colors?.editorBackground,
										color: colors?.editorText,
									}}
								>
									4
								</option>
								<option
									value={8}
									style={{
										backgroundColor: colors?.editorBackground,
										color: colors?.editorText,
									}}
								>
									8
								</option>
							</select>
						)}
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Sparkles
								className="h-4 w-4"
								style={{ color: colors?.headerMutedText }}
							/>
							<div className="space-y-0.5">
								<Label style={{ color: colors?.headerText }}>
									Code Formatter
								</Label>
								<p
									className="text-xs"
									style={{ color: colors?.headerMutedText }}
								>
									Format code with :fmt or Space+c+f
								</p>
							</div>
						</div>
						<Switch
							checked={formatterEnabled}
							onCheckedChange={setFormatterEnabled}
							style={
								{
									"--switch-bg": formatterEnabled
										? colors?.statusText
										: colors?.lineNumberBackground,
									backgroundColor: formatterEnabled
										? colors?.statusText
										: colors?.lineNumberBackground,
									borderColor: colors?.border,
								} as React.CSSProperties
							}
						/>
					</div>
					{formatterEnabled && (
						<div
							className="rounded-md p-3 text-xs space-y-3"
							style={{
								backgroundColor: colors?.lineNumberBackground,
								color: colors?.headerMutedText,
								borderWidth: "1px",
								borderStyle: "solid",
								borderColor: colors?.border,
							}}
						>
							{/* Worker Status */}
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{workerStatus?.available ? (
										<CheckCircle
											className="h-4 w-4"
											style={{ color: "#22c55e" }}
										/>
									) : (
										<XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
									)}
									<span style={{ color: colors?.headerText }}>
										{workerStatus?.available
											? "Worker connected"
											: "Worker not running"}
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={refreshWorkerStatus}
									disabled={checkingWorker}
									className="h-6 px-2"
									style={{ color: colors?.statusText }}
								>
									<RefreshCw
										className={`h-3 w-3 ${checkingWorker ? "animate-spin" : ""}`}
									/>
								</Button>
							</div>

							{/* Available formatters */}
							{workerStatus?.available &&
								Object.keys(workerStatus.formatters).length > 0 && (
									<div>
										<span style={{ color: colors?.headerMutedText }}>
											Available:{" "}
										</span>
										<span style={{ color: colors?.headerText }}>
											{Object.entries(workerStatus.formatters)
												.map(([lang, cmd]) => `${lang} (${cmd})`)
												.join(", ")}
										</span>
									</div>
								)}

							{/* Download and instructions */}
							{!workerStatus?.available && (
								<div className="space-y-2">
									<p>
										Download the script and run it to enable formatting.
									</p>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={handleDownloadScript}
											className="h-7 text-xs"
											style={{
												borderColor: colors?.border,
												color: colors?.headerText,
												backgroundColor: colors?.editorBackground,
											}}
										>
											<Download className="h-3 w-3 mr-1" />
											Download Script
										</Button>
									</div>
									<div
										className="rounded p-2 text-xs space-y-2"
										style={{
											backgroundColor: colors?.editorBackground,
											color: colors?.editorText,
										}}
									>
										<div>
											<span style={{ color: colors?.headerMutedText }}>
												Linux/macOS:{" "}
											</span>
											<code className="font-mono">
												python3 vimput-formatter.py
											</code>
										</div>
										<div>
											<span style={{ color: colors?.headerMutedText }}>
												Windows:{" "}
											</span>
											<code className="font-mono">
												python vimput-formatter.py
											</code>
										</div>
									</div>
									<p style={{ color: colors?.headerMutedText }}>
										Requires Python 3.8+. Dependencies install automatically.
									</p>
								</div>
							)}

							{/* Privacy notice */}
							<p>
								<strong style={{ color: colors?.headerText }}>Privacy:</strong>{" "}
								The worker runs 100% locally. Your code never leaves your
								machine.
							</p>
						</div>
					)}
				</div>
			</TabsContent>

			{/* Misc Tab */}
			<TabsContent value="misc" className="space-y-4 mt-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MousePointerClick
							className="h-4 w-4"
							style={{ color: colors?.headerMutedText }}
						/>
						<div className="space-y-0.5">
							<Label
								htmlFor="open-on-click"
								style={{ color: colors?.headerText }}
							>
								Open on Click
							</Label>
							<p className="text-xs" style={{ color: colors?.headerMutedText }}>
								Open the editor when clicking on an input
							</p>
						</div>
					</div>
					<Switch
						id="open-on-click"
						checked={openOnClick}
						onCheckedChange={setOpenOnClick}
						style={
							{
								"--switch-bg": openOnClick
									? colors?.statusText
									: colors?.lineNumberBackground,
								backgroundColor: openOnClick
									? colors?.statusText
									: colors?.lineNumberBackground,
								borderColor: colors?.border,
							} as React.CSSProperties
						}
					/>
				</div>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CornerDownLeft
							className="h-4 w-4"
							style={{ color: colors?.headerMutedText }}
						/>
						<div className="space-y-0.5">
							<Label
								htmlFor="enter-to-save"
								style={{ color: colors?.headerText }}
							>
								Enter to Save & Exit
							</Label>
							<p className="text-xs" style={{ color: colors?.headerMutedText }}>
								Press Enter in Normal mode to save and close
							</p>
						</div>
					</div>
					<Switch
						id="enter-to-save"
						checked={enterToSaveAndExit}
						onCheckedChange={setEnterToSaveAndExit}
						style={
							{
								"--switch-bg": enterToSaveAndExit
									? colors?.statusText
									: colors?.lineNumberBackground,
								backgroundColor: enterToSaveAndExit
									? colors?.statusText
									: colors?.lineNumberBackground,
								borderColor: colors?.border,
							} as React.CSSProperties
						}
					/>
				</div>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<MessageCircleWarning
							className="h-4 w-4"
							style={{ color: colors?.headerMutedText }}
						/>
						<div className="space-y-0.5">
							<Label
								htmlFor="confirm-backdrop"
								style={{ color: colors?.headerText }}
							>
								Confirm on Backdrop Click
							</Label>
							<p className="text-xs" style={{ color: colors?.headerMutedText }}>
								Show confirmation when clicking outside the editor
							</p>
						</div>
					</div>
					<Switch
						id="confirm-backdrop"
						checked={confirmOnBackdropClick}
						onCheckedChange={setConfirmOnBackdropClick}
						style={
							{
								"--switch-bg": confirmOnBackdropClick
									? colors?.statusText
									: colors?.lineNumberBackground,
								backgroundColor: confirmOnBackdropClick
									? colors?.statusText
									: colors?.lineNumberBackground,
								borderColor: colors?.border,
							} as React.CSSProperties
						}
					/>
				</div>
			</TabsContent>

			{/* Help Tab */}
			<TabsContent value="help" className="mt-4">
				<div
					className="h-64 rounded-md border overflow-y-auto"
					style={{
						borderColor: colors?.border,
						backgroundColor: colors?.lineNumberBackground,
					}}
				>
					<div className="p-3 space-y-4">
						{keybindCategories.map((category) => (
							<div key={category.title} className="space-y-2">
								<h3
									className="text-xs font-semibold uppercase tracking-wide sticky top-0 py-1"
									style={{
										color: colors?.statusText,
										backgroundColor: colors?.lineNumberBackground,
									}}
								>
									{category.title}
								</h3>
								<div className="space-y-1.5">
									{category.items.map((item) => (
										<div
											key={item.keys.join("-")}
											className="flex items-center justify-between gap-2"
										>
											<span
												className="text-xs"
												style={{ color: colors?.headerMutedText }}
											>
												{item.description}
											</span>
											<div className="flex items-center gap-1 flex-shrink-0">
												{item.keys.map((key, index) => (
													<span key={key} className="flex items-center gap-1">
														{index > 0 && (
															<span
																className="text-xs"
																style={{ color: colors?.headerMutedText }}
															>
																/
															</span>
														)}
														<Kbd
															style={{
																backgroundColor: colors?.editorBackground,
																color: colors?.editorText,
																borderColor: colors?.border,
																borderWidth: "1px",
																borderStyle: "solid",
															}}
														>
															{key}
														</Kbd>
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</TabsContent>
		</Tabs>
	);
}

export default SettingsPanel;

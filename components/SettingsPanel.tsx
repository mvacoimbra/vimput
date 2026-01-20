import { MousePointerClick, RotateCcw, Type } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ThemeColors, builtInThemes, getThemeById } from "@/lib/themes";
import { useConfigStore } from "@/stores/configStore";

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
		setThemeId,
		setCustomColors,
		resetCustomColors,
		setFontSize,
		setOpenOnClick,
		loadFromStorage,
	} = useConfigStore();

	useEffect(() => {
		loadFromStorage();
	}, [loadFromStorage]);

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
				className="grid w-full grid-cols-3"
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
						<span className="text-sm" style={{ color: colors?.headerMutedText }}>
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
			</TabsContent>
		</Tabs>
	);
}

export default SettingsPanel;

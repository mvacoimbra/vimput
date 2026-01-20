import { Keyboard, Terminal } from "lucide-react";
import { useEffect, useMemo } from "react";
import { BuyMeCoffee } from "@/components/BuyMeCoffee";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getThemeById } from "@/lib/themes";
import { useConfigStore } from "@/stores/configStore";

function App() {
	const { themeId, customColors, loadFromStorage } = useConfigStore();

	useEffect(() => {
		loadFromStorage();
	}, [loadFromStorage]);

	const activeTheme = useMemo(() => {
		const baseTheme = getThemeById(themeId);
		if (!baseTheme) return null;

		return {
			...baseTheme,
			colors: {
				...baseTheme.colors,
				...customColors,
			},
		};
	}, [themeId, customColors]);

	useEffect(() => {
		// Apply theme to document based on baseTheme
		const baseTheme = activeTheme?.baseTheme || "dark";

		if (baseTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [activeTheme]);

	const colors = activeTheme?.colors;

	return (
		<div
			className="w-[360px]"
			style={{
				backgroundColor: colors?.background,
				color: colors?.editorText,
			}}
		>
			{/* Header */}
			<div
				className="px-4 py-4"
				style={{
					backgroundColor: colors?.headerBackground,
					borderBottomWidth: "1px",
					borderBottomStyle: "solid",
					borderBottomColor: colors?.border,
				}}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div
							className="flex items-center justify-center w-10 h-10 rounded-lg"
							style={{ backgroundColor: `${colors?.statusText}20` }}
						>
							<Terminal
								className="h-6 w-6"
								style={{ color: colors?.statusText }}
							/>
						</div>
						<div>
							<h1
								className="text-xl font-bold tracking-tight"
								style={{ color: colors?.headerText }}
							>
								Vimput
							</h1>
							<p className="text-xs" style={{ color: colors?.headerMutedText }}>
								Vim-powered input editing
							</p>
						</div>
					</div>
					<Badge
						variant="secondary"
						className="text-xs"
						style={{
							backgroundColor: colors?.buttonHover,
							color: colors?.statusText,
						}}
					>
						v1.0.0
					</Badge>
				</div>
			</div>

			{/* Quick Tips */}
			<div
				className="px-4 py-3"
				style={{
					backgroundColor: colors?.lineNumberBackground,
					borderBottomWidth: "1px",
					borderBottomStyle: "solid",
					borderBottomColor: colors?.border,
				}}
			>
				<div className="flex items-start gap-2">
					<Keyboard
						className="h-4 w-4 mt-0.5"
						style={{ color: colors?.headerMutedText }}
					/>
					<div className="text-xs" style={{ color: colors?.headerMutedText }}>
						<p
							className="font-medium mb-1"
							style={{ color: colors?.headerText }}
						>
							How to use
						</p>
						<p>
							Right-click on any text input and select "Edit with Vimput" to
							open the editor.
						</p>
					</div>
				</div>
			</div>

			{/* Settings */}
			<div className="p-2">
				<SettingsPanel />
			</div>

			<Separator style={{ backgroundColor: colors?.border }} />

			{/* Footer with Buy Me a Coffee */}
			<div className="p-4 space-y-3">
				<div className="text-center">
					<p
						className="text-xs mb-3"
						style={{ color: colors?.headerMutedText }}
					>
						Enjoying Vimput? Support the development!
					</p>
					<BuyMeCoffee username="mvacoimbra" />
				</div>

				<div
					className="text-center text-xs pt-2"
					style={{ color: colors?.headerMutedText }}
				>
					<p>
						Made with <span className="text-red-500">♥</span> for Vim
						enthusiasts
					</p>
				</div>
			</div>
		</div>
	);
}

export default App;

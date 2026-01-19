import { Palette, Settings, Type } from "lucide-react";
import { useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { type Theme, useConfigStore } from "@/stores/configStore";

export function SettingsPanel() {
	const { theme, fontSize, setTheme, setFontSize, loadFromStorage } =
		useConfigStore();

	useEffect(() => {
		loadFromStorage();
	}, [loadFromStorage]);

	return (
		<Card className="border-0 shadow-none">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Settings className="h-5 w-5" />
					Settings
				</CardTitle>
				<CardDescription>
					Customize your Vimput editor experience
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Theme Setting */}
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Palette className="h-4 w-4 text-muted-foreground" />
						<Label htmlFor="theme">Theme</Label>
					</div>
					<Select
						value={theme}
						onValueChange={(value: Theme) => setTheme(value)}
					>
						<SelectTrigger id="theme">
							<SelectValue placeholder="Select theme" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="dark">Dark</SelectItem>
							<SelectItem value="light">Light</SelectItem>
							<SelectItem value="system">System</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Separator />

				{/* Font Size Setting */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Type className="h-4 w-4 text-muted-foreground" />
							<Label>Font Size</Label>
						</div>
						<span className="text-sm text-muted-foreground">{fontSize}px</span>
					</div>
					<Slider
						value={[fontSize]}
						onValueChange={([value]) => setFontSize(value)}
						min={10}
						max={24}
						step={1}
						className="w-full"
					/>
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>10px</span>
						<span>24px</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default SettingsPanel;

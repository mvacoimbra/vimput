import { Save, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	createInitialState,
	getModeDisplay,
	processKey,
	type VimMode,
	type VimState,
} from "@/lib/vimEngine";

interface VimputEditorProps {
	initialText: string;
	onSave: (text: string) => void;
	onClose: () => void;
	fontSize?: number;
	theme?: "dark" | "light";
}

export function VimputEditor({
	initialText,
	onSave,
	onClose,
	fontSize = 14,
	theme = "dark",
}: VimputEditorProps) {
	const [vimState, setVimState] = useState<VimState>(() =>
		createInitialState(initialText),
	);
	const editorRef = useRef<HTMLDivElement>(null);
	const _textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Allow some browser shortcuts
			if (e.metaKey || e.ctrlKey) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			let key = e.key;

			// Handle special keys
			if (key === "Tab") {
				key = "\t";
			}

			const prevCommand = vimState.commandBuffer;
			const newState = processKey(vimState, key);
			setVimState(newState);

			// Handle special commands
			if (prevCommand === ":w" || prevCommand === ":wq") {
				if (key === "Enter" || (prevCommand + key).endsWith("w")) {
					// Check if it's a write command
				}
			}

			// Check for command execution
			if (vimState.mode === "command" && key === "Enter") {
				const command = vimState.commandBuffer.slice(1);
				if (command === "w" || command === "wq") {
					onSave(newState.text);
					if (command === "wq") {
						onClose();
					}
				} else if (command === "q" || command === "q!") {
					onClose();
				}
			}
		},
		[vimState, onSave, onClose],
	);

	useEffect(() => {
		const editor = editorRef.current;
		if (editor) {
			editor.focus();
		}

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

	const lines = vimState.text.split("\n");
	const lineNumbers = lines.map((_, i) => i + 1);

	const getModeColor = (mode: VimMode): string => {
		switch (mode) {
			case "normal":
				return "bg-blue-600";
			case "insert":
				return "bg-green-600";
			case "visual":
				return "bg-purple-600";
			case "command":
				return "bg-yellow-600";
		}
	};

	const isDark = theme === "dark";

	return (
		<Card
			ref={editorRef}
			tabIndex={0}
			className={cn(
				"w-full max-w-3xl shadow-2xl border-2",
				isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300",
			)}
		>
			<CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b border-zinc-700">
				<CardTitle
					className={cn(
						"text-lg font-mono",
						isDark ? "text-zinc-100" : "text-zinc-900",
					)}
				>
					Vimput Editor
				</CardTitle>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							onSave(vimState.text);
						}}
						className="h-8"
					>
						<Save className="h-4 w-4 mr-1" />
						Save
					</Button>
					<Button variant="ghost" size="sm" onClick={onClose} className="h-8">
						<X className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<div
					className={cn(
						"font-mono overflow-auto",
						isDark ? "bg-zinc-950" : "bg-zinc-50",
					)}
					style={{ fontSize: `${fontSize}px`, lineHeight: "1.5" }}
				>
					<div className="flex min-h-[300px] max-h-[500px]">
						{/* Line numbers */}
						<div
							className={cn(
								"flex-shrink-0 text-right pr-3 pl-2 select-none border-r",
								isDark
									? "text-zinc-500 bg-zinc-900 border-zinc-700"
									: "text-zinc-400 bg-zinc-100 border-zinc-300",
							)}
						>
							{lineNumbers.map((num) => (
								<div key={num} style={{ lineHeight: "1.5em" }}>
									{num}
								</div>
							))}
						</div>

						{/* Editor content */}
						<div className="flex-1 pl-3 pr-4 py-1 relative">
							{lines.map((line, lineIndex) => (
								<div
									key={lineIndex}
									className="whitespace-pre"
									style={{ lineHeight: "1.5em" }}
								>
									{line.split("").map((char, charIndex) => {
										const isCursor =
											lineIndex === vimState.cursor.line &&
											charIndex === vimState.cursor.column;

										const isVisualSelected =
											vimState.mode === "visual" &&
											vimState.visualStart &&
											isInVisualSelection(
												lineIndex,
												charIndex,
												vimState.visualStart,
												vimState.cursor,
											);

										return (
											<span
												key={charIndex}
												className={cn(
													isCursor && vimState.mode === "insert"
														? "border-l-2 border-green-500"
														: isCursor
															? isDark
																? "bg-zinc-100 text-zinc-900"
																: "bg-zinc-900 text-zinc-100"
															: "",
													isVisualSelected && "bg-purple-500/40",
												)}
											>
												{char}
											</span>
										);
									})}
									{/* Cursor at end of line or empty line */}
									{(line.length === 0 ||
										(lineIndex === vimState.cursor.line &&
											vimState.cursor.column >= line.length)) &&
										lineIndex === vimState.cursor.line && (
											<span
												className={cn(
													vimState.mode === "insert"
														? "border-l-2 border-green-500"
														: isDark
															? "bg-zinc-100"
															: "bg-zinc-900",
													"inline-block w-2",
												)}
											>
												&nbsp;
											</span>
										)}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Status bar */}
				<div
					className={cn(
						"flex items-center justify-between px-3 py-1 border-t font-mono text-sm",
						isDark
							? "bg-zinc-800 border-zinc-700 text-zinc-300"
							: "bg-zinc-100 border-zinc-300 text-zinc-700",
					)}
				>
					<div className="flex items-center gap-3">
						<Badge
							className={cn(
								getModeColor(vimState.mode),
								"text-white uppercase text-xs",
							)}
						>
							{vimState.mode}
						</Badge>
						{vimState.mode === "command" ? (
							<span className="text-yellow-500">{vimState.commandBuffer}</span>
						) : (
							<span>{getModeDisplay(vimState.mode)}</span>
						)}
					</div>
					<div className="flex items-center gap-4">
						<span>
							Ln {vimState.cursor.line + 1}, Col {vimState.cursor.column + 1}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function isInVisualSelection(
	line: number,
	col: number,
	start: { line: number; column: number },
	end: { line: number; column: number },
): boolean {
	const [s, e] =
		start.line < end.line ||
		(start.line === end.line && start.column <= end.column)
			? [start, end]
			: [end, start];

	if (line < s.line || line > e.line) return false;
	if (line === s.line && line === e.line) {
		return col >= s.column && col <= e.column;
	}
	if (line === s.line) return col >= s.column;
	if (line === e.line) return col <= e.column;
	return true;
}

export default VimputEditor;

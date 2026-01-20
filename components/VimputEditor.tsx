import { GripHorizontal, Save, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	createInitialState,
	getModeDisplay,
	processKey,
	type VimState,
} from "@/lib/vimEngine";

interface VimputEditorProps {
	initialText: string;
	onSave: (text: string) => void;
	onClose: () => void;
	fontSize?: number;
	theme?: "dark" | "light";
}

interface Position {
	x: number;
	y: number;
}

interface Size {
	width: number;
	height: number;
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
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const [size, setSize] = useState<Size>({ width: 700, height: 450 });
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

	const editorRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Center the editor on mount
	useEffect(() => {
		const centerX = (window.innerWidth - size.width) / 2;
		const centerY = (window.innerHeight - size.height) / 2;
		setPosition({ x: centerX, y: centerY });
	}, [size.height, size.width]);

	// Drag handlers
	const handleDragStart = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).closest("button")) return;
			setIsDragging(true);
			setDragOffset({
				x: e.clientX - position.x,
				y: e.clientY - position.y,
			});
		},
		[position],
	);

	const handleDrag = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;
			const newX = Math.max(
				0,
				Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width),
			);
			const newY = Math.max(
				0,
				Math.min(e.clientY - dragOffset.y, window.innerHeight - size.height),
			);
			setPosition({ x: newX, y: newY });
		},
		[isDragging, dragOffset, size],
	);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Resize handlers
	const handleResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizing(true);
	}, []);

	const handleResize = useCallback(
		(e: MouseEvent) => {
			if (!isResizing) return;
			const newWidth = Math.max(400, e.clientX - position.x);
			const newHeight = Math.max(300, e.clientY - position.y);
			setSize({ width: newWidth, height: newHeight });
		},
		[isResizing, position],
	);

	const handleResizeEnd = useCallback(() => {
		setIsResizing(false);
	}, []);

	// Add/remove mouse move/up listeners
	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleDrag);
			document.addEventListener("mouseup", handleDragEnd);
			return () => {
				document.removeEventListener("mousemove", handleDrag);
				document.removeEventListener("mouseup", handleDragEnd);
			};
		}
	}, [isDragging, handleDrag, handleDragEnd]);

	useEffect(() => {
		if (isResizing) {
			document.addEventListener("mousemove", handleResize);
			document.addEventListener("mouseup", handleResizeEnd);
			return () => {
				document.removeEventListener("mousemove", handleResize);
				document.removeEventListener("mouseup", handleResizeEnd);
			};
		}
	}, [isResizing, handleResize, handleResizeEnd]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Don't capture keys while dragging/resizing
			if (isDragging || isResizing) return;

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
		[vimState, onSave, onClose, isDragging, isResizing],
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

	const isDark = theme === "dark";

	return (
		<div
			ref={containerRef}
			className={cn(
				"absolute rounded-lg shadow-2xl border overflow-hidden flex flex-col",
				isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-300",
				(isDragging || isResizing) && "select-none",
			)}
			style={{
				left: position.x,
				top: position.y,
				width: size.width,
				height: size.height,
				pointerEvents: "auto",
				fontFamily:
					'"JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
			}}
		>
			{/* Title bar - draggable */}
			<div
				className={cn(
					"flex items-center justify-between px-3 py-2 cursor-move border-b",
					isDark
						? "bg-zinc-800 border-zinc-700"
						: "bg-zinc-100 border-zinc-300",
				)}
				onMouseDown={handleDragStart}
			>
				<div className="flex items-center gap-2">
					<GripHorizontal
						className={cn(
							"h-4 w-4",
							isDark ? "text-zinc-500" : "text-zinc-400",
						)}
					/>
					<span
						className={cn(
							"text-sm font-medium",
							isDark ? "text-zinc-100" : "text-zinc-900",
						)}
					>
						Vimput Editor
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onSave(vimState.text)}
						className={cn(
							"h-7 px-2",
							isDark
								? "hover:bg-zinc-700 text-zinc-300"
								: "hover:bg-zinc-200 text-zinc-700",
						)}
					>
						<Save className="h-3.5 w-3.5 mr-1" />
						<span className="text-xs">Save</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className={cn(
							"h-7 w-7 p-0 hover:bg-red-500 hover:text-white",
							isDark ? "text-zinc-400" : "text-zinc-600",
						)}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Editor content */}
			<div
				ref={editorRef}
				className={cn(
					"flex-1 overflow-auto font-mono outline-none",
					isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900",
				)}
				style={{ fontSize: `${fontSize}px`, lineHeight: "1.5" }}
			>
				<div className="flex min-h-full">
					{/* Line numbers */}
					<div
						className={cn(
							"flex-shrink-0 text-right pr-3 pl-2 select-none border-r sticky left-0",
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
													? "border-l-2 border-zinc-100"
													: isCursor
														? isDark
															? "bg-zinc-100 text-zinc-900"
															: "bg-zinc-800 text-zinc-100"
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
												"inline-block",
												vimState.mode === "insert"
													? "border-l-2 border-zinc-100 w-0"
													: isDark
														? "bg-zinc-100 w-2"
														: "bg-zinc-800 w-2",
											)}
										>
											{vimState.mode !== "insert" && "\u00A0"}
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

			{/* Resize handle */}
			<div
				className={cn(
					"absolute bottom-0 right-0 w-4 h-4 cursor-se-resize",
					isDark ? "hover:bg-zinc-700" : "hover:bg-zinc-200",
				)}
				onMouseDown={handleResizeStart}
			>
				<svg
					className={cn("w-4 h-4", isDark ? "text-zinc-600" : "text-zinc-400")}
					viewBox="0 0 16 16"
					fill="currentColor"
				>
					<path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14ZM14 6H12V4H14V6ZM10 10H8V8H10V10ZM6 14H4V12H6V14Z" />
				</svg>
			</div>
		</div>
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

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
import { type Theme, defaultDarkTheme } from "@/lib/themes";

interface VimputEditorProps {
	initialText: string;
	onSave: (text: string) => void;
	onClose: () => void;
	fontSize?: number;
	theme?: Theme;
	startInInsertMode?: boolean;
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
	theme = defaultDarkTheme,
	startInInsertMode = false,
}: VimputEditorProps) {
	const [vimState, setVimState] = useState<VimState>(() => {
		const state = createInitialState(initialText);
		if (startInInsertMode) {
			return { ...state, mode: "insert" as const };
		}
		return state;
	});
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const [size, setSize] = useState<Size>({ width: 700, height: 450 });
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

	const editorRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const colors = theme.colors;

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

	const handleSaveAndClose = useCallback(() => {
		onSave(vimState.text);
		onClose();
	}, [vimState.text, onSave, onClose]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			// Don't capture keys while dragging/resizing
			if (isDragging || isResizing) return;

			// Handle Cmd/Ctrl + Shift + S to save and close
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "s") {
				e.preventDefault();
				e.stopPropagation();
				handleSaveAndClose();
				return;
			}

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
		[vimState, onSave, onClose, isDragging, isResizing, handleSaveAndClose],
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

	return (
		<div
			ref={containerRef}
			className={cn(
				"absolute rounded-lg shadow-2xl overflow-hidden flex flex-col",
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
				backgroundColor: colors.background,
				borderWidth: "1px",
				borderStyle: "solid",
				borderColor: colors.border,
			}}
		>
			{/* Title bar - draggable */}
			<div
				className="flex items-center justify-between px-3 py-2 cursor-move"
				style={{
					backgroundColor: colors.headerBackground,
					borderBottomWidth: "1px",
					borderBottomStyle: "solid",
					borderBottomColor: colors.border,
				}}
				onMouseDown={handleDragStart}
			>
				<div className="flex items-center gap-2">
					<GripHorizontal
						className="h-4 w-4"
						style={{ color: colors.headerMutedText }}
					/>
					<span
						className="text-sm font-medium"
						style={{ color: colors.headerText }}
					>
						Vimput Editor
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onSave(vimState.text)}
						className="h-7 px-2"
						style={{
							color: colors.statusText,
						}}
					>
						<Save className="h-3.5 w-3.5 mr-1" />
						<span className="text-xs">Save</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-7 w-7 p-0"
						style={{ color: colors.headerMutedText }}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Editor content */}
			<div
				ref={editorRef}
				className="flex-1 overflow-auto font-mono outline-none"
				style={{
					fontSize: `${fontSize}px`,
					lineHeight: "1.5",
					backgroundColor: colors.editorBackground,
					color: colors.editorText,
				}}
			>
				<div className="flex min-h-full">
					{/* Line numbers */}
					<div
						className="flex-shrink-0 text-right pr-3 pl-2 select-none sticky left-0"
						style={{
							color: colors.lineNumberText,
							backgroundColor: colors.lineNumberBackground,
							borderRightWidth: "1px",
							borderRightStyle: "solid",
							borderRightColor: colors.lineNumberBorder,
						}}
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

									const style: React.CSSProperties = {};
									if (isCursor && vimState.mode === "insert") {
										style.borderLeft = `2px solid ${colors.cursorInsertBorder}`;
									} else if (isCursor) {
										style.backgroundColor = colors.cursorBackground;
										style.color = colors.cursorText;
									}
									if (isVisualSelected) {
										style.backgroundColor = colors.visualSelection;
									}

									return (
										<span key={charIndex} style={style}>
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
											className="inline-block"
											style={
												vimState.mode === "insert"
													? {
															borderLeft: `2px solid ${colors.cursorInsertBorder}`,
															width: 0,
														}
													: {
															backgroundColor: colors.cursorBackground,
															width: "0.5rem",
														}
											}
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
				className="flex items-center justify-between px-3 py-1 font-mono text-sm"
				style={{
					backgroundColor: colors.statusBackground,
					borderTopWidth: "1px",
					borderTopStyle: "solid",
					borderTopColor: colors.border,
					color: colors.statusText,
				}}
			>
				<div className="flex items-center gap-3">
					{vimState.mode === "command" ? (
						<span style={{ color: colors.commandText }}>
							{vimState.commandBuffer}
						</span>
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
				className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
				onMouseDown={handleResizeStart}
			>
				<svg
					className="w-4 h-4"
					style={{ color: colors.headerMutedText }}
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

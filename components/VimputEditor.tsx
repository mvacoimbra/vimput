import { GripHorizontal, LogOut, Menu, Save, X } from "lucide-react";
import { Highlight, type Language, themes } from "prism-react-renderer";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContentNoPortal,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContentNoPortal,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	defaultDarkTheme,
	type PrismThemeName,
	type Theme,
} from "@/lib/themes";
import { cn } from "@/lib/utils";
import {
	createInitialState,
	getModeDisplay,
	processKey,
	type VimState,
} from "@/lib/vimEngine";

// Map prism theme names to actual theme objects
const prismThemeMap: Record<PrismThemeName, typeof themes.vsDark> = {
	dracula: themes.dracula,
	duotoneDark: themes.duotoneDark,
	duotoneLight: themes.duotoneLight,
	github: themes.github,
	gruvboxMaterialDark: themes.gruvboxMaterialDark,
	gruvboxMaterialLight: themes.gruvboxMaterialLight,
	jettwaveDark: themes.jettwaveDark,
	jettwaveLight: themes.jettwaveLight,
	nightOwl: themes.nightOwl,
	nightOwlLight: themes.nightOwlLight,
	oceanicNext: themes.oceanicNext,
	okaidia: themes.okaidia,
	oneDark: themes.oneDark,
	oneLight: themes.oneLight,
	palenight: themes.palenight,
	shadesOfPurple: themes.shadesOfPurple,
	synthwave84: themes.synthwave84,
	ultramin: themes.ultramin,
	vsDark: themes.vsDark,
	vsLight: themes.vsLight,
};

// Supported languages for syntax highlighting
const SUPPORTED_LANGUAGES: { value: Language | "plaintext"; label: string }[] =
	[
		{ value: "plaintext", label: "Plain Text" },
		{ value: "javascript", label: "JavaScript" },
		{ value: "typescript", label: "TypeScript" },
		{ value: "jsx", label: "JSX" },
		{ value: "tsx", label: "TSX" },
		{ value: "python", label: "Python" },
		{ value: "css", label: "CSS" },
		{ value: "html", label: "HTML" },
		{ value: "json", label: "JSON" },
		{ value: "markdown", label: "Markdown" },
		{ value: "bash", label: "Bash" },
		{ value: "sql", label: "SQL" },
		{ value: "go", label: "Go" },
		{ value: "rust", label: "Rust" },
		{ value: "java", label: "Java" },
		{ value: "c", label: "C" },
		{ value: "cpp", label: "C++" },
		{ value: "yaml", label: "YAML" },
		{ value: "graphql", label: "GraphQL" },
	];

export interface VimputEditorRef {
	requestClose: () => void;
}

interface VimputEditorProps {
	initialText: string;
	onSave: (text: string) => void;
	onClose: () => void;
	fontSize?: number;
	theme?: Theme;
	startInInsertMode?: boolean;
	enterToSaveAndExit?: boolean;
	inputLabel?: string;
	initialLanguage?: string;
	onLanguageChange?: (language: string) => void;
}

interface Position {
	x: number;
	y: number;
}

interface Size {
	width: number;
	height: number;
}

export const VimputEditor = forwardRef<VimputEditorRef, VimputEditorProps>(
	function VimputEditor(
		{
			initialText,
			onSave,
			onClose,
			fontSize = 14,
			theme = defaultDarkTheme,
			startInInsertMode = false,
			enterToSaveAndExit = false,
			inputLabel,
			initialLanguage = "plaintext",
			onLanguageChange,
		},
		ref,
	) {
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
		const [cursorVisible, setCursorVisible] = useState(true);
		const [lastSavedText, setLastSavedText] = useState(initialText);
		const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
		const [selectedLanguage, setSelectedLanguage] = useState<
			Language | "plaintext"
		>(initialLanguage as Language | "plaintext");

		const handleLanguageChange = useCallback(
			(language: string) => {
				setSelectedLanguage(language as Language | "plaintext");
				onLanguageChange?.(language);
			},
			[onLanguageChange],
		);

		const editorRef = useRef<HTMLDivElement>(null);
		const containerRef = useRef<HTMLDivElement>(null);

		const hasUnsavedChanges = vimState.text !== lastSavedText;

		// Cursor blinking effect
		useEffect(() => {
			const blinkInterval = setInterval(() => {
				setCursorVisible((prev) => !prev);
			}, 530);

			return () => clearInterval(blinkInterval);
		}, []);

		// Reset cursor visibility when state changes (e.g., typing, moving)
		useEffect(() => {
			setCursorVisible(true);
		}, []);

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

		const handleSave = useCallback(() => {
			onSave(vimState.text);
			setLastSavedText(vimState.text);
		}, [vimState.text, onSave]);

		const handleSaveAndClose = useCallback(() => {
			handleSave();
			onClose();
		}, [handleSave, onClose]);

		const handleCloseRequest = useCallback(() => {
			if (hasUnsavedChanges) {
				setShowUnsavedDialog(true);
			} else {
				onClose();
			}
		}, [hasUnsavedChanges, onClose]);

		// Expose requestClose method to parent via ref
		useImperativeHandle(
			ref,
			() => ({
				requestClose: handleCloseRequest,
			}),
			[handleCloseRequest],
		);

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

				// Handle Enter to save and exit in normal mode if enabled
				if (
					enterToSaveAndExit &&
					vimState.mode === "normal" &&
					e.key === "Enter"
				) {
					e.preventDefault();
					e.stopPropagation();
					handleSaveAndClose();
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
			[
				vimState,
				onSave,
				onClose,
				isDragging,
				isResizing,
				handleSaveAndClose,
				enterToSaveAndExit,
			],
		);

		useEffect(() => {
			const editor = editorRef.current;
			if (editor) {
				editor.focus();
			}

			document.addEventListener("keydown", handleKeyDown, true);
			return () => {
				document.removeEventListener("keydown", handleKeyDown, true);
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
							className="text-sm font-medium truncate max-w-[300px]"
							style={{ color: colors.headerText }}
							title={inputLabel || "Vimput Editor"}
						>
							{inputLabel || "Vimput Editor"}
						</span>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 w-7 p-0"
								style={{ color: colors.headerMutedText }}
							>
								<Menu className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContentNoPortal
							align="end"
							style={{
								backgroundColor: colors.headerBackground,
								borderColor: colors.border,
								color: colors.headerText,
							}}
						>
							<DropdownMenuItem
								onClick={handleSave}
								className="cursor-pointer gap-2"
								style={{ color: colors.headerText }}
							>
								<Save className="h-4 w-4" />
								<span>Save</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleSaveAndClose}
								className="cursor-pointer gap-2"
								style={{ color: colors.headerText }}
							>
								<LogOut className="h-4 w-4" />
								<span>Save and Exit</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator
								style={{ backgroundColor: colors.border }}
							/>
							<DropdownMenuItem
								onClick={onClose}
								className="cursor-pointer gap-2"
								style={{ color: "#ef4444" }}
							>
								<X className="h-4 w-4" />
								<span>Exit without Save</span>
							</DropdownMenuItem>
						</DropdownMenuContentNoPortal>
					</DropdownMenu>
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
							{selectedLanguage === "plaintext" ? (
								// Plain text rendering (no highlighting)
								lines.map((line, lineIndex) => (
									<div
										key={lineIndex}
										className="whitespace-pre"
										style={{ lineHeight: "1.5em" }}
									>
										{renderLineWithCursor(
											line,
											lineIndex,
											vimState,
											colors,
											cursorVisible,
										)}
									</div>
								))
							) : (
								// Syntax highlighted rendering
								<Highlight
									theme={prismThemeMap[theme.prismTheme]}
									code={vimState.text}
									language={selectedLanguage}
								>
									{({ tokens: prismTokens, getTokenProps }) => (
										<>
											{prismTokens.map((lineTokens, lineIndex) => {
												// Process tokens to include styles from getTokenProps
												const styledTokens = lineTokens.map(
													(token, tokenIndex) => {
														const { style } = getTokenProps({
															token,
															key: tokenIndex,
														});
														return { content: token.content, style };
													},
												);
												return (
													<div
														key={lineIndex}
														className="whitespace-pre"
														style={{ lineHeight: "1.5em" }}
													>
														{renderHighlightedLine(
															styledTokens,
															lineIndex,
															vimState,
															colors,
															cursorVisible,
														)}
													</div>
												);
											})}
										</>
									)}
								</Highlight>
							)}
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
						<Select
							value={selectedLanguage}
							onValueChange={handleLanguageChange}
						>
							<SelectTrigger
								className="h-6 w-auto min-w-[100px] gap-1 border-0 bg-transparent px-2 py-0 text-xs focus:ring-0 focus:ring-offset-0"
								style={{ color: colors.statusText }}
								onKeyDown={(e) => e.stopPropagation()}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContentNoPortal
								side="top"
								align="end"
								className="max-h-[200px]"
								style={{
									backgroundColor: colors.headerBackground,
									borderColor: colors.border,
								}}
								onKeyDown={(e) => e.stopPropagation()}
							>
								{SUPPORTED_LANGUAGES.map((lang) => (
									<SelectItem
										key={lang.value}
										value={lang.value}
										className="text-xs cursor-pointer"
										style={{ color: colors.headerText }}
									>
										{lang.label}
									</SelectItem>
								))}
							</SelectContentNoPortal>
						</Select>
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

				{/* Unsaved changes confirmation dialog */}
				{showUnsavedDialog && (
					<div
						className="fixed inset-0 flex items-center justify-center"
						style={{
							backgroundColor: "rgba(0, 0, 0, 0.6)",
							zIndex: 10,
						}}
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setShowUnsavedDialog(false);
							}
						}}
					>
						<div
							className="rounded-lg p-6 shadow-xl max-w-sm w-full mx-4"
							style={{
								backgroundColor: colors.headerBackground,
								borderWidth: "1px",
								borderStyle: "solid",
								borderColor: colors.border,
							}}
						>
							<h3
								className="text-lg font-semibold mb-2"
								style={{ color: colors.headerText }}
							>
								Unsaved Changes
							</h3>
							<p className="text-sm mb-6" style={{ color: colors.statusText }}>
								You have unsaved changes. Are you sure you want to leave without
								saving?
							</p>
							<div className="flex gap-3 justify-end">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowUnsavedDialog(false)}
									style={{
										borderColor: colors.border,
										color: colors.headerText,
									}}
								>
									Cancel
								</Button>
								<Button
									variant="default"
									size="sm"
									onClick={() => {
										setShowUnsavedDialog(false);
										handleSaveAndClose();
									}}
									style={{
										backgroundColor: "#22c55e",
										color: "#ffffff",
									}}
								>
									Save and Exit
								</Button>
								<Button
									variant="default"
									size="sm"
									onClick={() => {
										setShowUnsavedDialog(false);
										onClose();
									}}
									style={{
										backgroundColor: "#ef4444",
										color: "#ffffff",
									}}
								>
									Leave without Saving
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	},
);

// Helper function to render a character with cursor and selection styling
function renderChar(
	char: string,
	charIndex: number,
	lineIndex: number,
	vimState: VimState,
	colors: Theme["colors"],
	cursorVisible: boolean,
	tokenStyle?: React.CSSProperties,
): React.ReactNode {
	const isCursor =
		lineIndex === vimState.cursor.line && charIndex === vimState.cursor.column;

	const isVisualSelected =
		vimState.mode === "visual" &&
		vimState.visualStart &&
		isInVisualSelection(
			lineIndex,
			charIndex,
			vimState.visualStart,
			vimState.cursor,
		);

	const isVisualLineSelected =
		vimState.mode === "visual-line" &&
		vimState.visualStart &&
		isInVisualLineSelection(
			lineIndex,
			vimState.visualStart.line,
			vimState.cursor.line,
		);

	const style: React.CSSProperties = { ...tokenStyle };

	if (isCursor && vimState.mode === "insert") {
		return (
			<span key={charIndex} className="relative">
				<span
					style={{
						color: colors.editorText,
						position: "absolute",
						left: 0,
						opacity: cursorVisible ? 1 : 0,
					}}
				>
					|
				</span>
				<span style={tokenStyle}>{char}</span>
			</span>
		);
	}

	if (isCursor && cursorVisible) {
		style.backgroundColor = colors.cursorBackground;
		style.color = colors.cursorText;
	}

	if (isVisualSelected || isVisualLineSelected) {
		style.backgroundColor = colors.visualSelection;
	}

	return (
		<span key={charIndex} style={style}>
			{char}
		</span>
	);
}

// Render cursor at end of line
function renderEndOfLineCursor(
	line: string,
	lineIndex: number,
	vimState: VimState,
	colors: Theme["colors"],
	cursorVisible: boolean,
): React.ReactNode {
	const isVisualLineEmpty =
		line.length === 0 &&
		vimState.mode === "visual-line" &&
		vimState.visualStart &&
		isInVisualLineSelection(
			lineIndex,
			vimState.visualStart.line,
			vimState.cursor.line,
		) &&
		lineIndex !== vimState.cursor.line;

	const isCursorAtEnd =
		(line.length === 0 ||
			(lineIndex === vimState.cursor.line &&
				vimState.cursor.column >= line.length)) &&
		lineIndex === vimState.cursor.line;

	return (
		<>
			{isVisualLineEmpty && (
				<span
					className="inline-block"
					style={{
						backgroundColor: colors.visualSelection,
						width: "0.5rem",
					}}
				>
					{"\u00A0"}
				</span>
			)}
			{isCursorAtEnd && (
				<span
					className="inline-block"
					style={
						vimState.mode === "insert"
							? {
									color: colors.editorText,
									opacity: cursorVisible ? 1 : 0,
								}
							: {
									backgroundColor: cursorVisible
										? colors.cursorBackground
										: "transparent",
									width: "0.5rem",
								}
					}
				>
					{vimState.mode === "insert" ? "|" : "\u00A0"}
				</span>
			)}
		</>
	);
}

// Render plain text line (no syntax highlighting)
function renderLineWithCursor(
	line: string,
	lineIndex: number,
	vimState: VimState,
	colors: Theme["colors"],
	cursorVisible: boolean,
): React.ReactNode {
	return (
		<>
			{line
				.split("")
				.map((char, charIndex) =>
					renderChar(
						char,
						charIndex,
						lineIndex,
						vimState,
						colors,
						cursorVisible,
					),
				)}
			{renderEndOfLineCursor(line, lineIndex, vimState, colors, cursorVisible)}
		</>
	);
}

// Render syntax highlighted line
function renderHighlightedLine(
	lineTokens: { content: string; style?: React.CSSProperties }[],
	lineIndex: number,
	vimState: VimState,
	colors: Theme["colors"],
	cursorVisible: boolean,
): React.ReactNode {
	let charIndex = 0;
	const elements: React.ReactNode[] = [];

	for (const token of lineTokens) {
		for (const char of token.content) {
			// Skip newline characters
			if (char === "\n") continue;

			elements.push(
				renderChar(
					char,
					charIndex,
					lineIndex,
					vimState,
					colors,
					cursorVisible,
					token.style,
				),
			);
			charIndex++;
		}
	}

	// Calculate actual line content (without newlines)
	const lineContent = lineTokens
		.map((t) => t.content.replace(/\n/g, ""))
		.join("");
	elements.push(
		renderEndOfLineCursor(
			lineContent,
			lineIndex,
			vimState,
			colors,
			cursorVisible,
		),
	);

	return elements;
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

function isInVisualLineSelection(
	line: number,
	startLine: number,
	endLine: number,
): boolean {
	const minLine = Math.min(startLine, endLine);
	const maxLine = Math.max(startLine, endLine);
	return line >= minLine && line <= maxLine;
}

export default VimputEditor;

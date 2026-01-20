export type VimMode = "normal" | "insert" | "visual" | "visual-line" | "command" | "replace-char" | "operator-pending";

export interface CursorPosition {
	line: number;
	column: number;
}

export interface VimState {
	mode: VimMode;
	text: string;
	cursor: CursorPosition;
	commandBuffer: string;
	yankBuffer: string;
	isLineYank: boolean;
	visualStart: CursorPosition | null;
	pendingOperator: string | null; // For operators like 'c', 'd' waiting for motion
}

export interface VimAction {
	type: string;
	payload?: unknown;
}

export function createInitialState(text: string = ""): VimState {
	return {
		mode: "normal",
		text,
		cursor: { line: 0, column: 0 },
		commandBuffer: "",
		yankBuffer: "",
		isLineYank: false,
		visualStart: null,
		pendingOperator: null,
	};
}

function getLines(text: string): string[] {
	return text.split("\n");
}

function joinLines(lines: string[]): string {
	return lines.join("\n");
}

function clampColumn(line: string, column: number, mode: VimMode): number {
	if (line.length === 0) return 0;
	const maxCol = mode === "insert" ? line.length : Math.max(0, line.length - 1);
	return Math.max(0, Math.min(column, maxCol));
}

function clampLine(lines: string[], line: number): number {
	return Math.max(0, Math.min(line, lines.length - 1));
}

export function processKey(state: VimState, key: string): VimState {
	const lines = getLines(state.text);
	const currentLine = lines[state.cursor.line] || "";

	// Handle command mode
	if (state.mode === "command") {
		if (key === "Enter") {
			return executeCommand(state);
		} else if (key === "Escape") {
			return { ...state, mode: "normal", commandBuffer: "" };
		} else if (key === "Backspace") {
			if (state.commandBuffer.length <= 1) {
				return { ...state, mode: "normal", commandBuffer: "" };
			}
			return { ...state, commandBuffer: state.commandBuffer.slice(0, -1) };
		} else if (key.length === 1) {
			return { ...state, commandBuffer: state.commandBuffer + key };
		}
		return state;
	}

	// Handle replace-char mode (r command)
	if (state.mode === "replace-char") {
		if (key === "Escape") {
			return { ...state, mode: "normal" };
		}
		if (key.length === 1 && currentLine.length > 0) {
			const newLine =
				currentLine.slice(0, state.cursor.column) +
				key +
				currentLine.slice(state.cursor.column + 1);
			lines[state.cursor.line] = newLine;
			return {
				...state,
				mode: "normal",
				text: joinLines(lines),
			};
		}
		return { ...state, mode: "normal" };
	}

	// Handle operator-pending mode (c, d with motion)
	if (state.mode === "operator-pending") {
		if (key === "Escape") {
			return { ...state, mode: "normal", pendingOperator: null, commandBuffer: "" };
		}
		return handleOperatorPending(state, key);
	}

	// Handle insert mode
	if (state.mode === "insert") {
		if (key === "Escape") {
			const newColumn = Math.max(0, state.cursor.column - 1);
			return {
				...state,
				mode: "normal",
				cursor: {
					...state.cursor,
					column: clampColumn(currentLine, newColumn, "normal"),
				},
			};
		}

		// Arrow keys for cursor movement in insert mode
		if (key === "ArrowLeft") {
			return {
				...state,
				cursor: {
					...state.cursor,
					column: Math.max(0, state.cursor.column - 1),
				},
			};
		}
		if (key === "ArrowRight") {
			return {
				...state,
				cursor: {
					...state.cursor,
					column: Math.min(currentLine.length, state.cursor.column + 1),
				},
			};
		}
		if (key === "ArrowUp") {
			if (state.cursor.line > 0) {
				const newLine = state.cursor.line - 1;
				const targetLine = lines[newLine] || "";
				return {
					...state,
					cursor: {
						line: newLine,
						column: Math.min(state.cursor.column, targetLine.length),
					},
				};
			}
			return state;
		}
		if (key === "ArrowDown") {
			if (state.cursor.line < lines.length - 1) {
				const newLine = state.cursor.line + 1;
				const targetLine = lines[newLine] || "";
				return {
					...state,
					cursor: {
						line: newLine,
						column: Math.min(state.cursor.column, targetLine.length),
					},
				};
			}
			return state;
		}

		if (key === "Backspace") {
			if (state.cursor.column > 0) {
				const newLine =
					currentLine.slice(0, state.cursor.column - 1) +
					currentLine.slice(state.cursor.column);
				lines[state.cursor.line] = newLine;
				return {
					...state,
					text: joinLines(lines),
					cursor: { ...state.cursor, column: state.cursor.column - 1 },
				};
			} else if (state.cursor.line > 0) {
				// Join with previous line
				const prevLine = lines[state.cursor.line - 1];
				const newColumn = prevLine.length;
				lines[state.cursor.line - 1] = prevLine + currentLine;
				lines.splice(state.cursor.line, 1);
				return {
					...state,
					text: joinLines(lines),
					cursor: { line: state.cursor.line - 1, column: newColumn },
				};
			}
			return state;
		}

		if (key === "Enter") {
			const before = currentLine.slice(0, state.cursor.column);
			const after = currentLine.slice(state.cursor.column);
			lines[state.cursor.line] = before;
			lines.splice(state.cursor.line + 1, 0, after);
			return {
				...state,
				text: joinLines(lines),
				cursor: { line: state.cursor.line + 1, column: 0 },
			};
		}

		if (key.length === 1) {
			const newLine =
				currentLine.slice(0, state.cursor.column) +
				key +
				currentLine.slice(state.cursor.column);
			lines[state.cursor.line] = newLine;
			return {
				...state,
				text: joinLines(lines),
				cursor: { ...state.cursor, column: state.cursor.column + 1 },
			};
		}

		return state;
	}

	// Handle visual mode
	if (state.mode === "visual") {
		if (key === "Escape") {
			return { ...state, mode: "normal", visualStart: null };
		}
		if (key === "y") {
			const yanked = getVisualSelection(state);
			return {
				...state,
				mode: "normal",
				yankBuffer: yanked,
				isLineYank: false,
				visualStart: null,
			};
		}
		if (key === "d" || key === "x") {
			return deleteVisualSelection(state);
		}
		if (key === "c") {
			return changeVisualSelection(state);
		}
		// Movement in visual mode
		return { ...state, ...handleNormalMovement(state, key) };
	}

	// Handle visual-line mode
	if (state.mode === "visual-line") {
		if (key === "Escape") {
			return { ...state, mode: "normal", visualStart: null };
		}
		if (key === "y") {
			const yanked = getVisualLineSelection(state);
			return {
				...state,
				mode: "normal",
				yankBuffer: yanked,
				isLineYank: true,
				visualStart: null,
			};
		}
		if (key === "d" || key === "x") {
			return deleteVisualLineSelection(state);
		}
		if (key === "c") {
			return changeVisualLineSelection(state);
		}
		// Movement in visual-line mode
		return { ...state, ...handleNormalMovement(state, key) };
	}

	// Handle normal mode
	if (state.mode === "normal") {
		// Enter command mode
		if (key === ":") {
			return { ...state, mode: "command", commandBuffer: ":" };
		}

		// Enter insert mode
		if (key === "i") {
			return { ...state, mode: "insert" };
		}
		if (key === "a") {
			const newColumn = Math.min(state.cursor.column + 1, currentLine.length);
			return {
				...state,
				mode: "insert",
				cursor: { ...state.cursor, column: newColumn },
			};
		}
		if (key === "I") {
			const firstNonSpace = currentLine.search(/\S/);
			const column = firstNonSpace === -1 ? 0 : firstNonSpace;
			return { ...state, mode: "insert", cursor: { ...state.cursor, column } };
		}
		if (key === "A") {
			return {
				...state,
				mode: "insert",
				cursor: { ...state.cursor, column: currentLine.length },
			};
		}
		if (key === "o") {
			lines.splice(state.cursor.line + 1, 0, "");
			return {
				...state,
				mode: "insert",
				text: joinLines(lines),
				cursor: { line: state.cursor.line + 1, column: 0 },
			};
		}
		if (key === "O") {
			lines.splice(state.cursor.line, 0, "");
			return {
				...state,
				mode: "insert",
				text: joinLines(lines),
				cursor: { line: state.cursor.line, column: 0 },
			};
		}

		// Enter visual mode
		if (key === "v") {
			return { ...state, mode: "visual", visualStart: { ...state.cursor } };
		}

		// Enter visual-line mode
		if (key === "V") {
			return { ...state, mode: "visual-line", visualStart: { ...state.cursor } };
		}

		// Replace character (r)
		if (key === "r") {
			return { ...state, mode: "replace-char" };
		}

		// Change operator (c)
		if (key === "c") {
			return { ...state, mode: "operator-pending", pendingOperator: "c", commandBuffer: "c" };
		}

		// Delete character
		if (key === "x") {
			if (currentLine.length > 0) {
				const newLine =
					currentLine.slice(0, state.cursor.column) +
					currentLine.slice(state.cursor.column + 1);
				lines[state.cursor.line] = newLine;
				return {
					...state,
					text: joinLines(lines),
					cursor: {
						...state.cursor,
						column: clampColumn(newLine, state.cursor.column, "normal"),
					},
				};
			}
			return state;
		}

		// Handle cc (change line)
		if (key === "c" && state.commandBuffer === "c") {
			const yanked = currentLine;
			lines[state.cursor.line] = "";
			return {
				...state,
				mode: "insert",
				text: joinLines(lines),
				cursor: { ...state.cursor, column: 0 },
				yankBuffer: yanked,
				isLineYank: true,
				commandBuffer: "",
			};
		}

		// Handle dd (delete line)
		if (key === "d" && state.commandBuffer === "d") {
			const yanked = currentLine;
			if (lines.length === 1) {
				lines[0] = "";
			} else {
				lines.splice(state.cursor.line, 1);
			}
			const newLine = clampLine(lines, state.cursor.line);
			return {
				...state,
				text: joinLines(lines),
				cursor: {
					line: newLine,
					column: clampColumn(lines[newLine] || "", 0, "normal"),
				},
				yankBuffer: yanked,
				isLineYank: true,
				commandBuffer: "",
			};
		}
		if (key === "d") {
			return { ...state, commandBuffer: "d" };
		}

		// Handle yy (yank line)
		if (key === "y" && state.commandBuffer === "y") {
			return {
				...state,
				yankBuffer: currentLine,
				isLineYank: true,
				commandBuffer: "",
			};
		}
		if (key === "y") {
			return { ...state, commandBuffer: "y" };
		}

		// Paste
		if (key === "p") {
			if (state.isLineYank) {
				// Line paste - create new line below with yanked content
				lines.splice(state.cursor.line + 1, 0, state.yankBuffer);
				return {
					...state,
					text: joinLines(lines),
					cursor: { line: state.cursor.line + 1, column: 0 },
				};
			} else if (state.yankBuffer) {
				// Character paste
				const newLine =
					currentLine.slice(0, state.cursor.column + 1) +
					state.yankBuffer +
					currentLine.slice(state.cursor.column + 1);
				lines[state.cursor.line] = newLine;
				return {
					...state,
					text: joinLines(lines),
					cursor: {
						...state.cursor,
						column: state.cursor.column + state.yankBuffer.length,
					},
				};
			}
			return state;
		}
		if (key === "P") {
			if (state.isLineYank) {
				// Line paste - create new line above with yanked content
				lines.splice(state.cursor.line, 0, state.yankBuffer);
				return {
					...state,
					text: joinLines(lines),
					cursor: { line: state.cursor.line, column: 0 },
				};
			} else if (state.yankBuffer) {
				// Character paste
				const newLine =
					currentLine.slice(0, state.cursor.column) +
					state.yankBuffer +
					currentLine.slice(state.cursor.column);
				lines[state.cursor.line] = newLine;
				return {
					...state,
					text: joinLines(lines),
				};
			}
			return state;
		}

		// Handle gg (go to first line)
		if (key === "g" && state.commandBuffer === "g") {
			return {
				...state,
				cursor: { line: 0, column: 0 },
				commandBuffer: "",
			};
		}
		if (key === "g" && !state.commandBuffer) {
			return { ...state, commandBuffer: "g" };
		}

		// Undo command buffer on other keys
		if (state.commandBuffer) {
			return { ...state, commandBuffer: "" };
		}

		// Movement
		return { ...state, ...handleNormalMovement(state, key) };
	}

	return state;
}

function handleNormalMovement(state: VimState, key: string): Partial<VimState> {
	const lines = getLines(state.text);
	const currentLine = lines[state.cursor.line] || "";
	const mode = state.mode;

	switch (key) {
		case "h":
		case "ArrowLeft":
			return {
				cursor: {
					...state.cursor,
					column: Math.max(0, state.cursor.column - 1),
				},
			};
		case "l":
		case "ArrowRight":
			return {
				cursor: {
					...state.cursor,
					column: clampColumn(currentLine, state.cursor.column + 1, mode),
				},
			};
		case "j":
		case "ArrowDown":
			if (state.cursor.line < lines.length - 1) {
				const newLine = state.cursor.line + 1;
				return {
					cursor: {
						line: newLine,
						column: clampColumn(
							lines[newLine] || "",
							state.cursor.column,
							mode,
						),
					},
				};
			}
			break;
		case "k":
		case "ArrowUp":
			if (state.cursor.line > 0) {
				const newLine = state.cursor.line - 1;
				return {
					cursor: {
						line: newLine,
						column: clampColumn(
							lines[newLine] || "",
							state.cursor.column,
							mode,
						),
					},
				};
			}
			break;
		case "w":
			return moveToNextWord(state);
		case "e":
			return moveToEndOfWord(state);
		case "b":
			return moveToPreviousWord(state);
		case "0":
			return { cursor: { ...state.cursor, column: 0 } };
		case "$":
			return {
				cursor: {
					...state.cursor,
					column: Math.max(0, currentLine.length - 1),
				},
			};
		case "G": {
			const lastLine = lines.length - 1;
			return {
				cursor: {
					line: lastLine,
					column: clampColumn(lines[lastLine] || "", 0, mode),
				},
			};
		}
		case "{":
			return moveToPreviousParagraph(state);
		case "}":
			return moveToNextParagraph(state);
	}

	return {};
}

function moveToNextWord(state: VimState): Partial<VimState> {
	const lines = getLines(state.text);
	let { line, column } = state.cursor;
	const currentLine = lines[line] || "";

	// Skip current word
	while (column < currentLine.length && /\w/.test(currentLine[column])) {
		column++;
	}
	// Skip whitespace
	while (column < currentLine.length && /\s/.test(currentLine[column])) {
		column++;
	}

	// If at end of line, move to next line
	if (column >= currentLine.length && line < lines.length - 1) {
		line++;
		column = 0;
		const nextLine = lines[line];
		// Skip leading whitespace
		while (column < nextLine.length && /\s/.test(nextLine[column])) {
			column++;
		}
	}

	return {
		cursor: {
			line,
			column: clampColumn(lines[line] || "", column, state.mode),
		},
	};
}

function moveToEndOfWord(state: VimState): Partial<VimState> {
	const lines = getLines(state.text);
	let { line, column } = state.cursor;
	const currentLine = lines[line] || "";

	// Move forward one to start searching
	if (column < currentLine.length - 1) {
		column++;
	}

	// Skip whitespace
	while (column < currentLine.length && /\s/.test(currentLine[column])) {
		column++;
	}

	// If at end of line, move to next line
	if (column >= currentLine.length && line < lines.length - 1) {
		line++;
		column = 0;
		const nextLine = lines[line];
		// Skip leading whitespace
		while (column < nextLine.length && /\s/.test(nextLine[column])) {
			column++;
		}
	}

	const targetLine = lines[line] || "";
	
	// Move to end of current word
	while (column < targetLine.length - 1 && /\w/.test(targetLine[column + 1])) {
		column++;
	}

	return {
		cursor: {
			line,
			column: clampColumn(lines[line] || "", column, state.mode),
		},
	};
}

function moveToPreviousWord(state: VimState): Partial<VimState> {
	const lines = getLines(state.text);
	let { line, column } = state.cursor;

	// Move back one if not at start
	if (column > 0) column--;

	const currentLine = lines[line] || "";

	// Skip whitespace
	while (column > 0 && /\s/.test(currentLine[column])) {
		column--;
	}
	// Skip to start of word
	while (column > 0 && /\w/.test(currentLine[column - 1])) {
		column--;
	}

	// If at start of line, move to previous line
	if (column === 0 && line > 0 && state.cursor.column === 0) {
		line--;
		const prevLine = lines[line];
		column = Math.max(0, prevLine.length - 1);
	}

	return { cursor: { line, column } };
}

function moveToPreviousParagraph(state: VimState): Partial<VimState> {
	const lines = getLines(state.text);
	let { line } = state.cursor;

	// Move up to find previous empty line (paragraph boundary)
	if (line > 0) line--;
	
	while (line > 0 && lines[line].trim() !== "") {
		line--;
	}

	return {
		cursor: {
			line,
			column: 0,
		},
	};
}

function moveToNextParagraph(state: VimState): Partial<VimState> {
	const lines = getLines(state.text);
	let { line } = state.cursor;

	// Move down to find next empty line (paragraph boundary)
	if (line < lines.length - 1) line++;
	
	while (line < lines.length - 1 && lines[line].trim() !== "") {
		line++;
	}

	return {
		cursor: {
			line,
			column: 0,
		},
	};
}

function handleOperatorPending(state: VimState, key: string): VimState {
	const lines = getLines(state.text);
	const currentLine = lines[state.cursor.line] || "";
	const operator = state.pendingOperator;
	const buffer = state.commandBuffer;

	// Handle ci and ca (change in/around)
	if (buffer === "c" && (key === "i" || key === "a")) {
		return {
			...state,
			commandBuffer: buffer + key,
		};
	}

	// Handle ciX and caX where X is a text object
	if ((buffer === "ci" || buffer === "ca") && key.length === 1) {
		const isInner = buffer === "ci";
		const result = findTextObject(state, key, isInner);
		
		if (result) {
			const { start, end, startLine, endLine } = result;
			
			// Delete the text object and enter insert mode
			if (startLine === endLine) {
				const line = lines[startLine];
				const yanked = line.slice(start, end);
				lines[startLine] = line.slice(0, start) + line.slice(end);
				return {
					...state,
					mode: "insert",
					text: joinLines(lines),
					cursor: { line: startLine, column: start },
					yankBuffer: yanked,
					isLineYank: false,
					pendingOperator: null,
					commandBuffer: "",
				};
			}
		}
		
		return { ...state, mode: "normal", pendingOperator: null, commandBuffer: "" };
	}

	// Handle cc (change line) - already handled in normal mode
	if (buffer === "c" && key === "c") {
		const yanked = currentLine;
		lines[state.cursor.line] = "";
		return {
			...state,
			mode: "insert",
			text: joinLines(lines),
			cursor: { ...state.cursor, column: 0 },
			yankBuffer: yanked,
			isLineYank: true,
			pendingOperator: null,
			commandBuffer: "",
		};
	}

	// Handle cw (change word)
	if (buffer === "c" && key === "w") {
		const { cursor } = moveToNextWord(state) as { cursor: CursorPosition };
		const endCol = cursor.line === state.cursor.line ? cursor.column : currentLine.length;
		const yanked = currentLine.slice(state.cursor.column, endCol);
		lines[state.cursor.line] = currentLine.slice(0, state.cursor.column) + currentLine.slice(endCol);
		return {
			...state,
			mode: "insert",
			text: joinLines(lines),
			yankBuffer: yanked,
			isLineYank: false,
			pendingOperator: null,
			commandBuffer: "",
		};
	}

	// Handle ce (change to end of word)
	if (buffer === "c" && key === "e") {
		const { cursor } = moveToEndOfWord(state) as { cursor: CursorPosition };
		const endCol = cursor.line === state.cursor.line ? cursor.column + 1 : currentLine.length;
		const yanked = currentLine.slice(state.cursor.column, endCol);
		lines[state.cursor.line] = currentLine.slice(0, state.cursor.column) + currentLine.slice(endCol);
		return {
			...state,
			mode: "insert",
			text: joinLines(lines),
			yankBuffer: yanked,
			isLineYank: false,
			pendingOperator: null,
			commandBuffer: "",
		};
	}

	// Handle c$ (change to end of line)
	if (buffer === "c" && key === "$") {
		const yanked = currentLine.slice(state.cursor.column);
		lines[state.cursor.line] = currentLine.slice(0, state.cursor.column);
		return {
			...state,
			mode: "insert",
			text: joinLines(lines),
			yankBuffer: yanked,
			isLineYank: false,
			pendingOperator: null,
			commandBuffer: "",
		};
	}

	// Handle c0 (change to start of line)
	if (buffer === "c" && key === "0") {
		const yanked = currentLine.slice(0, state.cursor.column);
		lines[state.cursor.line] = currentLine.slice(state.cursor.column);
		return {
			...state,
			mode: "insert",
			text: joinLines(lines),
			cursor: { ...state.cursor, column: 0 },
			yankBuffer: yanked,
			isLineYank: false,
			pendingOperator: null,
			commandBuffer: "",
		};
	}

	// Cancel on unknown key
	return { ...state, mode: "normal", pendingOperator: null, commandBuffer: "" };
}

function findTextObject(
	state: VimState,
	char: string,
	isInner: boolean,
): { start: number; end: number; startLine: number; endLine: number } | null {
	const lines = getLines(state.text);
	const currentLine = lines[state.cursor.line] || "";
	const col = state.cursor.column;

	// Pair characters
	const pairs: Record<string, [string, string]> = {
		"(": ["(", ")"],
		")": ["(", ")"],
		"[": ["[", "]"],
		"]": ["[", "]"],
		"{": ["{", "}"],
		"}": ["{", "}"],
		"<": ["<", ">"],
		">": ["<", ">"],
		'"': ['"', '"'],
		"'": ["'", "'"],
		"`": ["`", "`"],
	};

	// Word object
	if (char === "w") {
		// Find word boundaries
		let start = col;
		let end = col;

		// Find start of word
		while (start > 0 && /\w/.test(currentLine[start - 1])) {
			start--;
		}
		// Find end of word
		while (end < currentLine.length && /\w/.test(currentLine[end])) {
			end++;
		}

		if (!isInner) {
			// Include trailing whitespace for "aw"
			while (end < currentLine.length && /\s/.test(currentLine[end])) {
				end++;
			}
		}

		return { start, end, startLine: state.cursor.line, endLine: state.cursor.line };
	}

	// Pair objects
	if (pairs[char]) {
		const [open, close] = pairs[char];
		const isSameChar = open === close;

		if (isSameChar) {
			// For quotes, find the enclosing pair
			let start = currentLine.lastIndexOf(open, col);
			let end = currentLine.indexOf(close, col);
			
			// If cursor is on a quote, decide which direction
			if (currentLine[col] === open) {
				const nextQuote = currentLine.indexOf(close, col + 1);
				if (nextQuote !== -1) {
					start = col;
					end = nextQuote;
				}
			}

			if (start !== -1 && end !== -1 && start < end) {
				if (isInner) {
					return { start: start + 1, end, startLine: state.cursor.line, endLine: state.cursor.line };
				}
				return { start, end: end + 1, startLine: state.cursor.line, endLine: state.cursor.line };
			}
		} else {
			// For brackets, handle nesting
			let depth = 0;
			let start = -1;
			let end = -1;

			// Search backwards for opening bracket
			for (let i = col; i >= 0; i--) {
				if (currentLine[i] === close) depth++;
				if (currentLine[i] === open) {
					if (depth === 0) {
						start = i;
						break;
					}
					depth--;
				}
			}

			// Search forwards for closing bracket
			depth = 0;
			for (let i = col; i < currentLine.length; i++) {
				if (currentLine[i] === open) depth++;
				if (currentLine[i] === close) {
					if (depth === 0) {
						end = i;
						break;
					}
					depth--;
				}
			}

			if (start !== -1 && end !== -1) {
				if (isInner) {
					return { start: start + 1, end, startLine: state.cursor.line, endLine: state.cursor.line };
				}
				return { start, end: end + 1, startLine: state.cursor.line, endLine: state.cursor.line };
			}
		}
	}

	return null;
}

function getVisualSelection(state: VimState): string {
	if (!state.visualStart) return "";

	const lines = getLines(state.text);
	const start = state.visualStart;
	const end = state.cursor;

	// Normalize start and end
	const [s, e] =
		start.line < end.line ||
		(start.line === end.line && start.column <= end.column)
			? [start, end]
			: [end, start];

	if (s.line === e.line) {
		return lines[s.line].slice(s.column, e.column + 1);
	}

	let result = lines[s.line].slice(s.column);
	for (let i = s.line + 1; i < e.line; i++) {
		result += `\n${lines[i]}`;
	}
	result += `\n${lines[e.line].slice(0, e.column + 1)}`;
	return result;
}

function deleteVisualSelection(state: VimState): VimState {
	if (!state.visualStart) return { ...state, mode: "normal" };

	const lines = getLines(state.text);
	const start = state.visualStart;
	const end = state.cursor;

	const [s, e] =
		start.line < end.line ||
		(start.line === end.line && start.column <= end.column)
			? [start, end]
			: [end, start];

	const yanked = getVisualSelection(state);

	if (s.line === e.line) {
		const line = lines[s.line];
		lines[s.line] = line.slice(0, s.column) + line.slice(e.column + 1);
	} else {
		const firstPart = lines[s.line].slice(0, s.column);
		const lastPart = lines[e.line].slice(e.column + 1);
		lines.splice(s.line, e.line - s.line + 1, firstPart + lastPart);
	}

	return {
		...state,
		mode: "normal",
		text: joinLines(lines),
		cursor: {
			line: s.line,
			column: clampColumn(lines[s.line] || "", s.column, "normal"),
		},
		yankBuffer: yanked,
		visualStart: null,
	};
}

function changeVisualSelection(state: VimState): VimState {
	if (!state.visualStart) return { ...state, mode: "normal" };

	const lines = getLines(state.text);
	const start = state.visualStart;
	const end = state.cursor;

	const [s, e] =
		start.line < end.line ||
		(start.line === end.line && start.column <= end.column)
			? [start, end]
			: [end, start];

	const yanked = getVisualSelection(state);

	if (s.line === e.line) {
		const line = lines[s.line];
		lines[s.line] = line.slice(0, s.column) + line.slice(e.column + 1);
	} else {
		const firstPart = lines[s.line].slice(0, s.column);
		const lastPart = lines[e.line].slice(e.column + 1);
		lines.splice(s.line, e.line - s.line + 1, firstPart + lastPart);
	}

	return {
		...state,
		mode: "insert",
		text: joinLines(lines),
		cursor: {
			line: s.line,
			column: s.column,
		},
		yankBuffer: yanked,
		isLineYank: false,
		visualStart: null,
	};
}

function getVisualLineSelection(state: VimState): string {
	if (!state.visualStart) return "";

	const lines = getLines(state.text);
	const startLine = Math.min(state.visualStart.line, state.cursor.line);
	const endLine = Math.max(state.visualStart.line, state.cursor.line);

	const selectedLines = lines.slice(startLine, endLine + 1);
	return selectedLines.join("\n");
}

function deleteVisualLineSelection(state: VimState): VimState {
	if (!state.visualStart) return { ...state, mode: "normal" };

	const lines = getLines(state.text);
	const startLine = Math.min(state.visualStart.line, state.cursor.line);
	const endLine = Math.max(state.visualStart.line, state.cursor.line);

	const yanked = getVisualLineSelection(state);

	// Delete the selected lines
	if (lines.length === endLine - startLine + 1) {
		// All lines are being deleted, leave one empty line
		lines.splice(startLine, endLine - startLine + 1, "");
	} else {
		lines.splice(startLine, endLine - startLine + 1);
	}

	const newLine = clampLine(lines, startLine);

	return {
		...state,
		mode: "normal",
		text: joinLines(lines),
		cursor: {
			line: newLine,
			column: clampColumn(lines[newLine] || "", 0, "normal"),
		},
		yankBuffer: yanked,
		isLineYank: true,
		visualStart: null,
	};
}

function changeVisualLineSelection(state: VimState): VimState {
	if (!state.visualStart) return { ...state, mode: "normal" };

	const lines = getLines(state.text);
	const startLine = Math.min(state.visualStart.line, state.cursor.line);
	const endLine = Math.max(state.visualStart.line, state.cursor.line);

	const yanked = getVisualLineSelection(state);

	// Replace selected lines with a single empty line
	lines.splice(startLine, endLine - startLine + 1, "");

	return {
		...state,
		mode: "insert",
		text: joinLines(lines),
		cursor: {
			line: startLine,
			column: 0,
		},
		yankBuffer: yanked,
		isLineYank: true,
		visualStart: null,
	};
}

function executeCommand(state: VimState): VimState {
	const command = state.commandBuffer.slice(1); // Remove the ':'

	switch (command) {
		case "w":
			// Write - will be handled by the component
			return { ...state, mode: "normal", commandBuffer: "" };
		case "q":
			// Quit - will be handled by the component
			return { ...state, mode: "normal", commandBuffer: "" };
		case "wq":
			// Write and quit - will be handled by the component
			return { ...state, mode: "normal", commandBuffer: "" };
		case "q!":
			// Force quit - will be handled by the component
			return { ...state, mode: "normal", commandBuffer: "" };
		default:
			return { ...state, mode: "normal", commandBuffer: "" };
	}
}

export function getModeDisplay(mode: VimMode): string {
	switch (mode) {
		case "normal":
			return "-- NORMAL --";
		case "insert":
			return "-- INSERT --";
		case "visual":
			return "-- VISUAL --";
		case "visual-line":
			return "-- VISUAL LINE --";
		case "command":
			return "";
		case "replace-char":
			return "-- REPLACE --";
		case "operator-pending":
			return "-- OPERATOR --";
	}
}

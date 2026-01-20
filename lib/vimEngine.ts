export type VimMode = "normal" | "insert" | "visual" | "command";

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
		// Movement in visual mode
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
		case "g":
			if (state.commandBuffer === "g") {
				return { cursor: { line: 0, column: 0 }, commandBuffer: "" };
			}
			return { commandBuffer: "g" };
		case "G": {
			const lastLine = lines.length - 1;
			return {
				cursor: {
					line: lastLine,
					column: clampColumn(lines[lastLine] || "", 0, mode),
				},
			};
		}
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
		case "command":
			return "";
	}
}

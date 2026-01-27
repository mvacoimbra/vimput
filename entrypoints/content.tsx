import { createRef } from "react";
import ReactDOM from "react-dom/client";
import { VimputEditor, type VimputEditorRef } from "@/components/VimputEditor";
import globalsCss from "@/lib/globals.css?inline";
import {
	defaultDarkTheme,
	getThemeById,
	type Theme,
	type ThemeColors,
} from "@/lib/themes";

type EditableElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

// Store reference to the currently focused editable element
let activeElement: EditableElement | null = null;
let editorRoot: ReactDOM.Root | null = null;
let shadowHost: HTMLDivElement | null = null;
let editorRef: React.RefObject<VimputEditorRef | null> | null = null;

function isPasswordField(element: HTMLElement): boolean {
	if (element instanceof HTMLInputElement) {
		return element.type === "password";
	}
	return false;
}

function isEditableElement(element: HTMLElement): boolean {
	// Ignore password fields
	if (isPasswordField(element)) {
		return false;
	}

	// Standard input/textarea
	if (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement
	) {
		return true;
	}

	// Contenteditable elements
	if (element.isContentEditable) {
		return true;
	}

	// Check for common code editor classes/attributes
	if (
		element.classList.contains("monaco-editor") ||
		element.classList.contains("CodeMirror") ||
		element.classList.contains("ace_editor") ||
		element.closest(".ace_editor") ||
		element.closest(".monaco-editor") ||
		element.getAttribute("role") === "textbox" ||
		element.getAttribute("role") === "code"
	) {
		return true;
	}

	return false;
}

function findEditableElement(element: HTMLElement): EditableElement | null {
	// Check the element itself
	if (isEditableElement(element)) {
		return element;
	}

	// Look for hidden textarea (Monaco pattern)
	const textarea = element.querySelector("textarea");
	if (textarea) {
		return textarea;
	}

	// Look for contenteditable child
	const contentEditable = element.querySelector("[contenteditable='true']");
	if (contentEditable instanceof HTMLElement) {
		return contentEditable;
	}

	// Walk up the DOM tree to find an editable parent
	let parent = element.parentElement;
	while (parent) {
		if (isEditableElement(parent)) {
			return parent;
		}
		parent = parent.parentElement;
	}

	return null;
}

function getElementText(element: EditableElement): string {
	if (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement
	) {
		return element.value;
	}

	// Check if this is an Ace editor
	const aceEditor = element.closest(".ace_editor");
	if (aceEditor) {
		// Try to use Ace API if available
		const win = window as Window & {
			ace?: {
				edit: (
					el: Element,
				) => { getValue: () => string; setValue: (v: string) => void } | null;
			};
		};
		if (win.ace?.edit) {
			try {
				const editor = win.ace.edit(aceEditor);
				if (editor?.getValue) {
					return editor.getValue();
				}
			} catch {
				// Ace may throw if element is not initialized
			}
		}

		// Fallback: get text from ace_line elements only (not gutter)
		const textLayer = aceEditor.querySelector(".ace_text-layer");
		if (textLayer) {
			const lines: string[] = [];
			textLayer.querySelectorAll(".ace_line").forEach((line) => {
				lines.push(line.textContent || "");
			});
			return lines.join("\n");
		}
	}

	// Check if this is a Monaco editor
	const monacoEditor = element.closest(".monaco-editor");
	if (monacoEditor) {
		// Try to access Monaco API if available
		const win = window as Window & {
			monaco?: {
				editor: {
					getModels: () => Array<{ getValue: () => string }>;
				};
			};
		};
		if (win.monaco?.editor?.getModels) {
			const models = win.monaco.editor.getModels();
			if (models.length > 0) {
				return models[0].getValue();
			}
		}

		// Fallback: try to get text from the view lines only (not line numbers)
		const viewLines = monacoEditor.querySelector(".view-lines");
		if (viewLines) {
			const lines: string[] = [];
			viewLines.querySelectorAll(".view-line").forEach((line) => {
				lines.push(line.textContent || "");
			});
			return lines.join("\n");
		}
	}

	// For contenteditable elements, get the text content
	return element.innerText || element.textContent || "";
}

function setElementText(element: EditableElement, text: string): void {
	if (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement
	) {
		element.value = text;
		element.dispatchEvent(new Event("input", { bubbles: true }));
		element.dispatchEvent(new Event("change", { bubbles: true }));
		return;
	}

	// Check if this is an Ace editor
	const aceEditor = element.closest(".ace_editor");
	if (aceEditor) {
		// Try to use Ace API if available
		const win = window as Window & {
			ace?: {
				edit: (
					el: Element,
				) => { getValue: () => string; setValue: (v: string) => void } | null;
			};
		};
		if (win.ace?.edit) {
			try {
				const editor = win.ace.edit(aceEditor);
				if (editor?.setValue) {
					editor.setValue(text);
					return;
				}
			} catch {
				// Ace may throw if element is not initialized
			}
		}

		// Fallback: try to use the textarea
		const aceTextarea = aceEditor.querySelector(
			"textarea.ace_text-input",
		) as HTMLTextAreaElement | null;
		if (aceTextarea) {
			aceTextarea.focus();
			document.execCommand("selectAll", false);
			document.execCommand("insertText", false, text);
			return;
		}
	}

	// Check if this is a Monaco editor
	const monacoEditor = element.closest(".monaco-editor");
	if (monacoEditor) {
		// Try to use Monaco API if available
		const win = window as Window & {
			monaco?: {
				editor: {
					getModels: () => Array<{
						getValue: () => string;
						setValue: (value: string) => void;
					}>;
				};
			};
		};
		if (win.monaco?.editor?.getModels) {
			const models = win.monaco.editor.getModels();
			if (models.length > 0) {
				models[0].setValue(text);
				return;
			}
		}

		// Fallback: try to use the textarea and trigger input
		const monacoTextarea = monacoEditor.querySelector(
			"textarea.inputarea",
		) as HTMLTextAreaElement | null;
		if (monacoTextarea) {
			monacoTextarea.focus();
			document.execCommand("selectAll", false);
			document.execCommand("insertText", false, text);
			return;
		}
	}

	// For contenteditable elements
	element.innerText = text;
	element.dispatchEvent(new Event("input", { bubbles: true }));
}

function getElementLabel(element: EditableElement): string | undefined {
	// Check for associated label via 'for' attribute
	if (element.id) {
		const label = document.querySelector(`label[for="${element.id}"]`);
		if (label?.textContent?.trim()) {
			return label.textContent.trim();
		}
	}

	// Check for parent label element
	const parentLabel = element.closest("label");
	if (parentLabel?.textContent?.trim()) {
		// Get only the label text, not the input's value
		const labelText = Array.from(parentLabel.childNodes)
			.filter((node) => node.nodeType === Node.TEXT_NODE)
			.map((node) => node.textContent?.trim())
			.filter(Boolean)
			.join(" ");
		if (labelText) {
			return labelText;
		}
	}

	// Check aria-label
	const ariaLabel = element.getAttribute("aria-label");
	if (ariaLabel?.trim()) {
		return ariaLabel.trim();
	}

	// Check aria-labelledby
	const ariaLabelledBy = element.getAttribute("aria-labelledby");
	if (ariaLabelledBy) {
		const labelElement = document.getElementById(ariaLabelledBy);
		if (labelElement?.textContent?.trim()) {
			return labelElement.textContent.trim();
		}
	}

	// Check placeholder as fallback
	if (
		element instanceof HTMLInputElement ||
		element instanceof HTMLTextAreaElement
	) {
		if (element.placeholder?.trim()) {
			return element.placeholder.trim();
		}
	}

	// Check title attribute
	const title = element.getAttribute("title");
	if (title?.trim()) {
		return title.trim();
	}

	return undefined;
}

export default defineContentScript({
	matches: ["<all_urls>"],
	cssInjectionMode: "ui",

	main() {
		// Track focused editable elements
		document.addEventListener(
			"focusin",
			(e) => {
				const target = e.target as HTMLElement;
				const editable = findEditableElement(target);
				if (editable) {
					activeElement = editable;
				}
			},
			true,
		);

		document.addEventListener(
			"contextmenu",
			(e) => {
				const target = e.target as HTMLElement;
				const editable = findEditableElement(target);
				if (editable) {
					activeElement = editable;
				}
			},
			true,
		);

		// Handle click on editable elements to open editor if enabled
		document.addEventListener(
			"click",
			async (e) => {
				const target = e.target as HTMLElement;
				const editable = findEditableElement(target);
				if (editable) {
					activeElement = editable;
					const config = await getConfig();
					if (config.openOnClick) {
						// Small delay to ensure focus is set
						setTimeout(() => {
							openEditor();
						}, 50);
					}
				}
			},
			true,
		);

		// Listen for messages from background script
		browser.runtime.onMessage.addListener((message) => {
			if (message.type === "OPEN_VIMPUT_EDITOR") {
				openEditor();
			}
		});

		console.log("Vimput content script loaded");
	},
});

interface EditorConfig {
	theme: Theme;
	fontSize: number;
	openOnClick: boolean;
	enterToSaveAndExit: boolean;
	confirmOnBackdropClick: boolean;
	syntaxLanguage: string;
}

async function getConfig(): Promise<EditorConfig> {
	try {
		const result = await browser.storage.sync.get([
			"themeId",
			"customColors",
			"fontSize",
			"openOnClick",
			"enterToSaveAndExit",
			"confirmOnBackdropClick",
			"syntaxLanguage",
		]);

		const themeId = (result.themeId as string) || "default-dark";
		const customColors = (result.customColors as Partial<ThemeColors>) || {};
		const baseTheme = getThemeById(themeId) || defaultDarkTheme;

		const theme: Theme =
			Object.keys(customColors).length > 0
				? {
						...baseTheme,
						id: "custom",
						name: `${baseTheme.name} (Custom)`,
						colors: { ...baseTheme.colors, ...customColors },
					}
				: baseTheme;

		return {
			theme,
			fontSize: (result.fontSize as number) || 14,
			openOnClick: (result.openOnClick as boolean) ?? false,
			enterToSaveAndExit: (result.enterToSaveAndExit as boolean) ?? true,
			confirmOnBackdropClick:
				(result.confirmOnBackdropClick as boolean) ?? false,
			syntaxLanguage: (result.syntaxLanguage as string) || "plaintext",
		};
	} catch {
		return {
			theme: defaultDarkTheme,
			fontSize: 14,
			openOnClick: false,
			enterToSaveAndExit: true,
			confirmOnBackdropClick: false,
			syntaxLanguage: "plaintext",
		};
	}
}

async function openEditor(startInInsertMode = false) {
	if (!activeElement) {
		console.warn("No active editable element found");
		return;
	}

	// Don't open editor for password fields
	if (isPasswordField(activeElement)) {
		return;
	}

	// Don't open multiple editors
	if (shadowHost) {
		closeEditor();
	}

	const config = await getConfig();
	const initialText = getElementText(activeElement);
	const shouldStartInInsertMode = startInInsertMode;

	// Create shadow DOM host for style isolation
	shadowHost = document.createElement("div");
	shadowHost.id = "vimput-editor-host";
	shadowHost.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2147483647;
  `;

	const shadow = shadowHost.attachShadow({ mode: "open" });

	// Inject styles into shadow DOM
	const style = document.createElement("style");
	style.textContent =
		globalsCss +
		`
    * {
      box-sizing: border-box;
    }
    :host {
      all: initial;
    }
  `;
	shadow.appendChild(style);

	// Create backdrop for clicking outside
	const backdrop = document.createElement("div");
	backdrop.id = "vimput-backdrop";
	backdrop.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  `;
	backdrop.addEventListener("click", () => {
		// Request close through the editor ref to check for unsaved changes
		if (editorRef?.current) {
			editorRef.current.requestClose();
		} else {
			closeEditor();
		}
	});
	shadow.appendChild(backdrop);

	// Create container for React
	const container = document.createElement("div");
	container.id = "vimput-editor-container";
	container.className = config.theme.baseTheme === "dark" ? "dark" : "";
	container.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  `;
	shadow.appendChild(container);

	document.body.appendChild(shadowHost);

	// Store reference to the target element
	const targetElement = activeElement;

	// Create ref for the editor
	editorRef = createRef<VimputEditorRef>();

	// Get the label for the input element
	const inputLabel = getElementLabel(targetElement);

	// Render React component
	editorRoot = ReactDOM.createRoot(container);
	editorRoot.render(
		<VimputEditor
			ref={editorRef}
			initialText={initialText}
			theme={config.theme}
			fontSize={config.fontSize}
			startInInsertMode={shouldStartInInsertMode}
			enterToSaveAndExit={config.enterToSaveAndExit}
			confirmOnBackdropClick={config.confirmOnBackdropClick}
			inputLabel={inputLabel}
			initialLanguage={config.syntaxLanguage}
			onLanguageChange={async (language) => {
				try {
					await browser.storage.sync.set({ syntaxLanguage: language });
				} catch (error) {
					console.error("Failed to save syntax language:", error);
				}
			}}
			onSave={(text) => {
				if (targetElement) {
					setElementText(targetElement, text);
				}
			}}
			onClose={closeEditor}
		/>,
	);
}

function closeEditor() {
	if (editorRoot) {
		editorRoot.unmount();
		editorRoot = null;
	}

	if (shadowHost) {
		shadowHost.remove();
		shadowHost = null;
	}

	editorRef = null;
}

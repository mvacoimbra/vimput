import ReactDOM from "react-dom/client";
import { createRef } from "react";
import { VimputEditor, type VimputEditorRef } from "@/components/VimputEditor";
import globalsCss from "@/lib/globals.css?inline";
import {
	type Theme,
	type ThemeColors,
	defaultDarkTheme,
	getThemeById,
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
	} else {
		// For contenteditable elements
		element.innerText = text;
		element.dispatchEvent(new Event("input", { bubbles: true }));
	}
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
}

async function getConfig(): Promise<EditorConfig> {
	try {
		const result = await browser.storage.sync.get([
			"themeId",
			"customColors",
			"fontSize",
			"openOnClick",
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
		};
	} catch {
		return { theme: defaultDarkTheme, fontSize: 14, openOnClick: false };
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
	const shouldStartInInsertMode = startInInsertMode || config.openOnClick;

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

	// Render React component
	editorRoot = ReactDOM.createRoot(container);
	editorRoot.render(
		<VimputEditor
			ref={editorRef}
			initialText={initialText}
			theme={config.theme}
			fontSize={config.fontSize}
			startInInsertMode={shouldStartInInsertMode}
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

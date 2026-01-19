import ReactDOM from "react-dom/client";
import { VimputEditor } from "@/components/VimputEditor";
import globalsCss from "@/lib/globals.css?inline";

// Store reference to the currently focused input/textarea
let activeElement: HTMLInputElement | HTMLTextAreaElement | null = null;
let editorRoot: ReactDOM.Root | null = null;
let shadowHost: HTMLDivElement | null = null;

export default defineContentScript({
	matches: ["<all_urls>"],
	cssInjectionMode: "ui",

	main() {
		// Track focused editable elements
		document.addEventListener(
			"focusin",
			(e) => {
				const target = e.target as HTMLElement;
				if (
					target instanceof HTMLInputElement ||
					target instanceof HTMLTextAreaElement
				) {
					activeElement = target;
				}
			},
			true,
		);

		document.addEventListener(
			"contextmenu",
			(e) => {
				const target = e.target as HTMLElement;
				if (
					target instanceof HTMLInputElement ||
					target instanceof HTMLTextAreaElement
				) {
					activeElement = target;
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

async function getConfig(): Promise<{
	theme: "dark" | "light";
	fontSize: number;
}> {
	try {
		const result = await browser.storage.sync.get(["theme", "fontSize"]);
		return {
			theme: (result.theme as "dark" | "light") || "dark",
			fontSize: result.fontSize || 14,
		};
	} catch {
		return { theme: "dark", fontSize: 14 };
	}
}

async function openEditor() {
	if (!activeElement) {
		console.warn("No active input element found");
		return;
	}

	// Don't open multiple editors
	if (shadowHost) {
		closeEditor();
	}

	const config = await getConfig();
	const initialText = activeElement.value || "";

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
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
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

	// Create container for React
	const container = document.createElement("div");
	container.id = "vimput-editor-container";
	container.className = config.theme === "dark" ? "dark" : "";
	shadow.appendChild(container);

	document.body.appendChild(shadowHost);

	// Store reference to the target element
	const targetElement = activeElement;

	// Render React component
	editorRoot = ReactDOM.createRoot(container);
	editorRoot.render(
		<VimputEditor
			initialText={initialText}
			theme={config.theme}
			fontSize={config.fontSize}
			onSave={(text) => {
				if (targetElement) {
					targetElement.value = text;
					// Trigger input event for frameworks that listen to it
					targetElement.dispatchEvent(new Event("input", { bubbles: true }));
					targetElement.dispatchEvent(new Event("change", { bubbles: true }));
				}
			}}
			onClose={closeEditor}
		/>,
	);

	// Close on escape (handled by the editor) or click outside
	shadowHost.addEventListener("click", (e) => {
		if (e.target === shadowHost) {
			closeEditor();
		}
	});
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
}

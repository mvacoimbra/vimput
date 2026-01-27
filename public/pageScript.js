// Vimput Page Script - Injected to access Monaco/Ace APIs
(function () {
	// Listen for requests from content script to get editor text
	window.addEventListener("vimput-get-editor-text", function () {
		let text = null;
		let editorType = null;

		// Try TypeScript Playground sandbox.editor
		if (window.sandbox?.editor?.getValue) {
			try {
				text = window.sandbox.editor.getValue();
				editorType = "sandbox";
			} catch (err) {
				console.error("[Vimput] sandbox.editor.getValue error:", err);
			}
		}

		// Try Monaco editor
		if (!text && window.monaco?.editor?.getModels) {
			try {
				const models = window.monaco.editor.getModels();
				if (models.length > 0) {
					text = models[0].getValue();
					editorType = "monaco";
				}
			} catch (err) {
				console.error("[Vimput] monaco.editor.getValue error:", err);
			}
		}

		// Try Ace editor
		if (!text && window.ace?.edit) {
			try {
				const aceEl = document.querySelector(".ace_editor");
				if (aceEl) {
					const editor = window.ace.edit(aceEl);
					if (editor?.getValue) {
						text = editor.getValue();
						editorType = "ace";
					}
				}
			} catch (err) {
				console.error("[Vimput] ace.editor.getValue error:", err);
			}
		}

		window.dispatchEvent(
			new CustomEvent("vimput-editor-text-response", {
				detail: { text, editorType },
			}),
		);
	});

	// Listen for requests from content script to set editor text
	window.addEventListener("vimput-set-editor-text", function (e) {
		const text = e.detail.text;
		let success = false;

		// Try TypeScript Playground sandbox.editor (uses Monaco under the hood)
		if (window.sandbox?.editor) {
			try {
				const editor = window.sandbox.editor;
				const model = editor.getModel?.();
				if (model) {
					// Use pushEditOperations for clean full replacement
					const fullRange = model.getFullModelRange();
					model.pushEditOperations(
						[],
						[{ range: fullRange, text: text }],
						() => null,
					);
					editor.setPosition?.({ lineNumber: 1, column: 1 });
					editor.focus?.();
					success = true;
				}
			} catch (err) {
				console.error("[Vimput] sandbox.editor set error:", err);
			}
		}

		// Try generic Monaco editor
		if (!success && window.monaco?.editor) {
			try {
				const editors = window.monaco.editor.getEditors?.() || [];
				if (editors.length > 0) {
					const editor = editors[0];
					const model = editor.getModel?.();
					if (model) {
						const fullRange = model.getFullModelRange();
						model.pushEditOperations(
							[],
							[{ range: fullRange, text: text }],
							() => null,
						);
						editor.setPosition?.({ lineNumber: 1, column: 1 });
						editor.focus?.();
						success = true;
					}
				}
			} catch (err) {
				console.error("[Vimput] monaco.editor set error:", err);
			}
		}

		// Try Ace editor
		if (!success && window.ace?.edit) {
			try {
				const aceEl = document.querySelector(".ace_editor");
				if (aceEl) {
					const editor = window.ace.edit(aceEl);
					if (editor?.setValue) {
						// Ace setValue: second param -1 moves cursor to start
						editor.setValue(text, -1);
						success = true;
					}
				}
			} catch (err) {
				console.error("[Vimput] ace.editor set error:", err);
			}
		}

		window.dispatchEvent(
			new CustomEvent("vimput-set-text-response", {
				detail: { success },
			}),
		);
	});

	console.log("[Vimput] Page script loaded successfully");
})();
